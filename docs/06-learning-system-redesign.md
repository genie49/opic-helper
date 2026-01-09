# 학습 시스템 재설계

> 2025년 1월 기준 OPIc 실제 시험 구조 조사를 바탕으로 한 시스템 재설계 문서

## 1. 배경: 실제 OPIc 시험 구조

### 1.1 난이도별 차이점

| 난이도 | 문제 수 | 특징 |
|--------|---------|------|
| 1~2 | 12문제 | 가장 쉬운 문제, 짧은 답변 가능 |
| 3~4 | 15문제 | 롤플레이 + 돌발 문제 포함 |
| 5~6 | 15문제 | 3~4와 거의 동일, 14-15번만 다름 |

### 1.2 핵심 발견

- **같은 주제, 같은 유형의 문제는 난이도와 관계없이 동일한 문제가 출제됨**
- 난이도 3-4와 5-6의 차이는 마지막 2문제뿐
- IH까지는 어떤 난이도를 선택해도 크게 차이 없음
- **레벨(등급)은 문제가 아닌 평가 기준에서 결정됨**

### 1.3 시험 흐름

```
1. 사전 설문 (Background Survey)
   → 관심 주제 선택 (집, 카페, 운동 등)

2. 난이도 선택 (1-6)
   → 문제 수 결정 (12개 vs 15개)
   → 마지막 2문제 복잡도만 영향

3. 문제 출제
   - 자기소개 (항상 첫 문제)
   - 묘사형: "집에 대해 설명해주세요"
   - 루틴형: "보통 어떻게 운동하나요?"
   - 경험형: "기억에 남는 여행 경험은?"
   - 롤플레이: 상황극 대화
   - 돌발 질문: 설문에 없는 주제

4. 평가 (여기서 레벨이 결정!)
   → 같은 답변도 NL/IM/IH/AL 기준 다르게 평가
```

---

## 2. 학습 모드 설계

### 2.1 두 가지 모드

```
┌─────────────────────────────────────────────────────────────────┐
│                        학습 모드                                 │
├────────────────────────────┬────────────────────────────────────┤
│      🎯 모의고사 모드        │        🔄 무한 연습 모드            │
├────────────────────────────┼────────────────────────────────────┤
│ • 실제 OPIc 시험 시뮬레이션   │ • 랜덤 문제 무한 출제              │
│ • 12~15문제 세트             │ • 문제당 개별 피드백               │
│ • 40분 타이머               │ • 시간 제한 없음                   │
│ • 종합 평가 리포트           │ • 건너뛰기/다시하기 자유           │
│ • 시험 이력 저장             │ • 실시간 레벨 추적                 │
├────────────────────────────┼────────────────────────────────────┤
│         /mock-test          │           /practice               │
└────────────────────────────┴────────────────────────────────────┘
```

### 2.2 평가 시점 차이

```
┌─────────────────────────────────────────────────────────────────┐
│                         평가 시점                                │
├────────────────────────────┬────────────────────────────────────┤
│      🎯 모의고사 모드        │        🔄 무한 연습 모드            │
├────────────────────────────┼────────────────────────────────────┤
│                            │                                    │
│  Q1 → 답변                  │  Q1 → 답변 → 평가 → 레벨 업데이트   │
│  Q2 → 답변                  │  Q2 → 답변 → 평가 → 레벨 업데이트   │
│  Q3 → 답변                  │  Q3 → 답변 → 평가 → 레벨 업데이트   │
│  ...                       │  ...                               │
│  Q15 → 답변                 │                                    │
│         ↓                  │                                    │
│  ┌─────────────┐           │  매 문제마다:                       │
│  │ 종합 평가    │           │  • 즉시 피드백                      │
│  │ 전체 리포트  │           │  • 수준 재평가                      │
│  │ 최종 레벨    │           │  • DB 저장                         │
│  └─────────────┘           │  • 실시간 레벨 추적                  │
│                            │                                    │
└────────────────────────────┴────────────────────────────────────┘
```

