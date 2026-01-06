# 📋 OPIc Helper 개발 계획 (FastAPI 제외)

**버전:** v1.0
**작성일:** 2026-01-06
**상태:** Execute Mode

---

## 📊 현재 상황

| 구성요소 | 상태 | 설명 |
|---------|------|------|
| Database | ✅ 완료 | Supabase + Drizzle Schema 정의 및 초기화 |
| Frontend 구조 | ✅ 완료 | Next.js 16, shadcn/ui, 기본 페이지 UI |
| 인증 (Supabase) | ✅ 완료 | Google OAuth 로그인/로그아웃/콜백 |
| Next.js API Routes | ❌ 미구현 | `/app/api/` 디렉토리 없음 |
| Whisper STT | ❌ 미구현 | 패키지 미설치, 서비스 없음 |
| Frontend 기능 연동 | ❌ 미구현 | Mock 데이터만 표시 |
| FastAPI Backend | ⏸️ 연기 | 나중에 구현 |

---

## 🎯 개발 목표

**FastAPI 없이 다음 기능을 먼저 완성:**
1. ✅ Next.js API Routes로 모든 DB CRUD 작업 구현
2. ✅ Whisper WebGPU로 클라이언트 사이드 STT 구현
3. ✅ Practice 페이지 완전한 기능 구현 (Mock 평가로)
4. ✅ Dashboard 페이지 실제 데이터 표시
5. ✅ 백엔드 연동 포인트 준비

---

## 🗓️ 개발 단계 및 일정

### **단계 1: Next.js API Routes 구현** (가장 우선)
**예상 시간:** 4-5시간

#### 1.1 기본 설정 및 미들웨어
- [ ] `/app/api/middleware/auth.ts` 작성
  - Supabase JWT 검증
  - 사용자 ID 추출
- [ ] `/app/api/middleware/error.ts` 작성
  - 에러 핸들링 헬퍼
  - 일관된 에러 응답 형식

#### 1.2 프로필 API
- [ ] `GET /api/profile` - 사용자 프로필 조회
- [ ] `PATCH /api/profile` - 프로필 업데이트 (목표 수준, 표시 이름)

#### 1.3 서베이 API
- [ ] `GET /api/survey` - 사용자 서베이 선택 조회
- [ ] `POST /api/survey` - 서베이 선택 저장 (최초 1회)

#### 1.4 문제 API
- [ ] `GET /api/question/next` - 다음 문제 조회
  - 사용자 수준 확인
  - 서베이 주제 필터링
  - 가중치 기반 문제 선택 로직
- [ ] `GET /api/question/[id]` - 특정 문제 조회

#### 1.5 피드백 API
- [ ] `POST /api/feedback` - 평가 결과 저장
  - feedbacks 테이블 저장
  - user_question_mastery 업데이트
  - 수준 업데이트 판단 (3회 연속 상승 시)
  - question_weights 조정

#### 1.6 대시보드 API
- [ ] `GET /api/dashboard` - 대시보드 통계
  - 사용자 프로필
  - 전체 시도 횟수
  - 숙달 문제 수
  - 평균 점수
  - 최근 피드백 5개

#### 1.7 숙달도 API
- [ ] `GET /api/mastery` - 사용자 숙달도 조회

---

### **단계 2: Whisper WebGPU STT 구현**
**예상 시간:** 3-4시간

#### 2.1 패키지 설치 및 설정
- [ ] `npm install @xenova/transformers`
- [ ] `next.config.js` 수정
  - WebGPU 설정
  - Cross-Origin-Opener-Policy/Embedder-Policy 헤더
  - WASM 파일 처리

#### 2.2 WhisperService 작성
- [ ] `/lib/whisper/WhisperService.ts` 작성
  - 모델 초기화 (singleton)
  - 음성 → 텍스트 변환
  - 단어별 confidence score 추출
  - 타임스탬프 추출

