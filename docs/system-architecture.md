# OPIc 학습 서비스 시스템 아키텍처

## 목차
- [프로젝트 개요](#프로젝트-개요)
- [시스템 구조](#시스템-구조)
- [핵심 기능](#핵심-기능)
- [기술 스택](#기술-스택)
- [AI Agent 구조](#ai-agent-구조)
- [데이터 플로우](#데이터-플로우)
- [구현 우선순위](#구현-우선순위)

---

## 프로젝트 개요

### 목적
OPIc(Oral Proficiency Interview - computer) 시험 준비를 위한 AI 기반 학습 플랫폼

### 핵심 가치
- **개인화된 학습**: 사용자 수준에 맞는 문제 출제
- **실시간 피드백**: AI 기반 즉각적인 수준 판별 및 상세 분석
- **음성 기반 학습**: 실제 시험과 동일한 음성 답변 환경
- **동적 문제 생성**: AI가 새로운 문제를 생성하여 무한 학습 가능

---

## 시스템 구조

```
┌─────────────────────────────────────────────────────────────┐
│                   Frontend (Next.js - Vercel)                │
│  - UI/UX                                                     │
│  - 음성 입력 (Web Audio API)                                │
│  - 클라이언트 상태 관리                                      │
└──────────────┬──────────────────────────┬────────────────────┘
               │                          │
               │ HTTP/REST                │ SSE (직접 통신)
               │ (DB 작업)                │ (AI 작업)
               │                          │
┌──────────────▼──────────────┐  ┌───────▼─────────────────────┐
│  Next.js API Routes         │  │  FastAPI (GCP Cloud Run)    │
│  (Vercel)                   │  │                             │
│                             │  │  ┌──────────────────────┐   │
│  - 인증 (Supabase Auth)     │  │  │  LangChain Agents    │   │
│  - 서베이 CRUD              │  │  │                      │   │
│  - 문제 선택 로직           │  │  │  - 문제 출제 Agent   │   │
│  - 피드백 저장              │  │  │  - 수준 판별 Agent   │   │
│  - 수준 업데이트            │  │  │  - 문제 생성 Agent   │   │
│                             │  │  │  - 롤플레이 Agent    │   │
└─────────────┬───────────────┘  │  └──────────────────────┘   │
              │                  │                             │
              │                  │  - Grok (xAI)               │
              │                  │  - SSE 스트리밍 응답        │
              │                  └─────────────────────────────┘
              │
              │ Supabase Client
              │
┌─────────────▼────────────────────────────────────────────────┐
│              Database (Supabase - PostgreSQL)                 │
│  - users (사용자 정보)                                        │
│  - user_profiles (사용자 프로필)                              │
│  - opic_levels (등급 마스터)                                  │
│  - questions (문제 풀)                                        │
│  - feedbacks (피드백 이력)                                    │
│  - survey_selections (서베이 선택)                            │
│  - user_question_mastery (숙달도)                             │
│  - question_weights (가중치)                                  │
└───────────────────────────────────────────────────────────────┘
```

### 통신 구조 특징

- **Frontend → Next.js API**: DB 작업 (CRUD, 비즈니스 로직)
- **Frontend → FastAPI**: AI 작업 (평가, 대화, 문제 생성) - **SSE 직접 통신**
- **레이턴시 최소화**: AI 응답이 프록시 없이 직접 스트리밍
- **독립적 스케일링**: AI 서비스가 Cloud Run에서 자동 스케일링

---

## 핵심 기능

### 1. 사용자 수준 관리

#### 등급 체계
- **사용**: OPIc 공식 등급 체계 그대로
- **등급**: NL, NM, NH, IL, IM1, IM2, IM3, IH, AL (9단계)

#### 수준 업데이트
- **빈도**: 매 답변마다
- **방식**: AI Agent가 자동 판별 및 업데이트

---

### 2. 서베이 기능

#### 구현 내용
- 실제 OPIc 서베이와 동일한 구조
- 7개 대분류에서 12개 항목 선택
- 선택한 주제에 맞는 문제 출제

#### 서베이 항목
1. 자기소개 (필수)
2. 직업/학업
3. 거주지
4. 여가활동 (2개 이상)
5. 취미/관심사 (1개 이상)
6. 운동 (1개 이상)
7. 휴가/여행 (1개 이상)

---

### 3. 문제 출제 시스템

#### 문제 유형 (6가지 모두 포함)
1. **묘사(Description)**: 대상, 장소 설명
2. **루틴(Routine)**: 과정, 방법 설명
3. **경험(Experience)**: 특정 사건, 비교
4. **롤플레이(Role Play)**: 상황극 (11번: 질문, 12번: 문제 해결)
5. **돌발 문제**: 선택하지 않은 주제
6. **콤보 문제**: 한 주제의 연속된 문제

#### 문제 출제 로직

**기본 구조:**
```
1. 사용자 수준 확인
2. 서베이 선택 확인
3. 문제 유형 결정 (가중치 기반)
4. 문제 선택/생성
   - 미숙달 문제 우선 (높은 가중치)
   - 새로운 문제 일정 확률
   - 약한 주제 집중 (가중치 조정)
```

**문제 소스:**
- **Phase 1**: DB 문제 풀 사용
- **Phase 2**: 사용자가 모든 문제 숙달 시 AI가 새 문제 생성
- **롤플레이**: 실시간 대화형 AI 챗봇

---

### 4. 음성 인식 및 답변 처리

#### 프로세스
```
1. 사용자 음성 입력
2. 음성 → 텍스트 변환 (STT)
3. 텍스트 표시 (수정 불가)
4. AI Agent로 전송
```

#### 음성 인식
- **기술**: TBD (향후 결정)
- **옵션**: Google Speech-to-Text, OpenAI Whisper, Web Speech API

---

### 5. AI 기반 수준 판별 및 피드백

#### 평가 기준 (5가지)
1. **발화량**: 단어 수, 문장 수
2. **문법 정확도**: 시제, 수 일치, 구문 정확도
3. **어휘 다양성**: 어휘 범위, 수식어 사용
4. **논리적 구조**: 도입-전개-결론, 문장 연결성
5. **발음 정확도**: 발음 명확성

#### 피드백 내용
1. **점수**: 현재 수준 (IM1, IH 등)
2. **개선 포인트**: 구체적인 약점 지적
3. **모범 답안**: 수준별 예시 답변
4. **상세 분석**:
   - 발화량 분석 (목표 vs 실제)
   - 문법 오류 지적
   - 어휘 개선 제안
   - 구조 피드백
   - 발음 피드백

---

### 6. 롤플레이 특수 처리

#### 실시간 대화형 구조

**11번 문제 (정보 요청):**
```
1. AI가 상황 제시 (예: "친구와 영화를 보려고 합니다")
2. 사용자가 질문 (음성)
   → AI가 실시간 응답
3. 3~4개 질문 반복
4. 종료 후 평가
```

**12번 문제 (문제 해결):**
```
1. AI가 문제 상황 제시
2. 사용자가 문제 설명 + 대안 제시 (음성)
   → AI가 각 대안에 반응
3. 종료 후 평가
```

#### 구현 방식
- **LangChain Agent** 활용
- **대화 컨텍스트 유지**
- **자연스러운 응답 생성**

---

## 기술 스택

### Frontend (Next.js - Vercel)
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **UI**: TailwindCSS, shadcn/ui
- **State**: Zustand or React Context
- **Audio**: Web Audio API, MediaRecorder API
- **HTTP Client**: Fetch API, EventSource (SSE)

### Backend - API Server (Next.js API Routes - Vercel)
- **Framework**: Next.js API Routes (서버리스)
- **Language**: TypeScript
- **ORM**: Drizzle ORM (타입 안전한 쿼리 빌더)
- **Auth**: Supabase Auth (Google OAuth) + JWT 검증
- **DB Client**: Supabase JavaScript Client
- **역할**:
  - 인증 및 세션 관리 (Google 로그인)
  - 모든 요청에 대한 인증 검증 (로그인 필수)
  - **모든 DB CRUD 작업** (단일 진실 공급원)
  - 서베이, 문제, 피드백 CRUD
  - 가중치 기반 문제 선택 로직
  - 사용자 수준 업데이트
  - DB 스키마 마이그레이션 관리

### Backend - AI Agent Server (FastAPI - GCP Cloud Run)
- **Framework**: FastAPI
- **Language**: Python 3.11+
- **DB Client**: Supabase Python Client (ORM 없이, **읽기 전용**)
- **AI/ML**:
  - LangChain (Python)
  - Grok API (xAI)
  - LangGraph (다중 Agent 협업, Phase 3)
- **SSE**: sse-starlette
- **Auth**: Supabase JWT 검증 (모든 엔드포인트 인증 필수)
- **역할**:
  - LangChain Agent 실행
  - 답변 평가 및 피드백 생성 (SSE 스트리밍)
  - 롤플레이 실시간 대화
  - 동적 문제 생성 (Phase 3)
  - 모든 요청에 대한 인증 검증 (로그인 필수)
  - **DB 읽기 작업만** (사용자 정보, 문제 조회)

### Database
- **Primary**: Supabase (PostgreSQL 15+)
- **Auth**: Supabase Auth (Google OAuth)
- **Storage**: Supabase Storage (선택적, 음성 파일 저장 시)
- **RLS**: Row Level Security 활성화 (사용자별 데이터 격리)

### DB 접근 정책
- **단일 진실 공급원 (Single Source of Truth)**:
  - Next.js + Drizzle ORM이 DB 스키마 및 마이그레이션 관리
  - 모든 CRUD 작업은 Next.js API Routes를 통해서만 수행
- **역할 분리**:
  - **Next.js API**: 모든 DB 쓰기/읽기 (Drizzle ORM)
  - **FastAPI**: DB 읽기만 가능 (Supabase Python Client)
- **장점**:
  - 중복 스키마 정의 불필요
  - 마이그레이션 충돌 방지
  - 타입 안전성 (TypeScript ↔ Drizzle)
  - FastAPI는 AI 작업에 집중

### AI/ML Services
- **LLM**: Grok (xAI)
- **STT**: TBD (Google Speech-to-Text, OpenAI Whisper, Web Speech API)
- **Pronunciation**: TBD (향후 검토)

### 인증 정책
- **필수 로그인**: 모든 서비스는 로그인 후 이용 가능
- **인증 방식**: Supabase Google OAuth
- **토큰 검증**:
  - Next.js API: Supabase Client SDK로 JWT 검증
  - FastAPI: Supabase Auth API로 JWT 검증
- **세션 관리**: Supabase Auth 자동 관리 (토큰 갱신)

### Deployment
- **Frontend**: Vercel
- **Next.js API**: Vercel (서버리스)
- **FastAPI**: GCP Cloud Run (컨테이너)
- **Database**: Supabase Cloud
- **Monitoring**:
  - Vercel Analytics (Frontend)
  - GCP Cloud Monitoring (FastAPI)
  - Sentry (선택적)

---

## AI Agent 구조

### 1. 문제 출제 Agent

#### 역할
- 사용자 수준 및 서베이 기반 문제 선택
- 가중치 로직 적용 (약한 문제, 새 문제)
- 롤플레이 실시간 대화 진행
- 문제 생성 (숙달 후)

#### 입력
```json
{
  "user_level": "IM2",
  "survey_selections": ["집", "카페", "음악", "수영", "국내여행"],
  "weak_topics": ["음악", "롤플레이"],
  "mastered_questions": [1, 2, 5, 10]
}
```

#### 출력
```json
{
  "question_id": 15,
  "question_type": "경험",
  "topic": "음악",
  "difficulty": "IM2",
  "question_text": "최근 콘서트에 다녀온 경험에 대해 말해주세요.",
  "context": "음악 관련 경험 문제"
}
```

#### LangChain 구조
```python
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain.prompts import ChatPromptTemplate
from langchain.tools import Tool

# 문제 선택 도구
def select_question(user_level, topics, weak_topics):
    # 가중치 로직
    pass

# 문제 생성 도구
def generate_question(topic, question_type, difficulty):
    # LLM 기반 문제 생성
    pass

# Agent 생성
tools = [
    Tool(name="select_question", func=select_question, ...),
    Tool(name="generate_question", func=generate_question, ...)
]

agent = create_openai_functions_agent(llm, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools)
```

---

### 2. 수준 판별 Agent

#### 역할
- 사용자 답변 분석
- 5가지 기준 평가
- 수준 업데이트 판단
- 상세 피드백 생성

#### 입력
```json
{
  "question": "자주 가는 카페에 대해 설명해주세요.",
  "user_answer": "I often go to a cafe near my house. It's very cozy and comfortable...",
  "current_level": "IM2",
  "target_level": "IH"
}
```

#### 출력
```json
{
  "evaluated_level": "IM3",
  "should_update": true,
  "scores": {
    "utterance": 8,
    "grammar": 7,
    "vocabulary": 6,
    "structure": 8,
    "pronunciation": 7
  },
  "feedback": {
    "strengths": ["문장 수가 충분함", "도입-전개 구조 양호"],
    "weaknesses": ["어휘 다양성 부족", "접속사 활용 미흡"],
    "improvements": ["however, therefore 같은 접속사 활용", "형용사 다양화"],
    "model_answer": "I'd like to tell you about my favorite cafe..."
  }
}
```

#### LangChain 구조
```python
# 평가 체인
evaluation_prompt = ChatPromptTemplate.from_messages([
    ("system", """당신은 OPIc 평가 전문가입니다.
    답변을 5가지 기준으로 평가하세요:
    1. 발화량 (단어 수, 문장 수)
    2. 문법 정확도
    3. 어휘 다양성
    4. 논리적 구조
    5. 발음 정확도 (텍스트 기반 추정)

    현재 등급: {current_level}
    목표 등급: {target_level}
    """),
    ("user", "질문: {question}\n답변: {answer}")
])

evaluation_chain = evaluation_prompt | llm | output_parser
```

---

### 3. 문제 생성 Agent (선택적)

#### 역할
- 사용자가 모든 문제를 숙달했을 때 새로운 문제 생성
- 주제, 유형, 난이도 기반 문제 생성

#### 입력
```json
{
  "topic": "카페",
  "question_type": "경험",
  "difficulty": "IH",
  "existing_questions": ["최근 카페 경험", "카페에서의 문제 상황"]
}
```

#### 출력
```json
{
  "question_text": "카페에서 일하는 친구를 방문한 경험에 대해 말해주세요.",
  "expected_answer_structure": "도입 → 방문 계기 → 활동 → 느낀 점",
  "key_vocabulary": ["visit", "work", "chat", "support"],
  "difficulty_justification": "친구 관계와 일터 방문이라는 복합 상황"
}
```

---

## 데이터 플로우

### 0. 로그인 플로우 (필수)

```
사용자 방문
    ↓
Supabase Google OAuth 로그인
    ↓
Google 계정 선택 및 동의
    ↓
Supabase: JWT 토큰 발급
    ↓
Frontend: 토큰 저장 (세션)
    ↓
서비스 이용 가능
```

**모든 API 요청에 JWT 토큰 포함:**
- Next.js API: `Authorization: Bearer {token}`
- FastAPI: `Authorization: Bearer {token}`

---

### 1. 문제 출제 플로우

```
사용자 로그인 완료 (JWT 보유)
    ↓
서베이 작성 (최초 1회)
    ↓
대시보드 → "학습 시작" 클릭
    ↓
Frontend → Next.js API: GET /api/question/next
    (Header: Authorization: Bearer {token})
    ↓
Next.js API: JWT 검증
    ↓
[문제 출제 로직 실행]
    ↓
사용자 수준 + 서베이 + 가중치 분석
    ↓
문제 선택 or 생성
    ↓
Frontend ← Next.js API: 문제 반환
    ↓
문제 표시
```

---

### 2. 답변 및 평가 플로우 (SSE)

```
사용자 음성 답변
    ↓
Frontend: STT (음성 → 텍스트)
    ↓
Frontend: 텍스트 표시 (확인, 수정 불가)
    ↓
Frontend → FastAPI (Cloud Run): POST /evaluate
    (Header: Authorization: Bearer {token})
    ↓
FastAPI: JWT 검증 (verify_token)
    ↓
FastAPI: 평가 시작 (SSE 스트리밍)
    ↓ (스트리밍 시작)
    ↓
Event 1: "분석 중..." (progress: 20%)
    ↓
Event 2: "문법 평가 중..." (progress: 40%)
    ↓
Event 3: "어휘 분석 중..." (progress: 60%)
    ↓
Event 4: "피드백 생성 중..." (progress: 80%)
    ↓
Event 5: "완료" (progress: 100%, result 포함)
    ↓
Frontend: 결과 수신, SSE 연결 종료
    ↓
Frontend → Next.js API: POST /api/feedback/save
    (Header: Authorization: Bearer {token})
    ↓
Next.js API: JWT 검증
    ↓
Next.js API: DB 저장 (feedbacks, user_profiles)
    ↓
Frontend: 피드백 표시
    ↓
다음 문제 or 학습 종료
```

**SSE 장점:**
- 실시간 진행 상황 표시 (UX 향상)
- 긴 AI 처리 시간에도 사용자 이탈 방지
- 타임아웃 없이 안정적 통신

---

### 3. 롤플레이 플로우 (SSE 대화)

```
[11번 문제 - 정보 요청]
Frontend → FastAPI: POST /roleplay/start
    (Header: Authorization: Bearer {token})
    ↓
FastAPI: JWT 검증
    ↓
FastAPI: 상황 제시 + 대화 세션 생성
    ↓
Frontend: 상황 표시
    ↓
사용자: 질문 1 (음성) → STT → 텍스트
    ↓
Frontend → FastAPI: POST /roleplay/chat (SSE)
    (Header: Authorization: Bearer {token})
    ↓
FastAPI: JWT 검증
    ↓ (스트리밍 응답)
AI 응답 생성 중... (단어별 스트리밍)
    ↓
Frontend: 타이핑 효과로 표시
    ↓
사용자: 질문 2 (음성) → STT → 텍스트
    ↓
Frontend → FastAPI: POST /roleplay/chat (SSE)
    ↓
AI 응답 생성 중...
    ↓
... (3~4개 질문 반복)
    ↓
Frontend → FastAPI: POST /roleplay/end
    ↓
FastAPI: 대화 전체 평가 (수준 판별 Agent)
    ↓
Frontend ← FastAPI: 평가 결과
    ↓
Frontend → Next.js API: POST /api/feedback/save
    ↓
피드백 표시
```

**롤플레이 SSE 특징:**
- 단어별 스트리밍으로 자연스러운 대화 느낌
- LangChain Memory로 대화 컨텍스트 유지
- 실시간 응답으로 실제 시험과 유사한 경험

---

## 구현 우선순위

### Phase 1: MVP (최소 기능 제품)
**목표**: 기본 학습 사이클 구현

1. ✅ **기본 인증 및 사용자 관리** (Supabase Auth)
2. ✅ **서베이 기능** (12개 항목 선택)
3. ✅ **DB 문제 풀 구축** (주제별 기본 문제 30~50개)
4. ✅ **문제 출제 Agent** (DB에서 문제 선택)
5. ✅ **음성 입력 → 텍스트 변환** (Web Speech API 또는 간단한 STT)
6. ✅ **수준 판별 Agent** (5가지 기준 평가)
7. ✅ **기본 피드백 표시** (점수 + 간단한 피드백)
8. ✅ **수준 업데이트** (매 답변마다)

**예상 기간**: 4~6주

---

### Phase 2: 고급 기능
**목표**: 사용자 경험 향상

1. ✅ **상세 피드백** (모범 답안 + 상세 분석)
2. ✅ **가중치 기반 문제 출제** (약한 주제 집중)
3. ✅ **발음 평가** (발음 정확도 분석)
4. ✅ **대시보드** (수준 진행도, 학습 통계)
5. ✅ **롤플레이 기본 구현** (11번, 12번 문제)
6. ⏳ **모바일 반응형** (UX 개선)

**예상 기간**: 3~4주

---

### Phase 3: AI 고도화
**목표**: AI 기반 동적 학습

1. ⏳ **문제 생성 Agent** (LangChain 기반)
2. ⏳ **롤플레이 실시간 대화** (LangChain Agent 활용)
3. ⏳ **개인화 추천** (약한 주제/유형 자동 파악)
4. ⏳ **학습 경로 최적화** (AI가 학습 순서 제안)
5. ⏳ **다중 Agent 협업** (LangGraph 활용)

**예상 기간**: 4~6주

---

### Phase 4: 프로덕션 준비
**목표**: 안정성 및 확장성

1. ⏳ **성능 최적화** (응답 속도, 캐싱)
2. ⏳ **에러 처리 및 로깅**
3. ⏳ **테스트 작성** (Unit, Integration)
4. ⏳ **모니터링 및 분석** (Vercel Analytics, Sentry)
5. ⏳ **사용자 피드백 수집 및 개선**

**예상 기간**: 2~3주

---

## 다음 단계

### 즉시 시작 가능

1. **Supabase 프로젝트 설정**
   - 프로젝트 생성
   - **Google OAuth 설정** (Authentication → Providers → Google)
   - Google Cloud Console에서 OAuth 클라이언트 ID 생성
   - Supabase에 클라이언트 ID/Secret 등록
   - 테이블 마이그레이션 (database-schema.md 참고)
   - RLS (Row Level Security) 정책 활성화
   - 초기 데이터 시드 (등급, 주제, 문제 30~50개)

2. **Next.js 프로젝트 초기화**
   - TypeScript + TailwindCSS 설정
   - **Drizzle ORM 설정**
     - `drizzle.config.ts` 작성
     - 스키마 정의 (`drizzle/schema.ts`)
     - Supabase PostgreSQL 연결
     - 마이그레이션 스크립트 설정
   - Supabase 클라이언트 설정
   - **Google OAuth 로그인 플로우 구현**
   - **JWT 검증 미들웨어 작성** (모든 API Routes에 적용)
   - 세션 관리 (클라이언트 + 서버)

3. **FastAPI 프로젝트 초기화**
   - Python 3.11+ 환경 설정
   - **Supabase Python Client 설정** (읽기 전용)
     - `supabase-py` 패키지 설치
     - 환경 변수 설정 (SUPABASE_URL, SERVICE_ROLE_KEY)
     - 클라이언트 초기화
   - LangChain + Grok API 설정
   - **Supabase JWT 검증 미들웨어** (모든 엔드포인트에 적용)
   - SSE (sse-starlette) 설정
   - 기본 Agent 프로토타입
   - Dockerfile 작성

4. **GCP Cloud Run 배포 준비**
   - GCP 프로젝트 생성
   - Cloud Run API 활성화
   - Artifact Registry 설정
   - 환경 변수 구성:
     - `SUPABASE_URL`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `XAI_API_KEY` (Grok)
     - `ALLOWED_ORIGINS` (CORS)

### 개발 단계별 작업

1. **DB 스키마 설계** - ✅ 완료 (database-schema.md)
2. **AI Agent 프롬프트 전략** - ✅ 완료 (ai-agent-structure.md)
3. **API 명세 작성** - Frontend ↔ FastAPI 엔드포인트 정의
4. **UI/UX 와이어프레임** - 화면 설계
5. **SSE 통신 프로토타입** - Frontend EventSource + FastAPI SSE

---

## 참고 자료

### AI Agent 구현
- [LangChain을 활용한 AI 에이전트 생성 가이드](https://velog.io/@gogocomputer/Creating-an-AI-Agent-with-LangChain)
- [AI Agent 설계 및 구축](https://velog.io/@lyj_0316/AI-Agent-설계-및-구축)
- [LangGraph - Multi-Agent Collaboration](https://teddylee777.github.io/langgraph/langgraph-multi-agent-collaboration/)

### OPIc 학습 서비스
- [ChatGPT로 OPIc 시험 준비하기](https://velog.io/@do0ori/ChatGPT로-OPIc-시험-준비하기)
- [챗GPT 영어회화로 오픽 AL 받는 3단계 공부법](https://aiheroes.ai/community/305)

### 대화형 AI
- [대화형 챗봇 설계의 과제](https://gist.github.com/haje01/7fc9d1b1fc1b6c8c9b7918abf5407a86)

---

## 인증 구현 예제

### Next.js API Routes JWT 검증

```typescript
// app/api/middleware/auth.ts
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, userId: string) => Promise<NextResponse>
) {
  const cookieStore = cookies();

  // Supabase 클라이언트 생성
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // JWT 검증
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { error: "인증이 필요합니다. 로그인 후 이용하세요." },
      { status: 401 }
    );
  }

  // 핸들러 실행
  return handler(request, user.id);
}

// app/api/question/next/route.ts
import { withAuth } from "@/app/api/middleware/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, userId) => {
    // 인증된 사용자의 문제 선택 로직
    const question = await getNextQuestion(userId);

    return NextResponse.json({ question });
  });
}
```

### FastAPI JWT 검증 (이미 구현됨)

FastAPI의 JWT 검증은 `ai-agent-structure.md` 파일의 `verify_token` 함수 참조.

---

## ORM 및 DB 클라이언트 구현

### Next.js + Drizzle ORM (CRUD 전담)

```typescript
// drizzle/schema.ts
import { pgTable, uuid, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";

export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  currentLevel: text("current_level").notNull(),
  targetLevel: text("target_level"),
  displayName: text("display_name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const feedbacks = pgTable("feedbacks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  questionId: uuid("question_id").notNull(),
  userAnswer: text("user_answer").notNull(),
  evaluatedLevel: text("evaluated_level").notNull(),
  scores: text("scores").notNull(), // JSON string
  feedback: text("feedback").notNull(), // JSON string
  createdAt: timestamp("created_at").defaultNow(),
});

// drizzle.config.ts
import type { Config } from "drizzle-kit";

export default {
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;

// app/api/feedback/save/route.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { feedbacks } from "@/drizzle/schema";
import { withAuth } from "@/app/api/middleware/auth";

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, userId) => {
    const body = await req.json();

    // Drizzle ORM으로 DB에 저장
    const result = await db.insert(feedbacks).values({
      userId,
      questionId: body.questionId,
      userAnswer: body.answer,
      evaluatedLevel: body.evaluated_level,
      scores: JSON.stringify(body.scores),
      feedback: JSON.stringify(body.feedback),
    }).returning();

    return NextResponse.json({ success: true, data: result[0] });
  });
}
```

---

### FastAPI + Supabase Python Client (읽기 전용)

```python
# app/database.py
from supabase import create_client, Client
import os
from typing import Optional, Dict, List

# Supabase 클라이언트 (싱글톤)
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

# 사용자 정보 조회
async def get_user_profile(user_id: str) -> Optional[Dict]:
    """사용자 프로필 조회 (읽기 전용)"""
    response = supabase.table("user_profiles") \
        .select("*") \
        .eq("user_id", user_id) \
        .single() \
        .execute()

    return response.data if response.data else None

# 문제 조회
async def get_question(question_id: str) -> Optional[Dict]:
    """문제 정보 조회 (읽기 전용)"""
    response = supabase.table("questions") \
        .select("*, question_topics(*)") \
        .eq("id", question_id) \
        .single() \
        .execute()

    return response.data if response.data else None

# 가중치 기반 문제 선택
async def get_weighted_question(
    user_id: str,
    user_level: str,
    topics: List[str]
) -> Optional[Dict]:
    """가중치 기반 문제 선택 (읽기 전용)"""
    # PostgREST의 제약으로 복잡한 쿼리는 RPC 함수 활용
    response = supabase.rpc(
        "get_weighted_question",
        {
            "p_user_id": user_id,
            "p_level": user_level,
            "p_topics": topics
        }
    ).execute()

    return response.data if response.data else None

# app/main.py
from app.database import get_user_profile, get_question
from fastapi import Depends

@app.post("/evaluate")
async def evaluate_answer(
    request: EvaluationRequest,
    user = Depends(verify_token)
):
    # 사용자 정보 조회 (읽기만)
    user_profile = await get_user_profile(user.id)
    question = await get_question(request.question_id)

    # AI 평가 수행
    result = await evaluation_agent.ainvoke({
        "question": question["question_text"],
        "answer": request.answer,
        "current_level": user_profile["current_level"]
    })

    # ⚠️ DB 저장은 하지 않음!
    # Frontend가 결과를 받아서 Next.js API로 저장
    return result
```

**Supabase RPC 함수 (PostgreSQL):**

```sql
-- Supabase SQL Editor에서 실행
CREATE OR REPLACE FUNCTION get_weighted_question(
    p_user_id UUID,
    p_level TEXT,
    p_topics TEXT[]
)
RETURNS TABLE (
    id UUID,
    question_text TEXT,
    question_type TEXT,
    difficulty_level TEXT,
    topic_name TEXT,
    weight NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        q.id,
        q.question_text,
        q.question_type,
        q.difficulty_level,
        qt.topic_name,
        COALESCE(qw.weight, 1.0) as weight
    FROM questions q
    JOIN question_topics qt ON q.topic_id = qt.id
    LEFT JOIN question_weights qw
        ON qw.user_id = p_user_id
        AND qt.topic_name = qw.topic_name
        AND q.question_type = qw.question_type
    WHERE q.difficulty_level = p_level
        AND qt.topic_name = ANY(p_topics)
    ORDER BY weight DESC, RANDOM()
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