### 2.3 모의고사 모드 상세

```
시험 흐름:
┌──────────────────────────────────────────┐
│  1. 자기소개 (1문제)                      │
│  2. 주제별 질문 (8~10문제)                │
│     - 묘사, 루틴, 경험 등 혼합            │
│  3. 롤플레이 (2~3문제)                    │
│  4. 돌발 질문 (1~2문제)                   │
├──────────────────────────────────────────┤
│  → 40분 타이머 (실제 시험과 동일)          │
│  → 중간에 나가면 진행상황 저장             │
│  → 완료 시 종합 리포트                    │
└──────────────────────────────────────────┘
```

### 2.4 무한 연습 모드 상세

```
┌──────────────────────────────────────────┐
│  문제 유형 필터 (선택적)                   │
│  ┌────┬────┬────┬────┬────┐             │
│  │전체│묘사│루틴│경험│롤플│              │
│  └────┴────┴────┴────┴────┘             │
│                                          │
│  → 랜덤 문제 출제                         │
│  → 답변 후 즉시 AI 피드백                 │
│  → [다음 문제] [다시 하기] [건너뛰기]      │
│  → 매 문제마다 레벨 재평가 및 저장         │
└──────────────────────────────────────────┘
```

---

## 3. 데이터 모델 변경

### 3.1 현재 구조

```sql
-- userProfiles
currentLevelId   -- 자기 평가 레벨 (❌ 제거 예정)
targetLevelId    -- 목표 레벨

-- feedbacks (답변별 피드백)
questionId       -- 어떤 문제
answerText       -- 사용자 답변 원문
evaluatedLevel   -- AI 평가 레벨 ("IM2", "IH" 등)
scores           -- { utterance: 7, grammar: 8, ... }
feedback         -- { strengths: [...], weaknesses: [...] }

-- questions
difficultyLevel  -- 문제별 난이도 (❌ 불필요)
```

### 3.2 변경 후 구조

```sql
-- userProfiles (변경)
-- currentLevelId  ❌ 삭제
targetLevelId      -- 목표 레벨 (유지)
assessedLevel      -- 🆕 AI 평가 종합 레벨 (varchar)
lastAssessedAt     -- 🆕 마지막 평가 시점 (timestamp)

-- questions (변경)
-- difficultyLevel ❌ 의미 없음, 무시 또는 삭제
questionType       -- description, routine, experience, roleplay 등
```

### 3.3 레벨 계산 로직

```typescript
// 무한 연습 모드 - 매 문제마다 실행
async function updateUserLevel(userId: string, newEvaluation: EvaluationResult) {
  // 최근 N개 평가 가져오기 (예: 최근 10개)
  const recentFeedbacks = await getRecentFeedbacks(userId, 10);

  // 가중 평균 계산 (최신 답변에 더 높은 가중치)
  const weights = [1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1];
  const weightedLevel = calculateWeightedLevel(recentFeedbacks, weights);

  // AI 평가 레벨 업데이트
  await updateProfile(userId, {
    assessedLevel: weightedLevel,
    lastAssessedAt: new Date()
  });
}
```

### 3.4 레벨 계산 예시

```
최근 5개 평가:  IM2, IM3, IM2, IM3, IH
가중치:        1.0, 0.8, 0.6, 0.4, 0.2  (최신일수록 높음)

점수 환산:     IM2=6, IM3=7, IH=8
가중 평균:     (6×1.0 + 7×0.8 + 6×0.6 + 7×0.4 + 8×0.2) / 3.0
             = 6.53 → IM3

→ assessedLevel = "IM3"
```

---

## 4. UI 변경

### 4.1 대시보드 레벨 표시

```
┌─────────────────────────────────────────┐
│  📊 나의 레벨                            │
│  ┌─────────────────────────────────┐    │
│  │  현재 수준:  IM3                │    │  ← AI 평가 기반
│  │  목표:      IH                  │    │
│  │  진행률:    ████████░░ 75%      │    │
│  └─────────────────────────────────┘    │
│                                         │
│  📈 최근 10문제 레벨 추이                 │
│  IM1 ─┬─────────────────────────        │
│  IM2 ─┼──●──●─────●──●──────────        │
│  IM3 ─┼────────●─────────●──●───        │
│  IH  ─┴─────────────────────────        │
└─────────────────────────────────────────┘
```

