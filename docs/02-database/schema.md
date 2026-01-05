# 데이터베이스 스키마 설계

## 목차
- [개요](#개요)
- [ERD](#erd)
- [테이블 상세](#테이블-상세)
- [인덱스 전략](#인덱스-전략)
- [마이그레이션 계획](#마이그레이션-계획)

---

## 개요

### 데이터베이스
- **시스템**: Supabase (PostgreSQL 기반)
- **버전**: PostgreSQL 15+
- **인증**: Supabase Auth (내장)

### 설계 원칙
- **정규화**: 3NF 준수
- **성능**: 적절한 인덱스 및 쿼리 최적화
- **확장성**: 향후 기능 추가 고려
- **보안**: RLS (Row Level Security) 활용

---

## ERD

```
┌─────────────────────┐
│      users          │
│  (Supabase Auth)    │
└──────────┬──────────┘
           │
           │ 1:1
           │
┌──────────▼──────────┐         ┌─────────────────────┐
│   user_profiles     │         │   opic_levels       │
│                     │    M:1  │                     │
│ - user_id (PK, FK)  ├────────▶│ - id (PK)          │
│ - current_level_id  │         │ - level_code       │
│ - target_level_id   │         │ - level_name       │
│ - created_at        │         │ - min_utterance    │
│ - updated_at        │         │ - description      │
└──────────┬──────────┘         └────────────────────┘
           │
           │ 1:M
           │
┌──────────▼──────────┐
│ survey_selections   │
│                     │
│ - id (PK)          │
│ - user_id (FK)     │
│ - category         │
│ - selection        │
│ - created_at       │
└─────────────────────┘


┌─────────────────────┐         ┌─────────────────────┐
│     questions       │    M:M  │   question_topics   │
│                     ├────────▶│                     │
│ - id (PK)          │         │ - id (PK)          │
│ - question_type    │         │ - topic_name       │
│ - difficulty_level │         │ - category         │
│ - question_text    │         │ - description      │
│ - expected_answer  │         └────────────────────┘
│ - created_by       │
│ - is_ai_generated  │
│ - created_at       │
└──────────┬──────────┘
           │
           │ M:M (through user_question_mastery)
           │
┌──────────▼──────────┐
│user_question_mastery│
│                     │
│ - id (PK)          │
│ - user_id (FK)     │
│ - question_id (FK) │
│ - mastery_level    │
│ - attempt_count    │
│ - last_attempted   │
│ - is_weak_topic    │
└─────────────────────┘


┌─────────────────────┐
│     feedbacks       │
│                     │
│ - id (PK)          │
│ - user_id (FK)     │
│ - question_id (FK) │
│ - answer_text      │
│ - evaluated_level  │
│ - scores (JSON)    │
│ - feedback (JSON)  │
│ - created_at       │
└─────────────────────┘


┌─────────────────────┐
│  question_weights   │
│                     │
│ - id (PK)          │
│ - user_id (FK)     │
│ - topic_name       │
│ - question_type    │
│ - weight           │
│ - updated_at       │
└─────────────────────┘
```

---

## 테이블 상세

### 1. users (Supabase Auth 기본 테이블)

Supabase Auth에서 자동 관리되는 테이블입니다.

```sql
-- Supabase가 자동 생성
-- auth.users 테이블
```

**주요 컬럼:**
- `id`: UUID (PK)
- `email`: 사용자 이메일
- `created_at`: 생성 시간
- `updated_at`: 업데이트 시간

---

### 2. user_profiles

사용자의 OPIc 학습 프로필 정보

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_level_id INTEGER REFERENCES opic_levels(id),
  target_level_id INTEGER REFERENCES opic_levels(id),
  display_name VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_user UNIQUE (user_id)
);

-- RLS 정책
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);
```

**컬럼 설명:**
- `user_id`: Supabase Auth 사용자 ID (FK, UNIQUE)
- `current_level_id`: 현재 OPIc 수준 (FK to opic_levels)
- `target_level_id`: 목표 OPIc 수준 (FK to opic_levels)
- `display_name`: 표시 이름 (선택적)

---

### 3. opic_levels

OPIc 등급 체계 마스터 테이블

```sql
CREATE TABLE opic_levels (
  id SERIAL PRIMARY KEY,
  level_code VARCHAR(10) NOT NULL UNIQUE,
  level_name VARCHAR(50) NOT NULL,
  level_order INTEGER NOT NULL UNIQUE,
  min_utterance INTEGER, -- 최소 발화량 (문장 수)
  min_words INTEGER, -- 최소 단어 수
  min_connectors INTEGER, -- 최소 접속사 수
  min_modifiers INTEGER, -- 최소 수식어 수
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 초기 데이터
INSERT INTO opic_levels (level_code, level_name, level_order, min_utterance, min_words, description) VALUES
  ('NL', 'Novice Low', 1, 3, 30, '단어나 구 단위 답변'),
  ('NM', 'Novice Mid', 2, 4, 40, '기본적인 문장 구성'),
  ('NH', 'Novice High', 3, 5, 50, '간단한 문장 나열'),
  ('IL', 'Intermediate Low', 4, 6, 70, '기본 의사소통 가능'),
  ('IM1', 'Intermediate Mid 1', 5, 7, 90, '일상 대화 가능'),
  ('IM2', 'Intermediate Mid 2', 6, 8, 110, '다양한 표현 시도'),
  ('IM3', 'Intermediate Mid 3', 7, 9, 130, 'IH 근접 수준'),
  ('IH', 'Intermediate High', 8, 10, 150, '논리적 문단 구성'),
  ('AL', 'Advanced Low', 9, 15, 184, '능숙한 표현 구사');
```

**컬럼 설명:**
- `level_code`: 등급 코드 (NL, NM, ..., AL)
- `level_name`: 등급 전체 이름
- `level_order`: 순서 (낮을수록 낮은 등급)
- `min_utterance`: 해당 등급 최소 문장 수
- `min_words`: 해당 등급 최소 단어 수
- `min_connectors`: 최소 접속사 수 (AL 기준)
- `min_modifiers`: 최소 수식어 수 (AL 기준)

---

### 4. survey_selections

사용자의 배경 서베이 선택 사항

```sql
CREATE TABLE survey_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL, -- 'residence', 'leisure', 'hobby', 'exercise', 'travel'
  selection VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_user_category_selection UNIQUE (user_id, category, selection)
);

CREATE INDEX idx_survey_user ON survey_selections(user_id);

-- RLS
ALTER TABLE survey_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own survey"
  ON survey_selections
  USING (auth.uid() = user_id);
```

**컬럼 설명:**
- `category`: 서베이 카테고리 (거주지, 여가활동, 취미, 운동, 여행)
- `selection`: 선택한 항목 (예: "카페", "수영", "국내여행")

**예시 데이터:**
```sql
INSERT INTO survey_selections (user_id, category, selection) VALUES
  ('user-uuid', 'residence', '가족과 함께 아파트'),
  ('user-uuid', 'leisure', '카페'),
  ('user-uuid', 'leisure', '영화'),
  ('user-uuid', 'hobby', '음악 감상'),
  ('user-uuid', 'exercise', '수영'),
  ('user-uuid', 'travel', '국내여행');
```

---

### 5. question_topics

문제 주제 마스터 테이블

```sql
CREATE TABLE question_topics (
  id SERIAL PRIMARY KEY,
  topic_name VARCHAR(50) NOT NULL UNIQUE,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  is_common_topic BOOLEAN DEFAULT FALSE, -- 돌발 주제 여부
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 초기 데이터
INSERT INTO question_topics (topic_name, category, is_common_topic) VALUES
  -- 서베이 주제
  ('집', 'residence', FALSE),
  ('카페', 'leisure', FALSE),
  ('영화', 'leisure', FALSE),
  ('음악', 'hobby', FALSE),
  ('수영', 'exercise', FALSE),
  ('국내여행', 'travel', FALSE),
  -- 돌발 주제
  ('재활용', 'common', TRUE),
  ('기술', 'common', TRUE),
  ('날씨', 'common', TRUE),
  ('가구', 'common', TRUE),
  ('패션', 'common', TRUE);
```

---

### 6. questions

문제 풀 테이블

```sql
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id INTEGER NOT NULL REFERENCES question_topics(id),
  question_type VARCHAR(50) NOT NULL, -- 'description', 'routine', 'experience', 'roleplay', 'surprise', 'combo'
  difficulty_level VARCHAR(10) NOT NULL REFERENCES opic_levels(level_code),
  question_text TEXT NOT NULL,
  expected_answer_structure TEXT, -- 예: "도입 → 설명 → 느낌"
  key_vocabulary TEXT[], -- 핵심 어휘 배열
  roleplay_context JSONB, -- 롤플레이 문제용 컨텍스트
  created_by VARCHAR(20) DEFAULT 'admin', -- 'admin' or 'ai'
  is_ai_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_questions_topic ON questions(topic_id);
CREATE INDEX idx_questions_type ON questions(question_type);
CREATE INDEX idx_questions_difficulty ON questions(difficulty_level);
CREATE INDEX idx_questions_ai_generated ON questions(is_ai_generated);
```

**컬럼 설명:**
- `topic_id`: 주제 (FK to question_topics)
- `question_type`: 문제 유형 (묘사, 루틴, 경험, 롤플레이, 돌발, 콤보)
- `difficulty_level`: 난이도 (NL ~ AL)
- `question_text`: 문제 텍스트
- `expected_answer_structure`: 예상 답변 구조 (AI 평가용)
- `key_vocabulary`: 핵심 어휘 배열
- `roleplay_context`: 롤플레이 시나리오 정보 (JSON)
- `created_by`: 생성자 ('admin' 또는 'ai')
- `is_ai_generated`: AI 생성 여부

**예시 데이터:**
```sql
INSERT INTO questions (topic_id, question_type, difficulty_level, question_text, expected_answer_structure, key_vocabulary) VALUES
  (
    1, -- 집
    'description',
    'IM2',
    '현재 살고 있는 집에 대해 설명해주세요. 위치, 외관, 방 구조 등을 포함해서 말해주세요.',
    '도입 → 위치 설명 → 외관/구조 → 좋은 점',
    ARRAY['apartment', 'location', 'spacious', 'comfortable']
  ),
  (
    2, -- 카페
    'experience',
    'IH',
    '카페에서 있었던 기억에 남는 경험에 대해 말해주세요.',
    '도입 → 시간/장소 → 상황 전개 → 느낀 점',
    ARRAY['memorable', 'experience', 'atmosphere', 'conversation']
  );
```

**롤플레이 예시:**
```sql
INSERT INTO questions (topic_id, question_type, difficulty_level, question_text, roleplay_context) VALUES
  (
    2, -- 카페
    'roleplay',
    'IH',
    '친구와 카페에서 만나기로 했는데, 친구가 길을 모릅니다. 전화로 카페 위치와 특징을 설명하고 3~4가지 질문에 답해주세요.',
    '{
      "scenario": "phone_call",
      "role": "guide",
      "context": "친구에게 카페 위치 안내",
      "expected_interactions": 3
    }'::jsonb
  );
```

---

### 7. user_question_mastery

사용자의 문제별 숙달 정도

```sql
CREATE TABLE user_question_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  mastery_level INTEGER DEFAULT 0, -- 0: 미시도, 1: 시도, 2: 부분숙달, 3: 숙달
  attempt_count INTEGER DEFAULT 0,
  last_score INTEGER, -- 최근 점수 (0~100)
  last_attempted_at TIMESTAMP WITH TIME ZONE,
  is_weak_topic BOOLEAN DEFAULT FALSE, -- 약한 주제 여부
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_user_question UNIQUE (user_id, question_id)
);

CREATE INDEX idx_mastery_user ON user_question_mastery(user_id);
CREATE INDEX idx_mastery_weak ON user_question_mastery(user_id, is_weak_topic);
CREATE INDEX idx_mastery_level ON user_question_mastery(user_id, mastery_level);

-- RLS
ALTER TABLE user_question_mastery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own mastery"
  ON user_question_mastery
  USING (auth.uid() = user_id);
```

**컬럼 설명:**
- `mastery_level`: 숙달 단계 (0: 미시도, 1: 시도, 2: 부분숙달, 3: 숙달)
- `attempt_count`: 시도 횟수
- `last_score`: 최근 점수 (0~100)
- `is_weak_topic`: 약한 주제 표시 (가중치 계산용)

---

### 8. feedbacks

AI 평가 피드백 기록

```sql
CREATE TABLE feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id),
  answer_text TEXT NOT NULL,
  evaluated_level VARCHAR(10) REFERENCES opic_levels(level_code),
  scores JSONB NOT NULL, -- 5가지 평가 점수
  feedback JSONB NOT NULL, -- 상세 피드백
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_feedbacks_user ON feedbacks(user_id);
CREATE INDEX idx_feedbacks_created ON feedbacks(created_at DESC);

-- RLS
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own feedbacks"
  ON feedbacks FOR SELECT
  USING (auth.uid() = user_id);
```

**컬럼 설명:**
- `answer_text`: 사용자 답변 (텍스트)
- `evaluated_level`: 평가된 수준
- `scores`: 점수 객체 (JSON)
- `feedback`: 피드백 객체 (JSON)

**scores JSON 구조:**
```json
{
  "utterance": 8,
  "grammar": 7,
  "vocabulary": 6,
  "structure": 8,
  "pronunciation": 7,
  "total": 36
}
```

**feedback JSON 구조:**
```json
{
  "strengths": ["문장 수가 충분함", "도입-전개 구조 양호"],
  "weaknesses": ["어휘 다양성 부족", "접속사 활용 미흡"],
  "improvements": ["however, therefore 같은 접속사 활용", "형용사 다양화"],
  "model_answer": "I'd like to tell you about my favorite cafe..."
}
```

---

### 9. question_weights

사용자별 문제 출제 가중치

```sql
CREATE TABLE question_weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_name VARCHAR(50) NOT NULL,
  question_type VARCHAR(50) NOT NULL,
  weight DECIMAL(5,2) DEFAULT 1.0, -- 기본 가중치 1.0, 약한 주제는 1.5~2.0
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_user_topic_type UNIQUE (user_id, topic_name, question_type)
);