#### 2.3 녹음 컴포넌트
- [ ] `/components/VoiceRecorder.tsx` 작성
  - MediaRecorder API 연동
  - 녹음 시작/중지
  - 녹음 중 상태 표시
  - STT 처리 호출

#### 2.4 발음 피드백 컴포넌트
- [ ] `/components/PronunciationFeedback.tsx` 작성
  - 전체 발음 점수 표시
  - 단어별 confidence 표시
  - 낮은 confidence 단어 하이라이트
  - 개선 포인트 제시

#### 2.5 브라우저 호환성 체크
- [ ] `/lib/whisper/browserCheck.ts` 작성
  - WebGPU 지원 확인
  - HTTPS 확인
- [ ] `/components/BrowserCheck.tsx` 작성
  - 지원하지 않는 브라우저에 안내 표시

---

### **단계 3: Frontend 기능 연동**
**예상 시간:** 4-5시간

#### 3.1 Practice 페이지 실제 기능
- [ ] 문제 로드 로직
  - `/api/question/next` 호출
  - 문제 정보 표시
- [ ] 녹음 → STT 통합
  - VoiceRecorder 컴포넌트 통합
  - STT 결과 표시 (수정 불가)
- [ ] Mock 평가 결과 처리
  - 더미 평가 함수 작성
  - 피드백 표시
  - 다음 문제 버튼 활성화

#### 3.2 Dashboard 페이지 데이터 로드
- [ ] `/api/dashboard` 호출
  - 프로필 표시 (현재 수준, 목표 수준)
  - 통계 데이터 표시
  - 최근 피드백 리스트
- [ ] 숙달도 시각화
  - 원형 그래프로 숙달도 표시

#### 3.3 Survey 페이지 (필요 시)
- [ ] 서베이 선택 폼
- [ ] 카테고리별 항목 선택
- [ ] 서베이 저장 (`POST /api/survey`)

---

### **단계 4: 백엔드 연동 준비**
**예상 시간:** 2-3시간

#### 4.1 Mock 평가 서비스
- [ ] `/lib/services/mockEvaluation.ts` 작성
  - 5가지 기준으로 랜덤 점수 생성
  - 구체적인 피드백 생성
  - 모범 답안 예시
- [ ] Practice 페이지에서 mock 평가 사용

#### 4.2 SSE 클라이언트 준비
- [ ] `/lib/api/sseClient.ts` 작성
  - EventSource 래퍼
  - JWT 토큰 헤더 추가
  - 진행 상황 이벤트 핸들러
- [ ] Practice 페이지에서 SSE 연결 시뮬레이션

#### 4.3 API 호출 헬퍼
- [ ] `/lib/api/client.ts` 작성
  - fetch 래퍼
  - 자동 토큰 주입
  - 에러 핸들링

---

## 📁 파일 구조 계획

```
frontend/
├── app/
│   ├── api/
│   │   ├── middleware/
│   │   │   ├── auth.ts          # JWT 검증 미들웨어
│   │   │   └── error.ts         # 에러 핸들러
│   │   ├── profile/
│   │   │   └── route.ts        # GET, PATCH
│   │   ├── survey/
│   │   │   └── route.ts        # GET, POST
│   │   ├── question/
│   │   │   ├── route.ts        # GET / (next question)
│   │   │   └── [id]/
│   │   │       └── route.ts    # GET 특정 문제
│   │   ├── feedback/
│   │   │   └── route.ts        # POST
│   │   ├── dashboard/
│   │   │   └── route.ts        # GET
│   │   └── mastery/
│   │       └── route.ts        # GET
│   └── (dashboard)/
│       ├── practice/
│       │   └── page.tsx        # 실제 기능 구현
│       └── dashboard/
│           └── page.tsx        # 데이터 로드
├── components/
│   ├── VoiceRecorder.tsx        # 음성 녹음
│   ├── PronunciationFeedback.tsx # 발음 피드백
│   └── BrowserCheck.tsx        # 브라우저 호환성 체크
├── lib/
│   ├── whisper/
│   │   ├── WhisperService.ts    # Whisper WebGPU 서비스
│   │   └── browserCheck.ts     # WebGPU 지원 확인
│   ├── api/
│   │   ├── client.ts           # API 호출 헬퍼
│   │   └── sseClient.ts        # SSE 클라이언트
│   └── services/
│       └── mockEvaluation.ts   # Mock 평가 서비스
└── next.config.js              # WebGPU 설정 추가
```