### 4.2 프로필 페이지

```
Before:
- 현재 레벨 선택 (자기 평가)  ❌ 제거
- 목표 레벨 선택              ✅ 유지

After:
- 목표 레벨 선택만 유지
- AI 평가 레벨은 읽기 전용으로 표시
```

### 4.3 페이지 구조

| 현재 | 변경 후 | 설명 |
|------|---------|------|
| `/practice` | `/practice` | 무한 연습 (롤플레이 포함) |
| `/roleplay` | 삭제 또는 통합 | practice에서 필터로 선택 |
| (없음) | `/mock-test` | 모의고사 모드 신규 |

---

## 5. 평가 시스템 확장

### 5.1 현재 평가 시스템의 한계

```typescript
// 현재 저장되는 정보 (너무 단순함)
scores: {
  utterance: 7,      // 발화량 (0-10)
  grammar: 8,        // 문법 (0-10)
  vocabulary: 6,     // 어휘 (0-10)
  structure: 7,      // 구조 (0-10)
  pronunciation: 5   // 발음 (0-10)
}
evaluatedLevel: "IM2"
feedback: {
  strengths: ["..."],
  weaknesses: ["..."],
  improvements: ["..."],
  model_answer: "..."
}
```

**문제점**: 너무 추상적이고, 구체적인 분석 데이터가 없음

### 5.2 정량적 지표 (Quantitative Metrics)

#### 발화량 분석 (Utterance Analysis)

| 지표 | 설명 | 예시 값 |
|------|------|---------|
| `totalWords` | 총 단어 수 | 127 |
| `sentenceCount` | 문장 수 | 9 |
| `avgWordsPerSentence` | 평균 문장 길이 | 14.1 |
| `speakingDuration` | 발화 시간 (초) | 85 |
| `wordsPerMinute` | 분당 단어 수 (WPM) | 89.6 |

#### 어휘 분석 (Vocabulary Analysis)

| 지표 | 설명 | 예시 값 |
|------|------|---------|
| `uniqueWords` | 고유 단어 수 | 89 |
| `typeTokenRatio` | 어휘 다양성 (TTR) | 0.70 |
| `advancedVocabCount` | 고급 어휘 수 | 12 |
| `advancedVocabRatio` | 고급 어휘 비율 | 0.09 |
| `repetitionRatio` | 반복 비율 | 0.15 |
| `modifierCount` | 수식어 개수 (형용사+부사) | 18 |
| `idiomCount` | 관용 표현 수 | 2 |

#### 문법 분석 (Grammar Analysis)

| 지표 | 설명 | 예시 값 |
|------|------|---------|
| `errorCount` | 문법 오류 총 수 | 3 |
| `tenseErrors` | 시제 오류 | 1 |
| `agreementErrors` | 주어-동사 일치 오류 | 1 |
| `articleErrors` | 관사 오류 | 1 |
| `prepositionErrors` | 전치사 오류 | 0 |
| `complexSentenceRatio` | 복문 비율 | 0.44 |

#### 구조/연결 분석 (Structure Analysis)

| 지표 | 설명 | 예시 값 |
|------|------|---------|
| `connectorCount` | 접속사 총 개수 | 6 |
| `basicConnectors` | 기본 접속사 (and, but, so) | 4 |
| `advancedConnectors` | 고급 접속사 (however, therefore) | 2 |
| `hasIntroduction` | 도입부 존재 여부 | true |
| `hasConclusion` | 결론부 존재 여부 | true |
| `paragraphStructure` | 문단 구성 평가 | "good" |

#### 유창성 분석 (Fluency Analysis) - 음성 입력 시

