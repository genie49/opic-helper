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
│                        Frontend (Next.js)                    │
│  - 음성 입력 UI                                              │
│  - 문제 표시                                                 │
│  - 피드백 표시                                               │
│  - 대시보드 (수준, 진행도)                                   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ HTTP/WebSocket
                 │
┌────────────────▼────────────────────────────────────────────┐
│                      Backend (Node.js/Python)                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           API Layer                                   │   │
│  │  - 음성 → 텍스트 변환                                │   │
│  │  - 문제 제공 API                                     │   │
│  │  - 피드백 제공 API                                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           AI Agent Layer (LangChain)                  │   │
│  │  ┌─────────────────┐  ┌──────────────────┐          │   │
│  │  │ 문제 출제 Agent │  │ 수준 판별 Agent  │          │   │
│  │  │                 │  │                  │          │   │
│  │  │ - 문제 선택     │  │ - 답변 분석      │          │   │
│  │  │ - 문제 생성     │  │ - 수준 업데이트  │          │   │
│  │  │ - 롤플레이 대화 │  │ - 피드백 생성    │          │   │
│  │  └─────────────────┘  └──────────────────┘          │   │
│  │                                                       │   │
│  │  ┌─────────────────────────────────────┐            │   │
│  │  │     문제 생성 Agent (선택적)         │            │   │
│  │  │  - 동적 문제 생성                    │            │   │
│  │  │  - 주제/유형/난이도 기반             │            │   │
│  │  └─────────────────────────────────────┘            │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │
┌────────────────▼────────────────────────────────────────────┐
│              Database (Supabase - PostgreSQL)                │
│  - users (사용자 정보)                                       │
│  - user_levels (사용자 수준 정보)                            │
│  - questions (문제 풀)                                       │
│  - feedbacks (피드백 이력)                                   │
│  - survey_selections (서베이 선택)                           │
└──────────────────────────────────────────────────────────────┘
```

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

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **UI**: TailwindCSS, shadcn/ui
- **State**: Zustand or React Context
- **Audio**: Web Audio API, MediaRecorder API

### Backend
- **API**: Next.js API Routes (서버리스) or FastAPI (Python)
- **Language**: TypeScript / Python
- **AI/ML**:
  - LangChain (AI Agent)
  - OpenAI API (GPT-4)
  - LangGraph (다중 Agent 협업, 선택적)

### Database
- **Primary**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage (선택적, 음성 파일 저장 시)

### AI/ML Services
- **LLM**: OpenAI GPT-4 (또는 GPT-4 Turbo)
- **STT**: TBD (Google, OpenAI Whisper, Web Speech API)
- **Pronunciation**: TBD (향후 검토)

### Deployment
- **Frontend/Backend**: Vercel
- **Database**: Supabase Cloud
- **Monitoring**: Vercel Analytics, Sentry (선택적)

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

### 1. 문제 출제 플로우

```
사용자 로그인
    ↓
서베이 작성 (최초 1회)
    ↓
대시보드 → "학습 시작" 클릭
    ↓
[문제 출제 Agent 호출]
    ↓
사용자 수준 + 서베이 + 가중치 분석
    ↓
문제 선택 or 생성
    ↓
문제 표시
```

---

### 2. 답변 및 평가 플로우

```
사용자 음성 답변
    ↓
STT (음성 → 텍스트)
    ↓
텍스트 표시 (확인, 수정 불가)
    ↓
[수준 판별 Agent 호출]
    ↓
5가지 기준 평가
    ↓
수준 업데이트 여부 판단
    ↓
DB 업데이트 (user_levels)
    ↓
피드백 생성 및 저장 (feedbacks)
    ↓
피드백 표시
    ↓
다음 문제 or 학습 종료
```

---

### 3. 롤플레이 플로우

```
[11번 문제]
AI: 상황 제시
    ↓
사용자: 질문 1 (음성)
    ↓
AI: 실시간 응답
    ↓
사용자: 질문 2 (음성)
    ↓
AI: 실시간 응답
    ↓
... (3~4개 질문 반복)
    ↓
[수준 판별 Agent 호출]
    ↓
대화 전체 평가
    ↓
피드백 제공
```

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

1. **DB 스키마 설계** - 테이블 구조 상세 정의
2. **AI Agent 프롬프트 전략** - 각 Agent별 프롬프트 엔지니어링
3. **API 명세** - 엔드포인트 정의
4. **UI/UX 와이어프레임** - 화면 설계

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
