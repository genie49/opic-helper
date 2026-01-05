# API 명세서 (API Specification)

## 목차
- [개요](#개요)
- [인증](#인증)
- [Next.js API Routes](#nextjs-api-routes)
- [FastAPI Endpoints](#fastapi-endpoints)
- [에러 처리](#에러-처리)
- [Rate Limiting](#rate-limiting)

---

## 개요

### API 서버 구성

```
┌─────────────────────────────────────────┐
│  Frontend (Next.js)                     │
└────────┬──────────────────┬─────────────┘
         │                  │
    HTTP/REST            SSE
         │                  │
┌────────▼──────────┐  ┌───▼──────────────┐
│ Next.js API       │  │ FastAPI          │
│ (Vercel)          │  │ (GCP Cloud Run)  │
│                   │  │                  │
│ - DB CRUD         │  │ - AI 평가        │
│ - 문제 선택       │  │ - 롤플레이       │
│ - 피드백 저장     │  │ - SSE 스트리밍   │
└───────────────────┘  └──────────────────┘
```

### Base URLs

```
# 로컬 개발
Next.js API:  http://localhost:3000/api
FastAPI:      http://localhost:8000

# 프로덕션
Next.js API:  https://opic-helper.vercel.app/api
FastAPI:      https://fastapi-server-xxx-uc.a.run.app
```

---

## 인증

### 인증 방식

모든 API 엔드포인트는 JWT 토큰 인증이 필수입니다.

```http
Authorization: Bearer {access_token}
```

### 토큰 획득

```typescript
// Supabase Google OAuth 로그인
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'https://opic-helper.vercel.app/auth/callback'
  }
})

// 로그인 후 세션에서 토큰 추출
const { data: { session } } = await supabase.auth.getSession()
const accessToken = session.access_token
```

### 인증 에러

```json
// 401 Unauthorized
{
  "error": "인증 토큰이 필요합니다. 로그인 후 이용하세요."
}

// 401 Unauthorized (만료된 토큰)
{
  "error": "유효하지 않은 토큰입니다."
}
```

---

## Next.js API Routes

### 개요

- **Base URL**: `/api`
- **역할**: DB CRUD, 문제 선택, 피드백 저장
- **인증**: Supabase Client SDK
- **응답 형식**: JSON

---

### 1. 인증 (Auth)

#### `POST /api/auth/callback`

Google OAuth 콜백 처리

**요청:**
```http
POST /api/auth/callback?code={auth_code}
```

**응답:**
```json
{
  "success": true,
  "user": {
    "id": "abc-123",
    "email": "user@example.com"
  }
}
```

#### `POST /api/auth/signout`

로그아웃

**요청:**
```http
POST /api/auth/signout
Authorization: Bearer {token}
```

**응답:**
```json
{
  "success": true,
  "message": "로그아웃 되었습니다."
}
```

---

### 2. 사용자 프로필 (User Profile)

#### `GET /api/profile`

사용자 프로필 조회

**요청:**
```http
GET /api/profile
Authorization: Bearer {token}
```

**응답:**
```json
{
  "id": "profile-123",
  "user_id": "abc-123",
  "current_level": {
    "id": 6,
    "level_code": "IM2",
    "level_name": "Intermediate Mid 2",
    "min_utterance": 8,
    "min_words": 110
  },
  "target_level": {
    "id": 8,
    "level_code": "IH",
    "level_name": "Intermediate High",
    "min_utterance": 10,
    "min_words": 150
  },
  "display_name": "홍길동",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-15T12:30:00Z"
}
```

#### `PATCH /api/profile`

사용자 프로필 업데이트

**요청:**
```http
PATCH /api/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "target_level_id": 9,
  "display_name": "김철수"
}
```

**응답:**
```json
{
  "success": true,
  "profile": {
    "id": "profile-123",
    "user_id": "abc-123",
    "target_level_id": 9,
    "display_name": "김철수",
    "updated_at": "2024-01-15T12:35:00Z"
  }
}
```

---

### 3. 서베이 (Survey)

#### `GET /api/survey`

사용자 서베이 선택 조회

**요청:**
```http
GET /api/survey
Authorization: Bearer {token}
```

**응답:**
```json
{
  "selections": [
    {
      "id": "survey-1",
      "category": "residence",
      "selection": "아파트"
    },
    {
      "id": "survey-2",
      "category": "leisure",
      "selection": "카페"
    },
    {
      "id": "survey-3",
      "category": "leisure",
      "selection": "영화"
    },
    {
      "id": "survey-4",
      "category": "hobby",
      "selection": "음악"
    },
    {
      "id": "survey-5",
      "category": "exercise",
      "selection": "수영"
    },
    {
      "id": "survey-6",
      "category": "travel",
      "selection": "국내여행"
    }
  ],
  "total": 6
}
```

#### `POST /api/survey`

서베이 선택 저장 (최초 1회)

**요청:**
```http
POST /api/survey
Authorization: Bearer {token}
Content-Type: application/json

{
  "selections": [
    { "category": "residence", "selection": "아파트" },
    { "category": "leisure", "selection": "카페" },
    { "category": "leisure", "selection": "영화" },
    { "category": "hobby", "selection": "음악" },
    { "category": "exercise", "selection": "수영" },
    { "category": "travel", "selection": "국내여행" }
  ]
}
```

**응답:**
```json
{
  "success": true,
  "message": "서베이가 저장되었습니다.",
  "count": 6
}
```

**검증:**
- 최소 6개, 최대 12개 선택
- 중복 선택 불가

---

### 4. 문제 (Questions)

#### `GET /api/question/next`

다음 문제 조회 (가중치 기반)

**요청:**
```http
GET /api/question/next
Authorization: Bearer {token}
```

**응답:**
```json
{
  "question": {
    "id": "q-001",
    "topic": "카페",
    "question_type": "experience",
    "difficulty_level": "IM2",
    "question_text": "카페에서 있었던 기억에 남는 경험에 대해 말해주세요.",
    "expected_answer_structure": "도입 → 시간/장소 → 상황 전개 → 느낀 점",
    "key_vocabulary": ["memorable", "experience", "atmosphere", "conversation"]
  },
  "metadata": {
    "mastery_level": 0,
    "attempt_count": 0,
    "weight": 2.0
  }
}
```

**로직:**
1. 사용자 수준 확인 (user_profile.current_level)
2. 서베이 선택 주제 필터링
3. 미숙달 문제만 (mastery_level < 3)
4. 가중치 높은 순 + 랜덤

#### `GET /api/question/:id`

특정 문제 조회

**요청:**
```http
GET /api/question/q-001
Authorization: Bearer {token}
```

**응답:**
```json
{
  "id": "q-001",
  "topic": "카페",
  "question_type": "experience",
  "difficulty_level": "IM2",
  "question_text": "카페에서 있었던 기억에 남는 경험에 대해 말해주세요.",
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### 5. 피드백 (Feedback)

#### `POST /api/feedback`

AI 평가 결과 저장

**요청:**
```http
POST /api/feedback
Authorization: Bearer {token}
Content-Type: application/json

{
  "question_id": "q-001",
  "answer_text": "I often go to a cafe near my house...",
  "evaluated_level": "IM3",
  "scores": {
    "utterance": 8,
    "grammar": 7,
    "vocabulary": 6,
    "structure": 8,
    "pronunciation": 7,
    "total": 36
  },
  "feedback": {
    "strengths": ["문장 수가 충분함", "도입-전개 구조 양호"],
    "weaknesses": ["어휘 다양성 부족", "접속사 활용 미흡"],
    "improvements": ["however, therefore 같은 접속사 활용"],
    "model_answer": "I'd like to tell you about..."
  }
}
```

**응답:**
```json
{
  "success": true,
  "feedback_id": "feedback-123",
  "level_updated": true,
  "new_level": "IM3",
  "message": "수준이 IM3으로 업데이트되었습니다."
}
```

**부가 처리:**
1. feedbacks 테이블 저장
2. user_question_mastery 업데이트
3. 수준 업데이트 판단 (3회 연속 상승 시)
4. question_weights 조정 (점수 낮으면)

#### `GET /api/feedback`

피드백 이력 조회

**요청:**
```http
GET /api/feedback?limit=10&offset=0
Authorization: Bearer {token}
```

**응답:**
```json
{
  "feedbacks": [
    {
      "id": "feedback-123",
      "question_id": "q-001",
      "question_text": "카페에서의 경험...",
      "evaluated_level": "IM3",
      "scores": {
        "total": 36
      },
      "created_at": "2024-01-15T12:00:00Z"
    }
  ],
  "total": 25,
  "limit": 10,
  "offset": 0
}
```

---

### 6. 대시보드 (Dashboard)

#### `GET /api/dashboard`

대시보드 통계

**요청:**
```http
GET /api/dashboard
Authorization: Bearer {token}
```

**응답:**
```json
{
  "user": {
    "display_name": "홍길동",
    "current_level": "IM2",
    "target_level": "IH"
  },
  "stats": {
    "total_attempts": 50,
    "mastered_questions": 15,
    "avg_score": 72.5,
    "level_history": [
      { "level": "IM1", "achieved_at": "2024-01-01" },
      { "level": "IM2", "achieved_at": "2024-01-10" }
    ]
  },
  "weak_topics": [
    {
      "topic": "음악",
      "avg_score": 52.0,
      "attempt_count": 3,
      "weight": 2.0
    }
  ],
  "recent_feedbacks": [
    {
      "question": "카페에서의 경험",
      "evaluated_level": "IM2",
      "total_score": 36,
      "created_at": "2024-01-15T12:00:00Z"
    }
  ]
}
```

---

### 7. 숙달도 (Mastery)

#### `GET /api/mastery`

사용자 숙달도 조회

**요청:**
```http
GET /api/mastery
Authorization: Bearer {token}
```

**응답:**
```json
{
  "mastery": [
    {
      "question_id": "q-001",
      "question_text": "카페에서의 경험",
      "topic": "카페",
      "mastery_level": 2,
      "attempt_count": 3,
      "last_score": 72,
      "is_weak_topic": false
    }
  ],
  "summary": {
    "total_questions": 50,
    "not_attempted": 35,
    "attempted": 10,
    "partial_mastery": 3,
    "mastered": 2
  }
}
```

---

## FastAPI Endpoints

### 개요

- **Base URL**: `https://fastapi-server-xxx-uc.a.run.app`
- **역할**: AI 평가, 롤플레이, 문제 생성
- **인증**: Supabase JWT 검증
- **응답 형식**: SSE (Server-Sent Events) + JSON

---

### 1. 헬스 체크

#### `GET /health`

서버 상태 확인 (인증 불필요)

**요청:**
```http
GET /health
```

**응답:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T12:00:00Z"
}
```

---

### 2. 답변 평가 (SSE)

#### `POST /evaluate`

답변 평가 (실시간 스트리밍)

**요청:**
```http
POST /evaluate
Authorization: Bearer {token}
Content-Type: application/json

{
  "question_id": "q-001",
  "question": "카페에서의 경험에 대해 말해주세요.",
  "answer": "I often go to a cafe near my house. It's very cozy...",
  "words": [
    { "word": "I", "timestamp": [0.0, 0.2], "confidence": 0.98 },
    { "word": "often", "timestamp": [0.2, 0.5], "confidence": 0.95 },
    { "word": "cafe", "timestamp": [0.9, 1.3], "confidence": 0.65 }
  ],
  "current_level": "IM2",
  "target_level": "IH"
}
```

**응답 (SSE Stream):**

```
event: progress
data: {"step": "utterance", "progress": 20, "message": "발화량 분석 중..."}

event: progress
data: {"step": "grammar", "progress": 40, "message": "문법 평가 중..."}

event: progress
data: {"step": "vocabulary", "progress": 60, "message": "어휘 분석 중..."}

event: progress
data: {"step": "structure", "progress": 80, "message": "구조 분석 중..."}

event: complete
data: {
  "progress": 100,
  "result": {
    "evaluated_level": "IM3",
    "should_update": true,
    "scores": {
      "utterance": 8,
      "grammar": 7,
      "vocabulary": 6,
      "structure": 8,
      "pronunciation": 7,
      "total": 36
    },
    "feedback": {
      "strengths": ["문장 수가 충분함", "도입-전개 구조 양호"],
      "weaknesses": ["어휘 다양성 부족", "접속사 활용 미흡"],
      "improvements": ["however, therefore 같은 접속사 활용"],
      "model_answer": "I'd like to tell you about my favorite cafe..."
    },
    "overall_comment": "IM3 수준의 답변입니다..."
  }
}
```

**에러 (SSE Stream):**
```
event: error
data: {"message": "AI 평가 중 오류가 발생했습니다."}
```

**Frontend 연결 예시:**
```typescript
const eventSource = new EventSource(
  `${FASTAPI_URL}/evaluate`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

eventSource.addEventListener('progress', (e) => {
  const data = JSON.parse(e.data);
  console.log(data.message, data.progress);
});

eventSource.addEventListener('complete', (e) => {
  const data = JSON.parse(e.data);
  console.log('결과:', data.result);
  eventSource.close();
});

eventSource.addEventListener('error', (e) => {
  console.error('에러:', e);
  eventSource.close();
});
```

---

### 3. 롤플레이 (Roleplay)

#### `POST /roleplay/start`

롤플레이 시작

**요청:**
```http
POST /roleplay/start
Authorization: Bearer {token}
Content-Type: application/json

{
  "question_id": "q-rp-001",
  "scenario": "친구와 영화를 보려고 합니다. 극장에 전화하세요.",
  "user_role": "고객",
  "ai_role": "극장 직원"
}
```

**응답:**
```json
{
  "session_id": "rp-session-123",
  "scenario": "친구와 영화를 보려고 합니다. 극장에 전화하세요.",
  "initial_message": "Hello! Thank you for calling Star Cinema. How can I help you today?",
  "expected_interactions": 3
}
```

#### `POST /roleplay/chat`

롤플레이 대화 (SSE)

**요청:**
```http
POST /roleplay/chat
Authorization: Bearer {token}
Content-Type: application/json

{
  "session_id": "rp-session-123",
  "message": "What movies are showing today?"
}
```

**응답 (SSE Stream):**
```
event: message
data: {"content": "We're", "done": false}

event: message
data: {"content": " showing", "done": false}

event: message
data: {"content": " Avatar 2,", "done": false}

event: message
data: {"content": " Spider-Man,", "done": false}

event: message
data: {"content": " and The Batman.", "done": false}

event: message
data: {"done": true}
```

#### `POST /roleplay/end`

롤플레이 종료 및 평가

**요청:**
```http
POST /roleplay/end
Authorization: Bearer {token}
Content-Type: application/json

{
  "session_id": "rp-session-123"
}
```

**응답:**
```json
{
  "conversation_count": 3,
  "evaluation": {
    "evaluated_level": "IH",
    "scores": {
      "interaction": 9,
      "appropriateness": 8,
      "fluency": 7,
      "total": 24
    },
    "feedback": {
      "strengths": ["자연스러운 질문", "적절한 응답"],
      "weaknesses": ["발음 개선 필요"],
      "improvements": ["더 다양한 표현 활용"]
    }
  }
}
```

---

### 4. 문제 생성 (Phase 3)

#### `POST /generate-question`

동적 문제 생성

**요청:**
```http
POST /generate-question
Authorization: Bearer {token}
Content-Type: application/json

{
  "topic": "카페",
  "question_type": "경험",
  "difficulty": "IH",
  "existing_questions": [
    "최근 카페 경험",
    "카페에서의 문제 상황"
  ]
}
```

**응답:**
```json
{
  "question_text": "카페에서 일하는 친구를 방문한 경험에 대해 말해주세요.",
  "expected_answer_structure": "도입 → 방문 계기 → 활동 → 느낀 점",
  "key_vocabulary": ["visit", "work", "chat", "support"],
  "difficulty_justification": "친구 관계와 일터 방문이라는 복합 상황"
}
```

---

## 에러 처리

### 공통 에러 응답 형식

```json
{
  "error": "에러 메시지",
  "code": "ERROR_CODE",
  "details": {
    "field": "validation error details"
  }
}
```

### HTTP 상태 코드

```
200 OK                  - 성공
201 Created             - 생성 성공
400 Bad Request         - 잘못된 요청
401 Unauthorized        - 인증 필요
403 Forbidden           - 권한 없음
404 Not Found           - 리소스 없음
422 Unprocessable Entity - 검증 실패
429 Too Many Requests   - Rate Limit 초과
500 Internal Server Error - 서버 오류
503 Service Unavailable - 서비스 이용 불가
```

### 에러 예시

#### 401 Unauthorized
```json
{
  "error": "인증 토큰이 필요합니다. 로그인 후 이용하세요.",
  "code": "UNAUTHORIZED"
}
```

#### 400 Bad Request
```json
{
  "error": "잘못된 요청입니다.",
  "code": "BAD_REQUEST",
  "details": {
    "question_id": "필수 항목입니다."
  }
}
```

#### 422 Validation Error
```json
{
  "error": "입력 데이터 검증 실패",
  "code": "VALIDATION_ERROR",
  "details": {
    "selections": "최소 6개 항목을 선택해야 합니다."
  }
}
```

#### 429 Rate Limit
```json
{
  "error": "요청 횟수 제한을 초과했습니다.",
  "code": "RATE_LIMIT_EXCEEDED",
  "retry_after": 60
}
```

---

## Rate Limiting

### 제한 정책 (Phase 2 이후)

```
# Next.js API
- 일반 API: 100 requests / 1분
- 문제 조회: 30 requests / 1분

# FastAPI
- AI 평가: 10 requests / 1분
- 롤플레이: 5 requests / 1분
```

### 응답 헤더

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1705320000
```

---

## 데이터 스키마

### 공통 타입

```typescript
// OPIc 등급
type OpicLevel = 'NL' | 'NM' | 'NH' | 'IL' | 'IM1' | 'IM2' | 'IM3' | 'IH' | 'AL';

// 문제 유형
type QuestionType = 'description' | 'routine' | 'experience' | 'roleplay' | 'surprise' | 'combo';

// 숙달 단계
type MasteryLevel = 0 | 1 | 2 | 3; // 0: 미시도, 1: 시도, 2: 부분숙달, 3: 숙달

// 점수
interface Scores {
  utterance: number;    // 0~10
  grammar: number;      // 0~10
  vocabulary: number;   // 0~10
  structure: number;    // 0~10
  pronunciation: number; // 0~10
  total: number;        // 0~50
}

// 피드백
interface Feedback {
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  model_answer: string;
}

// 단어 (STT 결과)
interface Word {
  word: string;
  timestamp: [number, number]; // [start, end]
  confidence: number;           // 0.0~1.0
}
```

---

## 버전 관리

### API 버전

```
현재 버전: v1 (2024-01-15)
```

### 변경 이력

```
v1.0.0 (2024-01-15)
- 초기 버전
- Next.js API Routes: 인증, 프로필, 서베이, 문제, 피드백
- FastAPI: 평가, 롤플레이
```

---

## 테스트

### cURL 예시

#### 문제 조회
```bash
curl -X GET "https://opic-helper.vercel.app/api/question/next" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 평가 결과 저장
```bash
curl -X POST "https://opic-helper.vercel.app/api/feedback" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "question_id": "q-001",
    "answer_text": "I often go to a cafe...",
    "evaluated_level": "IM3",
    "scores": {...},
    "feedback": {...}
  }'
```

#### AI 평가 (SSE)
```bash
curl -N "https://fastapi-server-xxx-uc.a.run.app/evaluate" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "...",
    "answer": "...",
    "current_level": "IM2"
  }'
```

---

## 참고 자료

- [Next.js API Routes 문서](https://nextjs.org/docs/api-routes/introduction)
- [FastAPI 문서](https://fastapi.tiangolo.com/)
- [Server-Sent Events 사양](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [Supabase Auth 문서](https://supabase.com/docs/guides/auth)

---

## 다음 단계

### Phase 1
- [x] 기본 엔드포인트 정의
- [ ] 입력 검증 스키마 작성 (Zod, Pydantic)
- [ ] 에러 핸들링 구현
- [ ] API 테스트 작성

### Phase 2
- [ ] Rate Limiting 구현
- [ ] API 문서 자동 생성 (Swagger/OpenAPI)
- [ ] 모니터링 설정

### Phase 3
- [ ] API 버전 관리
- [ ] Webhook 지원 (선택적)
- [ ] GraphQL 고려 (선택적)