CREATE INDEX idx_weights_user ON question_weights(user_id);

-- RLS
ALTER TABLE question_weights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own weights"
  ON question_weights
  USING (auth.uid() = user_id);
```

**컬럼 설명:**
- `topic_name`: 주제 (카페, 음악 등)
- `question_type`: 문제 유형
- `weight`: 가중치 (높을수록 자주 출제)
  - 1.0: 보통
  - 1.5: 약간 약함
  - 2.0: 많이 약함

**가중치 계산 로직:**
```
문제 선택 확률 = (weight / Σ weights) * 100%

예시:
- 카페-묘사: weight 1.0
- 음악-경험: weight 2.0 (약한 주제)
- 수영-루틴: weight 1.0

총 weight = 4.0
음악-경험 선택 확률 = 2.0 / 4.0 = 50%
```

---

## 인덱스 전략

### 주요 쿼리 패턴

1. **문제 출제 쿼리**
```sql
-- 사용자 수준 + 서베이 주제 + 가중치 기반 문제 선택
SELECT q.* FROM questions q
JOIN question_topics qt ON q.topic_id = qt.id
LEFT JOIN user_question_mastery uqm ON q.id = uqm.question_id AND uqm.user_id = $1
LEFT JOIN question_weights qw ON qt.topic_name = qw.topic_name AND q.question_type = qw.question_type
WHERE q.difficulty_level = $2
  AND qt.topic_name IN (SELECT selection FROM survey_selections WHERE user_id = $1)
  AND (uqm.mastery_level IS NULL OR uqm.mastery_level < 3)
