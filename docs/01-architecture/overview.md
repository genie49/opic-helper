# 아키텍처 개요 (Architecture Overview)

## 📋 목차
- [전체 시스템 구조](#전체-시스템-구조)
- [컴포넌트별 역할](#컴포넌트별-역할)
- [데이터 흐름](#데이터-흐름)
- [기술 스택 요약](#기술-스택-요약)
- [주요 설계 결정](#주요-설계-결정)
- [보안 및 인증](#보안-및-인증)

---

## 전체 시스템 구조

```
┌──────────────────────────────────────────────────────────────────┐
│                         사용자 (Browser)                          │
│  - Chrome 113+ (WebGPU 지원)                                      │
│  - HTTPS 연결 필수                                                │
└────────────────┬─────────────────────────────────────────────────┘
                 │
                 │ Google OAuth 로그인
                 │
┌────────────────▼─────────────────────────────────────────────────┐
│                   Supabase Auth                                   │
│  - Google OAuth 인증                                              │
│  - JWT 토큰 발급                                                  │
│  - 세션 관리 (자동 갱신)                                          │
└────────────────┬─────────────────────────────────────────────────┘
                 │ JWT Token
                 │
┌────────────────▼─────────────────────────────────────────────────┐
│                Frontend (Next.js 14 - Vercel)                     │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  UI 레이어                                               │    │
│  │  - shadcn/ui (Tailwind CSS)                             │    │
│  │  - Zustand (상태 관리)                                  │    │
│  │  - React Hook Form (폼 관리)                            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  STT 레이어 (클라이언트 사이드)                          │    │
│  │  - Whisper WebGPU (Transformers.js)                     │    │
│  │  - MediaRecorder API (음성 녹음)                        │    │
│  │  - 단어별 Confidence Score 추출                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  통신 레이어                                             │    │
│  │  - HTTP/REST (DB 작업)                                  │    │
│  │  - EventSource (SSE - AI 작업)                          │    │
│  └─────────────────────────────────────────────────────────┘    │
└────────┬──────────────────────────────────┬───────────────────────┘
         │                                  │
         │ HTTP/REST                        │ SSE (Server-Sent Events)
         │ (인증 필수)                      │ (인증 필수)
         │                                  │
┌────────▼──────────────────┐    ┌─────────▼───────────────────────┐
│  Next.js API Routes       │    │  FastAPI (AI Agent Server)      │
│  (Vercel Serverless)      │    │  (Vercel Functions / Cloud Run) │
│                           │    │                                 │
│  역할:                    │    │  역할:                          │
│  - 인증 검증 (JWT)        │    │  - 인증 검증 (JWT)              │
│  - DB CRUD 작업           │    │  - LangChain Agents 실행        │
│  - 문제 선택 로직         │    │  - 답변 평가 (SSE 스트리밍)     │
│  - 피드백 저장            │    │  - 문제 생성 (Phase 3)          │
│  - 사용자 수준 업데이트   │    │                                 │
│                           │    │                                 │
│  기술 스택:               │    │  기술 스택:                     │
│  - TypeScript             │    │  - Python 3.11+                 │
│  - Drizzle ORM            │    │  - LangChain                    │
│  - Supabase Client        │    │  - Grok (xAI) LLM               │
│                           │    │  - Supabase Client (읽기 전용)  │
│                           │    │  - sse-starlette                │
└────────┬──────────────────┘    └─────────┬───────────────────────┘
         │                                 │
         │ Supabase Client                 │ Supabase Client
         │ (Drizzle ORM)                   │ (읽기 전용)
         │                                 │
         └────────────┬────────────────────┘
                      │
         ┌────────────▼─────────────────────────────────────────────┐
         │         Database (Supabase - PostgreSQL 15+)             │
         │                                                           │
         │  테이블:                                                  │
         │  - users (Supabase Auth 관리)                            │
         │  - user_profiles (프로필, 수준)                          │
         │  - opic_levels (등급 마스터)                             │
         │  - questions (문제 풀)                                   │
         │  - feedbacks (평가 이력)                                 │
         │  - survey_selections (서베이 선택)                       │
         │  - user_question_mastery (숙달도)                        │
         │  - question_weights (가중치)                             │
         │                                                           │
         │  보안:                                                    │
         │  - Row Level Security (RLS) 활성화                       │
         │  - 사용자별 데이터 격리                                  │
         │                                                           │
         │  마이그레이션:                                            │
         │  - Drizzle ORM (Next.js에서 관리)                        │
         │  - 단일 진실 공급원 (Single Source of Truth)             │
         └───────────────────────────────────────────────────────────┘
```

---

## 컴포넌트별 역할

### 1. Frontend (Next.js 14)

**책임:**
- 사용자 인터페이스 제공
- 클라이언트 사이드 음성 인식 (Whisper WebGPU)
- 사용자 상태 관리 (Zustand)
- 두 개의 백엔드와 통신 (Next.js API + FastAPI)

**주요 기능:**
- 로그인/로그아웃 (Supabase Auth)
- 서베이 작성
- 문제 풀이 인터페이스
- 음성 녹음 및 STT 처리
- 실시간 평가 진행 상황 표시 (SSE)
- 피드백 표시 및 대시보드

**핵심 기술:**
- Next.js 14 App Router
- TypeScript
- Zustand (상태 관리)
- shadcn/ui + Tailwind CSS
- Transformers.js (@xenova/transformers)
- EventSource API (SSE 클라이언트)

---

### 2. Next.js API Routes (API Server)

**책임:**
- **모든 DB CRUD 작업** (단일 진실 공급원)
- 인증 검증 (모든 요청)
- 비즈니스 로직 실행
- DB 스키마 및 마이그레이션 관리

**주요 엔드포인트:**
```
POST   /api/auth/callback      # OAuth 콜백
GET    /api/question/next      # 다음 문제 조회
POST   /api/feedback/save      # 평가 결과 저장
PATCH  /api/user/level         # 사용자 수준 업데이트
GET    /api/survey             # 서베이 조회
POST   /api/survey             # 서베이 저장
GET    /api/dashboard          # 대시보드 데이터
```

**핵심 기술:**
- Next.js API Routes (서버리스)
- Drizzle ORM (타입 안전)
- Supabase JavaScript Client
- JWT 검증 미들웨어

**DB 접근 정책:**
- ✅ 읽기 작업: Drizzle ORM 사용
- ✅ 쓰기 작업: Drizzle ORM 사용 (FastAPI는 쓰기 불가)
- ✅ 마이그레이션: Drizzle Kit으로 관리

---

### 3. FastAPI (AI Agent Server)

**책임:**
- LangChain Agent 실행
- 답변 평가 (SSE 스트리밍)
- 문제 생성 (Phase 3)
- **DB 읽기만 가능** (쓰기는 Next.js API)

> **참고**: OPIc 롤플레이 문제는 대화형이 아닌 일방향 독백입니다. 별도의 롤플레이 API 없이 일반 문제와 동일하게 처리됩니다.

**주요 엔드포인트:**
```
POST   /evaluate               # 답변 평가 (SSE)
POST   /generate-question      # 동적 문제 생성 (Phase 3)
GET    /health                 # 헬스 체크
```

**핵심 기술:**
- FastAPI
- LangChain + Grok (xAI)
- Supabase Python Client (읽기 전용)
- sse-starlette (SSE 구현)
- Pydantic (데이터 검증)

**AI Agents:**
1. **문제 출제 Agent**: 가중치 기반 문제 선택
2. **수준 판별 Agent**: 5가지 기준 평가, 피드백 생성
3. **문제 생성 Agent**: 동적 문제 생성 (Phase 3)

---

### 4. Database (Supabase PostgreSQL)

**책임:**
- 모든 데이터 영구 저장
- 인증 관리 (Supabase Auth)
- Row Level Security (사용자별 데이터 격리)

**스키마 관리:**
- **Drizzle ORM** (Next.js)이 스키마 및 마이그레이션 관리
- FastAPI는 Supabase Client로 읽기만 수행
- 중복 스키마 정의 없음

**보안:**
- RLS (Row Level Security) 활성화
- JWT 토큰 기반 접근 제어
- 사용자는 자신의 데이터만 조회 가능

---

## 데이터 흐름

### 1. 로그인 플로우

```
사용자 → Frontend
    ↓
Google OAuth (Supabase)
    ↓
JWT 토큰 발급
    ↓
Frontend에 토큰 저장 (세션)
    ↓
모든 API 요청에 토큰 포함
```

### 2. 문제 출제 플로우

```
Frontend → Next.js API: GET /api/question/next
    (Header: Authorization: Bearer {token})
    ↓
Next.js API: JWT 검증
    ↓
Next.js API: Drizzle ORM으로 문제 조회
    - 사용자 수준 확인
    - 서베이 선택 확인
    - 가중치 기반 문제 선택
    ↓
Frontend ← 문제 반환
    ↓
사용자에게 문제 표시
```

### 3. 답변 및 평가 플로우 (핵심)

```
사용자 음성 답변
    ↓
Frontend: MediaRecorder API (음성 녹음)
    ↓
Frontend: Whisper WebGPU 처리 (클라이언트)
    - 음성 → 텍스트 변환
    - 단어별 Confidence Score 추출
    - 100% 클라이언트 사이드 (서버 업로드 없음)
    ↓
Frontend: 텍스트 표시 (수정 불가)
    ↓
Frontend → FastAPI: POST /evaluate (SSE)
    (Header: Authorization: Bearer {token})
    Body: {
        question: "...",
        answer: "...",
        words: [{word: "cafe", confidence: 0.58}, ...],
        current_level: "IM2"
    }
    ↓
FastAPI: JWT 검증
    ↓
FastAPI: LangChain Agent 실행 (SSE 스트리밍)
    ↓
Event 1: "발화량 분석 중..." (20%)
    ↓
Event 2: "문법 평가 중..." (40%)
    ↓
Event 3: "어휘 분석 중..." (60%)
    ↓
Event 4: "피드백 생성 중..." (80%)
    ↓
Event 5: "완료" (100%) + 결과
    {
        evaluated_level: "IM3",
        scores: { utterance: 7, grammar: 8, ... },
        feedback: { strengths: [...], weaknesses: [...], ... }
    }
    ↓
Frontend ← 결과 수신 (SSE)
    ↓
Frontend → Next.js API: POST /api/feedback/save
    (Header: Authorization: Bearer {token})
    Body: { questionId, answer, scores, feedback }
    ↓
Next.js API: JWT 검증
    ↓
Next.js API: Drizzle ORM으로 DB 저장
    - feedbacks 테이블
    - user_profiles 테이블 (수준 업데이트)
    - question_weights 테이블 (가중치 조정)
    ↓
Frontend: 피드백 표시
```

> **참고**: OPIc 롤플레이 문제(11-12-13번)는 응시자가 한 번에 모든 내용을 말하는 일방향 독백 형식입니다. 시스템이 응답하는 대화형이 아니므로, 일반 문제와 동일한 플로우로 처리됩니다.

---

## 기술 스택 요약

### Frontend
```
- Framework: Next.js 14 (App Router)
- Language: TypeScript
- UI: shadcn/ui + Tailwind CSS
- State: Zustand
- STT: Transformers.js (@xenova/transformers)
- Forms: React Hook Form
- Validation: Zod
```

### Backend - Next.js API
```
- Framework: Next.js API Routes (Serverless)
- Language: TypeScript
- ORM: Drizzle ORM
- DB Client: Supabase JavaScript Client
- Auth: Supabase Auth + JWT
```

### Backend - FastAPI
```
- Framework: FastAPI
- Language: Python 3.11+
- AI: LangChain + Grok (xAI)
- DB Client: Supabase Python Client (읽기 전용)
- SSE: sse-starlette
- Validation: Pydantic
```

### Database
```
- Primary: Supabase (PostgreSQL 15+)
- Auth: Supabase Auth (Google OAuth)
- Security: Row Level Security (RLS)
```

### AI/ML
```
- LLM: Grok (xAI via OpenAI-compatible API)
- STT: Whisper WebGPU (클라이언트 사이드)
- Pronunciation: Confidence Score-based
```

### Deployment
```
Option 1 (MVP):
- 전부 Vercel

Option 2 (Production):
- Frontend + Next.js API: Vercel
- FastAPI: GCP Cloud Run
- Database: Supabase Cloud
```

---

## 주요 설계 결정

### 1. 클라이언트 사이드 STT (Whisper WebGPU)

**결정:**
- 음성 인식을 서버가 아닌 클라이언트에서 처리

**이유:**
- ✅ **프라이버시**: 음성 파일을 서버에 업로드하지 않음
- ✅ **비용 절감**: STT API 비용 $0
- ✅ **레이턴시**: 서버 업로드 시간 불필요
- ✅ **오프라인 가능**: 모델 로드 후 인터넷 연결 불필요

**트레이드오프:**
- ⚠️ WebGPU 지원 브라우저 필요 (Chrome 113+)
- ⚠️ 초기 모델 로딩 시간 (~1-2분, 캐시 후 수초)

---

### 2. 단일 진실 공급원 (Single Source of Truth)

**결정:**
- DB 스키마와 마이그레이션은 Next.js + Drizzle ORM만 관리
- FastAPI는 읽기 전용

**이유:**
- ✅ **중복 제거**: 두 곳에서 스키마 정의 불필요
- ✅ **일관성**: 마이그레이션 충돌 방지
- ✅ **타입 안전**: TypeScript ↔ Drizzle 완벽 통합
- ✅ **단순성**: FastAPI는 AI에만 집중

**트레이드오프:**
- ⚠️ FastAPI가 DB에 쓰기 작업 불가 (설계상 의도된 제약)

---

### 3. SSE (Server-Sent Events) for AI

**결정:**
- AI 평가 및 롤플레이는 SSE로 스트리밍

**이유:**
- ✅ **실시간 진행 표시**: 사용자 이탈 방지
- ✅ **타임아웃 회피**: 긴 AI 처리 시간 대응
- ✅ **단방향 통신**: 서버 → 클라이언트만 필요
- ✅ **단순성**: WebSocket보다 구현 간단

**트레이드오프:**
- ⚠️ Vercel Functions는 60초 제한 (Cloud Run 권장)

---

### 4. Grok LLM 선택

**결정:**
- OpenAI GPT-4 대신 Grok (xAI) 사용

**이유:**
- ✅ **OpenAI 호환**: LangChain 코드 동일
- ✅ **비용 효율**: (사용자 선택)
- ✅ **최신 모델**: Grok-beta

**트레이드오프:**
- ⚠️ 프롬프트 최적화 필요 (Grok 특성 반영)

---

### 5. 인증 전략

**결정:**
- 모든 서비스는 로그인 필수
- Google OAuth만 지원 (이메일/비밀번호 없음)

**이유:**
- ✅ **보안**: 비밀번호 관리 불필요
- ✅ **UX**: 원클릭 로그인
- ✅ **신뢰성**: Google 인증 인프라 활용

**구현:**
- Supabase Auth로 Google OAuth 처리
- JWT 토큰으로 모든 API 요청 인증
- Next.js API와 FastAPI 모두 JWT 검증

---

## 보안 및 인증

### 인증 플로우

```
1. 사용자 → Google OAuth (Supabase)
2. Supabase → JWT 토큰 발급
3. Frontend → 토큰 저장 (httpOnly 쿠키 / localStorage)
4. 모든 API 요청에 Header: Authorization: Bearer {token}
5. Next.js API → Supabase Client로 JWT 검증
6. FastAPI → Supabase Auth API로 JWT 검증
```

### 보안 정책

**인증:**
- ✅ 모든 API 엔드포인트는 JWT 검증 필수
- ✅ 토큰 만료 시 자동 갱신 (Supabase)
- ✅ 로그아웃 시 토큰 무효화

**데이터베이스:**
- ✅ Row Level Security (RLS) 활성화
- ✅ 사용자는 자신의 데이터만 조회/수정 가능
- ✅ Service Role Key는 서버 사이드만 사용

**API:**
- ✅ CORS 설정 (허용된 도메인만)
- ✅ Rate Limiting (Phase 2 이후)
- ✅ Input Validation (Zod, Pydantic)

**HTTPS:**
- ✅ 모든 통신 HTTPS 필수
- ✅ WebGPU는 HTTPS에서만 동작
- ✅ Vercel/GCP는 자동 HTTPS 제공

---

## 확장성 및 성능

### 확장 전략

**Frontend (Vercel):**
- 자동 CDN 배포
- 엣지 함수 활용 (필요 시)
- 이미지 최적화 (Next.js Image)

**Next.js API (Vercel):**
- 서버리스 자동 스케일링
- 리전 선택 가능

**FastAPI (Cloud Run):**
- 자동 스케일링 (0 → N 인스턴스)
- 최소/최대 인스턴스 설정
- CPU/메모리 조정 가능

**Database (Supabase):**
- PostgreSQL 연결 풀링
- 읽기 복제본 (필요 시)
- Supabase Edge Functions (선택적)

### 캐싱 전략 (Phase 2 이후)

```
- Next.js: React Server Components 캐싱
- Drizzle: 쿼리 결과 캐싱
- FastAPI: LangChain 프롬프트 캐싱
- Redis: 세션 및 자주 사용되는 데이터 (선택적)
```

---

## 모니터링 및 관찰성

### 모니터링 스택

```
- Frontend: Vercel Analytics
- Next.js API: Vercel Logs
- FastAPI: GCP Cloud Monitoring (또는 Vercel Logs)
- Database: Supabase Dashboard
- Errors: Sentry (선택적)
- APM: LangSmith (LangChain 추적, 선택적)
```

### 로깅 전략

```
- Frontend: Console + Sentry
- Next.js API: Vercel Logs (자동)
- FastAPI: Python logging + GCP Logging
- 중요 이벤트: 구조화된 로그 (JSON)
```

---

## 비용 예상 (월)

### MVP (Option 1: 전부 Vercel)
```
- Vercel (Hobby): $0
- Supabase (Free): $0
- Grok API: ~$5 (사용량 기준)
────────────────────
총합: ~$5/월
```

### Production (Option 2: 하이브리드)
```
- Vercel (Hobby): $0
- GCP Cloud Run: $0~$5 (프리 티어)
- Supabase (Free): $0
- Grok API: ~$10 (사용량 증가)
────────────────────
총합: ~$10~$15/월
```

---

## 다음 단계

### 개발 우선순위

**Phase 1: MVP (4~6주)**
1. ✅ Supabase 프로젝트 + Google OAuth 설정
2. ✅ Next.js 프로젝트 초기화 + Drizzle ORM
3. ✅ FastAPI 프로젝트 초기화 + LangChain
4. ✅ 기본 인증 플로우 구현
5. ✅ 문제 출제 Agent (DB 기반)
6. ✅ 음성 입력 → Whisper WebGPU
7. ✅ 수준 판별 Agent + 기본 피드백
8. ✅ Vercel 배포

**Phase 2: 고급 기능 (3~4주)**
1. ⏳ 상세 피드백 + 모범 답안
2. ⏳ 가중치 기반 문제 출제
3. ⏳ 단어 수준 발음 평가
4. ⏳ 대시보드 및 통계
5. ⏳ 문제 유형별 필터링 (롤플레이 포함)

**Phase 3: AI 고도화 (4~6주)**
1. ⏳ 문제 생성 Agent
2. ⏳ Grok 기반 발음 추론
3. ⏳ 개인화 추천
4. ⏳ 학습 경로 최적화

**Phase 4: 프로덕션 (2~3주)**
1. ⏳ 성능 최적화
2. ⏳ 에러 처리 + 로깅
3. ⏳ 테스트 작성
4. ⏳ 모니터링 설정
5. ⏳ GCP Cloud Run 전환 (선택적)

---

## 참고 문서

- [system-architecture.md](./system-architecture.md) - 상세 시스템 아키텍처
- [database-schema.md](./database-schema.md) - DB 스키마 설계
- [ai-agent-structure.md](./ai-agent-structure.md) - AI Agent 구조 및 프롬프트
- [stt-pronunciation.md](./stt-pronunciation.md) - STT 및 발음 평가
- [deployment-guide.md](./deployment-guide.md) - 배포 가이드
- [opic-exam-info.md](./opic-exam-info.md) - OPIc 시험 정보

---

## 핵심 요약

### 이 시스템의 특징

1. **완전한 클라이언트 사이드 STT**: 프라이버시 보호 + 비용 절감
2. **단일 진실 공급원 (Next.js)**: DB 스키마 중복 없음
3. **SSE 실시간 스트리밍**: 긴 AI 처리 대응
4. **필수 로그인**: 모든 서비스 인증 필수
5. **확장 가능한 배포**: MVP는 Vercel, 프로덕션은 하이브리드

### 핵심 기술

- **Frontend**: Next.js 14 + Zustand + Whisper WebGPU
- **API**: Next.js API Routes + Drizzle ORM
- **AI**: FastAPI + LangChain + Grok
- **DB**: Supabase PostgreSQL + RLS
- **Deployment**: Vercel (+ GCP Cloud Run 선택적)

### 보안

- Google OAuth 필수 로그인
- JWT 토큰 모든 요청 검증
- Row Level Security (사용자별 데이터 격리)
- HTTPS 전체 통신

---

**이 문서는 전체 아키텍처의 개요를 제공합니다. 각 컴포넌트의 상세 구현은 개별 문서를 참조하세요.**