| 지표 | 설명 | 예시 값 |
|------|------|---------|
| `fillerCount` | 필러 단어 수 (um, uh, like) | 5 |
| `selfCorrectionCount` | 자기 수정 횟수 | 2 |
| `pauseCount` | 긴 멈춤 횟수 | 3 |
| `hesitationRatio` | 망설임 비율 | 0.08 |

### 5.3 정성적 지표 (Qualitative Metrics)

| 지표 | 설명 | 점수 |
|------|------|------|
| `relevance` | 질문 관련성 - 질문에 얼마나 적절히 답했는가 | 1-10 |
| `specificity` | 구체성 - 구체적인 예시, 세부사항 제공 | 1-10 |
| `completeness` | 완성도 - 요구된 모든 요소를 다뤘는지 | 1-10 |
| `coherence` | 일관성 - 논리적 흐름 | 1-10 |
| `naturalness` | 자연스러움 - 대화체로 자연스러운가 | 1-10 |
| `creativity` | 창의성 - 독특한 표현, 관용구 사용 | 1-10 |

### 5.4 OPIc 등급별 달성 기준 체크

```
┌─────────────────────────────────────────────────────────────────┐
│  📋 IH 달성 기준 체크리스트 (예시)                                │
├─────────────────────────────────────────────────────────────────┤
│  ✅ 10문장 이상                       (현재: 9문장)  → ❌        │
│  ✅ 150단어 이상                      (현재: 127단어) → ❌       │
│  ✅ 고급 접속사 2개 이상               (현재: 2개)    → ✅       │
│  ✅ 도입-전개-결론 구조                               → ✅       │
│  ✅ 구체적 예시 포함                                  → ✅       │
│  ✅ 관용 표현 3개 이상                 (현재: 2개)    → ❌       │
├─────────────────────────────────────────────────────────────────┤
│  달성률: 3/6 (50%)                                              │
│  현재 수준: IM3 (IH에 근접)                                      │
│  부족한 부분: 발화량, 관용 표현                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 5.5 등급별 기준표

| 등급 | 문장 수 | 단어 수 | 접속사 | 수식어 | 구조 |
|------|---------|---------|--------|--------|------|
| NL | 1-2 | ~30 | 0 | 0-1 | 없음 |
| NM | 3-4 | ~40 | 0-1 | 1-2 | 없음 |
| NH | 4-5 | ~50 | 1-2 | 2-3 | 단순 |
| IL | 5-6 | ~70 | 2-3 | 3-5 | 기본 |
| IM1 | 7+ | ~90 | 3+ | 5-8 | 기본 |
| IM2 | 8+ | ~110 | 4+ | 8-12 | 발전 |
| IM3 | 9+ | ~130 | 4+ | 12-15 | 발전 |
| IH | 10+ | 150+ | 5+ (고급 2+) | 15-20 | 완성 |
| AL | 15+ | 200+ | 6+ (고급 3+) | 20+ | 고급 |

### 5.6 확장된 데이터 모델

```typescript
interface DetailedEvaluation {
  // 기본 정보
  evaluatedLevel: string;           // "IM2", "IH" 등
  overallScore: number;             // 종합 점수 (0-100)

  // 정량적 지표
  metrics: {
    utterance: {
      totalWords: number;
      sentenceCount: number;
      avgWordsPerSentence: number;
      speakingDuration?: number;    // 음성 입력 시
      wordsPerMinute?: number;
    };
    vocabulary: {
      uniqueWords: number;
      typeTokenRatio: number;       // TTR
      advancedVocabCount: number;
      advancedVocabRatio: number;
      modifierCount: number;
      idiomCount: number;
    };
    grammar: {
      errorCount: number;
      errorTypes: {
        tense: number;
        agreement: number;
        article: number;
        preposition: number;
      };
      complexSentenceRatio: number;
    };
    structure: {
      connectorCount: number;
      basicConnectors: number;
      advancedConnectors: number;
      hasIntroduction: boolean;
      hasConclusion: boolean;
    };
    fluency?: {                     // 음성 입력 시
      fillerCount: number;
      selfCorrectionCount: number;
      pauseCount: number;
      hesitationRatio: number;
    };
  };