ORDER BY COALESCE(qw.weight, 1.0) DESC, RANDOM()
LIMIT 1;
```

2. **피드백 조회 쿼리**
```sql
-- 사용자의 최근 피드백 조회
SELECT * FROM feedbacks
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT 10;
```

3. **약한 주제 파악 쿼리**
```sql
-- 사용자의 약한 주제 찾기
SELECT
  qt.topic_name,
  AVG(uqm.last_score) as avg_score,
  COUNT(*) as attempt_count
FROM user_question_mastery uqm
JOIN questions q ON uqm.question_id = q.id
JOIN question_topics qt ON q.topic_id = qt.id
WHERE uqm.user_id = $1
GROUP BY qt.topic_name
HAVING AVG(uqm.last_score) < 60
ORDER BY avg_score ASC;
```

### 복합 인덱스

```sql
-- 문제 출제 최적화
CREATE INDEX idx_questions_composite ON questions(difficulty_level, topic_id, question_type);

-- 사용자 숙달도 조회 최적화
CREATE INDEX idx_mastery_composite ON user_question_mastery(user_id, mastery_level, last_score);
```

---

## 마이그레이션 계획

### Phase 1: 기본 구조
1. `opic_levels` - 등급 마스터
2. `user_profiles` - 사용자 프로필
3. `question_topics` - 주제 마스터
4. `questions` - 문제 풀 (초기 30~50개)
5. `survey_selections` - 서베이

### Phase 2: 학습 기능
6. `user_question_mastery` - 숙달도
7. `feedbacks` - 피드백

### Phase 3: 고급 기능
8. `question_weights` - 가중치

### 마이그레이션 파일 예시

```sql
-- migrations/001_create_opic_levels.sql
CREATE TABLE opic_levels (
  -- ...
);