---

## 🔑 핵심 구현 포인트

### 1. JWT 미들웨어 패턴
```typescript
// /app/api/middleware/auth.ts
export async function withAuth(
  request: Request,
  handler: (userId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  // JWT 검증 로직
  const userId = await verifyToken(request);
  return handler(userId);
}
```

### 2. 문제 선택 로직 (가중치 기반)
```typescript
// /app/api/question/route.ts
// 1. 사용자 수준 확인
const profile = await getUserProfile(userId);
const level = profile.currentLevelId;

// 2. 서베이 주제 필터링
const topics = await getUserSurveyTopics(userId);

// 3. 미숙달 문제 우선
const unmastered = await getUnmasteredQuestions(userId, level, topics);

// 4. 가중치 높은 순 + 랜덤
const question = weightedRandomSelect(unmastered);
```

### 3. Whisper 초기화 (싱글톤)
```typescript
// 첫 방문 시만 모델 다운로드 (캐시됨)
// 이후 방문 시 수초 내 초기화
const whisper = WhisperService.getInstance();
await whisper.initialize(progressCallback);
```

### 4. Mock 평가 포맷
```typescript
interface MockEvaluation {
  evaluated_level: "IM1" | "IM2" | "IM3" | "IH";
  scores: {
    utterance: number;
    grammar: number;
    vocabulary: number;
    structure: number;
    pronunciation: number;
  };
  feedback: {
    strengths: string[];
    weaknesses: string[];
    improvements: string[];
    model_answer: string;
  };
}
```

---

## ✅ 완료 기준

### 단계 1: API Routes
- [ ] 모든 API 엔드포인트 구현 완료
- [ ] JWT 인증 작동 확인
- [ ] DB CRUD 작업 테스트 통과

### 단계 2: Whisper STT
- [ ] Whisper 모델 로드 성공
- [ ] 음성 녹음 → 텍스트 변환 성공
- [ ] 단어별 confidence score 정확하게 추출

### 단계 3: Frontend 연동
- [ ] Practice 페이지 완전한 기능 작동
- [ ] Dashboard 페이지 실제 데이터 표시
- [ ] Mock 평가 결과 정확하게 표시

### 단계 4: 백엔드 준비
- [ ] Mock 평가 서비스 작동
- [ ] SSE 클라이언트 구조 준비
- [ ] FastAPI 연동 포인트 명확히 정의

---

## 🚀 다음 단계 (이후)

이 계획 완료 후:

### FastAPI 구현
1. `/api/evaluate` - 답변 평가 (SSE)
2. `/api/roleplay/*` - 롤플레이 기능
3. Mock → 실제 Grok LLM으로 교체

### 고급 기능
1. 가중치 기반 문제 출제 로직 최적화
2. 롤플레이 페이지 구현
3. 실시간 SSE 연동

---

## 🤔 결정 필요 사항

1. **Mock 평가 로직:** 랜덤 점수 대신 규칙 기반 점수 생성?
2. **Practice 페이지:** 롤플레이 문제도 Mock으로 구현할지?
3. **테스트 방식:** Jest + React Testing Library로 테스트 작성할지?

---

## 참고 문서

- [아키텍처 개요](./01-architecture/overview.md)
- [시스템 아키텍처](./01-architecture/system.md)
- [데이터베이스 스키마](./02-database/schema.md)
- [API 명세](./04-api/specification.md)
- [STT 및 발음 평가](./03-ai/stt-pronunciation.md)
- [AI Agent 구조](./03-ai/agent-structure.md)
