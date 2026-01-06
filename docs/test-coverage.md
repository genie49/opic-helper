# 테스트 코드 커버리지

## 목차
- [테스트 구조](#테스트-구조)
- [테스트 파일 설명](#테스트-파일-설명)
- [커버리지 현황](#커버리지-현황)
- [테스트 실행 방법](#테스트-실행-방법)

---

## 테스트 구조

### 디렉토리 구조

```
frontend/
├── tests/
│   ├── api-routes/          # API Routes 테스트
│   ├── components/           # 컴포넌트 테스트 (추가 예정)
│   ├── lib/                 # 라이브러리 테스트 (추가 예정)
│   ├── vitest.setup.ts      # 테스트 설정 (mock 초기화)
│   └── vitest.config.ts     # vitest 설정
├── vitest.config.ts
└── package.json           # 테스트 스크립트
```

---

## 테스트 파일 설명

### 1. API Routes 테스트

#### Profile API 테스트 (`tests/api-routes/profile.test.ts`)

**테스트 파일:** `tests/api-routes/profile.test.ts`

**테스트 대상:** `app/api/profile/route.ts`

**테스트 케이스:**
```typescript
// GET /api/profile
- 사용자 프로필 조회 성공
- 프로필이 없는 경우 404 반환

// PATCH /api/profile
- 목표 수준 업데이트 성공
- 표시 이름 업데이트 성공
- 업데이트 필드가 없는 경우 400 반환
```

**커버하는 기능:**
- JWT 인증 미들웨어
- 프로필 조회 (현재/목표 수준 포함)
- 프로필 업데이트 (targetLevelId, displayName)
- 에러 핸들링 (not found, validation error)

---

#### Survey API 테스트 (`tests/api-routes/survey.test.ts`)

**테스트 파일:** `tests/api-routes/survey.test.ts`

**테스트 대상:** `app/api/survey/route.ts`

**테스트 케이스:**
```typescript
// GET /api/survey
- 사용자 서베이 조회 성공
- 빈 서베이 조회

// POST /api/survey
- 6개 항목 정상 저장
- 12개 항목 정상 저장
- 빈 배열 (0개) -> 400 오류
- 5개 미만 -> 400 오류
- 13개 초과 -> 400 오류
```

**커버하는 기능:**
- 서베이 항목 조회
- 서베이 저장
- 검증: 최소 6개, 최대 12개
- 에러 핸들링 (validation error)

---

#### Question API 테스트 (`tests/api-routes/question.test.ts`)

**테스트 파일:** `tests/api-routes/question.test.ts`

**테스트 대상:** `app/api/question/route.ts`

**테스트 케이스:**
```typescript
// GET /api/question/next
- 다음 문제 조회 성공
- 프로필이 없는 경우 404 반환
- 서베이 미완성인 경우 400 반환
- 사용 가능한 문제가 없는 경우 404 반환

// GET /api/question/[id]
- 특정 문제 조회 성공
- 없는 문제 조회 시 404 반환
```

**커버하는 기능:**
- 다음 문제 조회 (가중치 기반)
- 사용자 수준 확인
- 서베이 주제 필터링
- 미숙달 문제 우선 선택
- 특정 문제 ID로 조회

---

#### Feedback API 테스트 (`tests/api-routes/feedback.test.ts`)

**테스트 파일:** `tests/api-routes/feedback.test.ts`

**테스트 대상:** `app/api/feedback/route.ts`

**테스트 케이스:**
```typescript
// POST /api/feedback
- 정상적인 피드백 저장
- 필수 필드 누락 시 422 오류
- 기존 숙달도 레코드 업데이트
- 새로운 숙달도 레코드 생성
```

**커버하는 기능:**
- 피드백 저장
- 숙달도 자동 업데이트
- 시도 횟수 증가
- 점수에 따른 숙달도 레벨 계산
- 에러 핸들링 (validation error)

---

### 2. 테스트 설정

#### vitest.setup.ts

**테스트 파일:** `vitest.setup.ts`

**기능:**
- Next.js 모듈 mock (useRouter, useSearchParams)
- Supabase 모듈 mock (createClient, createServerClient)
- @testing-library/jest-dom 설정

#### vitest.config.ts

**테스트 파일:** `vitest.config.ts`

**기능:**
- jsdom 환경 설정
- 경로 별칭 (@/ → root)
- React 플러그인 설정
- CSS 지원 활성화

---

## 커버리지 현황

### 통계 (Phase 1)

| 항목 | 테스트 파일 | 테스트 수 | 통과 |
|------|-----------|----------|--------|
| **Profile API** | profile.test.ts | 5 | 5 |
| **Survey API** | survey.test.ts | 5 | 5 |
| **Question API** | question.test.ts | 2 | 2 |
| **Feedback API** | feedback.test.ts | 4 | 4 |
| **합계** | 4 files | 16 | 16 (100%) |

---

## 테스트 실행 방법

### 전체 테스트 실행

```bash
cd frontend

# 모든 테스트 실행
npm test

# 한 번만 실행 (watch 모드 아님)
npm run test:run

# UI로 테스트 실행
npm run test:ui
```

### 특정 테스트 파일만 실행

```bash
# Profile API만 테스트
npm test -- profile.test

# Survey API만 테스트
npm test -- survey.test

# Question API만 테스트
npm test -- question.test

# Feedback API만 테스트
npm test -- feedback.test
```

### 커버리지 보고서 생성

```bash
# 커버리지 보고서 생성
npm run test:coverage

# 결과: frontend/coverage/ 폴더 생성
```

---

## Mock 전략

### Next.js Mock

```typescript
// vitest.setup.ts
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}));
```

### Supabase Mock

```typescript
// vitest.setup.ts
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}));
```

### Database Mock

```typescript
// 테스트 파일 내
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));
```

---

## 추가할 테스트 (향후 작업)

### Phase 3: Whisper STT 테스트 (예정)

```
tests/
├── lib/
│   └── whisper/
│       ├── WhisperService.test.ts     # Whisper 서비스 테스트
│       └── browserCheck.test.ts    # 브라우저 호환성 테스트
└── components/
    ├── VoiceRecorder.test.ts       # 음성 녹음 컴포넌트 테스트
    └── PronunciationFeedback.test.ts # 피드백 컴포넌트 테스트
```

### Phase 4: Frontend 기능 연동 테스트 (예정)

```
tests/
└── pages/
    ├── practice.test.ts            # 연습 페이지 테스트
    ├── dashboard.test.ts           # 대시보드 페이지 테스트
    └── history.test.ts             # 기록 페이지 테스트
```

---

## 테스트 작성 가이드라인

### 좋은 테스트의 특징

1. **명확한 테스트 이름**
   - 무엇을 테스트하는지 명확히 기술
   - 예: `should return user profile with levels`

2. **AAA 패턴 준수**
   - Arrange (준비)
   - Act (실행)
   - Assert (검증)

3. **불 필요한 mock**
   - 테스트에 필요한 것만 mock
   - 과도한 mock은 피하기

4. **경계 케이스 테스트**
   - 정상 상황뿐만 아니라 경계 케이스도 테스트
   - 예: 빈 배열, null 값, 잘못된 입력

5. **에러 메시지 검증**
   - 에러 상태뿐만 아니라 에러 메시지도 검증
   - 예: expect(data.code).toBe('VALIDATION_ERROR')

---

## 문제 해결

### 알려진 문제

#### Drizzle ORM Mock

**문제:** Drizzle ORM의 메서드 체이닝을 mock하기 어려움

**해결책:** 간단한 mock 사용
```typescript
// 복잡한 체이닝 대신 간단한 mock
vi.mocked(db.select).mockReturnValue({
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue(mockData),
});
```

---

## 참고 자료

### 관련 문서

- [Vitest 공식 문서](https://vitest.dev/)
- [Testing Library 문서](https://testing-library.com/)
- [Next.js 테스트 가이드](https://nextjs.org/docs/testing)

### 관련 저장소

- [OPIc Helper 리포지토리](https://github.com/genie49/opic-helper)
- [개발 계획 문서](./development-plan.md)

---

## 마지막으로

이 문서는 **Phase 1: Next.js API Routes** 테스트에 대한 커버리지를 제공합니다. 테스트 코드는 `frontend/tests/` 디렉토리에 위치합니다.

테스트를 실행하려면:
```bash
cd frontend && npm test
```

질문이나 이슈가 있으면 GitHub Issues에 등록해주세요.