-- migrations/002_create_user_profiles.sql
CREATE TABLE user_profiles (
  -- ...
);

-- ...
```

---

## 데이터 초기화

### 1. 등급 데이터
```sql
-- scripts/seed_opic_levels.sql
INSERT INTO opic_levels ...
```

### 2. 주제 데이터
```sql
-- scripts/seed_question_topics.sql
INSERT INTO question_topics ...
```

### 3. 기본 문제 풀
```sql
-- scripts/seed_questions.sql
INSERT INTO questions ...
```

---

## 다음 단계

1. ✅ Supabase 프로젝트 생성
2. ✅ 마이그레이션 파일 작성
3. ✅ 초기 데이터 시드
4. ⏳ RLS 정책 테스트
5. ⏳ 인덱스 성능 테스트

---

## 참고사항

### 데이터 보존 정책
- **사용자 탈퇴 시**: CASCADE 삭제 (모든 관련 데이터 삭제)
- **피드백 데이터**: 30일 후 자동 삭제 (선택적)

### 백업 전략
- **Supabase 자동 백업**: 일일 백업 (기본 제공)
- **수동 백업**: 주간 스냅샷

### 확장 고려사항
- 향후 음성 파일 저장 시 Supabase Storage 활용
- 대용량 데이터 시 파티셔닝 고려 (feedbacks 테이블)