  // 정성적 평가
  qualitative: {
    relevance: number;              // 1-10
    specificity: number;
    completeness: number;
    coherence: number;
    naturalness: number;
    creativity: number;
  };

  // 등급별 달성 기준 체크
  levelCriteria: {
    targetLevel: string;
    checks: Array<{
      criterion: string;            // "10문장 이상"
      required: number | boolean;   // 10
      actual: number | boolean;     // 9
      passed: boolean;              // false
    }>;
    achievementRate: number;        // 0.0 ~ 1.0
    missingCriteria: string[];      // ["발화량 부족", "관용표현 부족"]
  };

  // 상세 피드백
  feedback: {
    strengths: string[];
    weaknesses: string[];
    improvements: string[];
    modelAnswer: string;
    specificErrors?: Array<{
      original: string;             // "I go to school yesterday"
      correction: string;           // "I went to school yesterday"
      errorType: string;            // "tense"
      explanation: string;          // "과거 시제를 사용해야 합니다"
    }>;
    vocabularySuggestions?: Array<{
      used: string;                 // "good"
      suggested: string;            // "excellent, outstanding"
      context: string;              // "더 고급 어휘를 사용해보세요"
    }>;
  };
}
```

### 5.7 평가 결과 시각화

```
┌─────────────────────────────────────────────────────────────────┐
│  📊 상세 평가 결과                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  현재 레벨: IM3          목표 레벨: IH                           │
│  종합 점수: 72/100       달성률: 50%                             │
│                                                                 │
│  ┌─── 영역별 점수 ───────────────────────────────────┐          │
│  │ 발화량    ████████░░░░ 65%  (127/150단어)         │          │
│  │ 어휘      █████████░░░ 75%  (TTR: 0.70)           │          │
│  │ 문법      ██████████░░ 85%  (오류 3개)            │          │
│  │ 구조      █████████░░░ 78%  (고급접속사 2개)       │          │
│  │ 유창성    ███████░░░░░ 60%  (필러 5개)            │          │
│  └───────────────────────────────────────────────────┘          │
│                                                                 │
│  ⚠️ IH 달성을 위해 필요한 것:                                    │
│  • 발화량 23단어 추가 필요                                       │
│  • 관용 표현 1개 추가 사용                                       │
│  • 1문장 추가 필요                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. 구현 계획

### Phase 1: 기반 정리
- [ ] `difficultyLevel` 필터 제거 (question API)
- [ ] 시드 데이터 확장 (주제당 여러 문제)
- [ ] 기존 practice 페이지 정상화

### Phase 2: 레벨 추적 시스템
- [ ] userProfiles에 `assessedLevel`, `lastAssessedAt` 추가
- [ ] `currentLevelId` 제거 (또는 deprecated)
- [ ] 무한 연습 시 매 문제마다 레벨 재계산
- [ ] 가중 평균 알고리즘 구현
- [ ] 프로필 페이지에서 자기 평가 레벨 UI 제거

### Phase 3: 무한 연습 개선
- [ ] 문제 유형 필터 추가
- [ ] roleplay를 practice에 통합
- [ ] 실시간 레벨 표시
- [ ] 대시보드에 레벨 추이 차트

### Phase 4: 모의고사 모드
- [ ] `/mock-test` 페이지 생성
- [ ] 시험 세션 관리 (12-15문제 세트)
- [ ] 40분 타이머
- [ ] 종합 리포트 생성
- [ ] 시험 이력 저장

---

## 6. 참고 자료

- [OPIc 나무위키](https://namu.wiki/w/OPIc)
- [오픽 마이너 갤러리 - 단기간 오픽 정보](https://gall.dcinside.com/mgallery/board/view/?id=opic&no=38936)
- [오픽 시험 진행 순서 및 문제 유형](https://velog.io/@jenice/OPIc-오픽-관련-시험-진행-순서부터-문제-유형-정리)
