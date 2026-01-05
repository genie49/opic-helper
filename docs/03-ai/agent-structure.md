# AI Agent 구조 및 프롬프트 전략

## 목차
- [개요](#개요)
- [Agent 아키텍처](#agent-아키텍처)
- [1. 문제 출제 Agent](#1-문제-출제-agent)
- [2. 수준 판별 Agent](#2-수준-판별-agent)
- [3. 문제 생성 Agent](#3-문제-생성-agent)
- [구현 가이드](#구현-가이드)
- [성능 최적화](#성능-최적화)

---

## 개요

### AI Agent 역할

본 시스템은 3개의 주요 AI Agent로 구성됩니다:

1. **문제 출제 Agent**: 사용자 수준에 맞는 문제 선택 및 롤플레이 대화
2. **수준 판별 Agent**: 답변 분석 및 피드백 생성
3. **문제 생성 Agent**: 동적 문제 생성 (Phase 3)

### 기술 스택

- **LLM**: Grok (xAI)
- **Framework**: LangChain (Python)
- **API Server**: FastAPI
- **DB Client**: Supabase Python Client (ORM 없이, 읽기 전용)
- **SSE**: sse-starlette
- **Auth**: Supabase JWT 검증 (모든 엔드포인트)
- **Frontend**: Next.js + TypeScript (EventSource API)

**참고**: DB 쓰기 작업은 Next.js API (Drizzle ORM)에서만 수행

---

## Agent 아키텍처

```
┌────────────────────────────────────────────────┐
│         Frontend (Next.js + EventSource)       │
│  - SSE 클라이언트                              │
│  - 실시간 진행 상황 표시                        │
└────────────────────┬───────────────────────────┘
                     │
                     │ SSE (직접 통신)
                     │
┌────────────────────▼───────────────────────────┐
│        FastAPI (GCP Cloud Run)                 │
│  ┌──────────────────────────────────────────┐ │
│  │        SSE Event Generator               │ │
│  │  - 진행 상황 스트리밍                     │ │
│  │  - 결과 스트리밍                         │ │
│  └──────────────┬───────────────────────────┘ │
│                 │                              │
│  ┌──────────────▼───────────────────────────┐ │
│  │       LangChain Agent Layer              │ │
│  │                                           │ │
│  │  ┌─────────────┐  ┌──────────────────┐  │ │
│  │  │ 문제 출제   │  │  수준 판별       │  │ │
│  │  │ Agent       │  │  Agent           │  │ │
│  │  │             │  │                  │  │ │
│  │  │ - 문제 선택 │  │  - 답변 분석     │  │ │
│  │  │ - 롤플레이  │  │  - 5기준 평가    │  │ │
│  │  │   대화      │  │  - 피드백 생성   │  │ │
│  │  └─────────────┘  └──────────────────┘  │ │
│  │                                           │ │
│  │  ┌──────────────────────────────────┐   │ │
│  │  │    문제 생성 Agent (Phase 3)     │   │ │
│  │  │    - 동적 문제 생성              │   │ │
│  │  └──────────────────────────────────┘   │ │
│  └───────────────────────────────────────────┘ │
└────────────────────┬───────────────────────────┘
                     │
                     │ Supabase Client
                     │ (인증 검증용)
                     │
        ┌────────────▼──────────────┐
        │   Database (Supabase)     │
        │   - 사용자 정보 조회      │
        │   - 문제 정보 조회        │
        └───────────────────────────┘

Note: DB 저장은 Frontend → Next.js API → Supabase 경로로 진행
```

---

## 1. 문제 출제 Agent

### 역할

- 사용자 수준, 서베이, 가중치를 고려한 문제 선택
- 롤플레이 문제의 실시간 대화 진행
- 대화 컨텍스트 관리 (롤플레이용)

---

### LangChain 구현

#### 1.1 기본 구조 (문제 선택)

```python
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain.chat_models import ChatOpenAI
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.tools import Tool
from langchain.schema import SystemMessage, HumanMessage

# LLM 초기화 (Grok via OpenAI-compatible API)
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    model="grok-beta",
    api_key=os.getenv("XAI_API_KEY"),
    base_url="https://api.x.ai/v1",
    temperature=0.7
)

# 문제 선택 도구
def select_question_tool(user_level: str, topics: list, weak_topics: list) -> dict:
    """
    DB에서 가중치 기반 문제 선택
    Supabase Python Client 사용 (읽기 전용)
    """
    from supabase import create_client, Client
    import os

    supabase: Client = create_client(
        os.getenv("SUPABASE_URL"),
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    )

    # Supabase Client로 문제 조회
    response = supabase.table("questions") \
        .select("*, question_topics(*), question_weights(*)") \
        .eq("difficulty_level", user_level) \
        .in_("question_topics.topic_name", topics) \
        .order("question_weights.weight", desc=True) \
        .limit(1) \
        .execute()

    return response.data[0] if response.data else None

# 도구 등록
tools = [
    Tool(
        name="select_question",
        func=select_question_tool,
        description="사용자 수준과 주제에 맞는 문제를 선택합니다."
    )
]

# 프롬프트 템플릿
prompt = ChatPromptTemplate.from_messages([
    ("system", """당신은 OPIc 시험 문제 출제 전문가입니다.

사용자 정보:
- 현재 수준: {user_level}
- 목표 수준: {target_level}
- 선택 주제: {topics}
- 약한 주제: {weak_topics}

다음 원칙을 따르세요:
1. 약한 주제를 우선적으로 출제합니다.
2. 사용자 수준에 맞는 난이도를 선택합니다.
3. 다양한 문제 유형을 균형있게 출제합니다.
4. 롤플레이 문제는 자연스러운 대화로 진행합니다.
"""),
    MessagesPlaceholder(variable_name="chat_history"),
    ("user", "{input}"),
    MessagesPlaceholder(variable_name="agent_scratchpad"),
])

# Agent 생성
agent = create_openai_functions_agent(llm, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

# 실행
result = agent_executor.invoke({
    "input": "다음 문제를 출제해주세요.",
    "user_level": "IM2",
    "target_level": "IH",
    "topics": ["카페", "음악", "수영"],
    "weak_topics": ["음악"],
    "chat_history": []
})
```

---

#### 1.2 롤플레이 대화 구조

```python
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationChain

# 롤플레이 전용 프롬프트
roleplay_prompt = ChatPromptTemplate.from_messages([
    ("system", """당신은 OPIc 롤플레이 시험관입니다.

시나리오: {scenario}
사용자 역할: {user_role}
당신의 역할: {ai_role}

규칙:
1. 사용자가 질문하면 자연스럽게 답변하세요.
2. 실제 대화처럼 맥락을 유지하세요.
3. 사용자가 3~4개 질문을 완료하면 종료하세요.
4. 답변은 간결하고 명확하게 하세요.

예시:
사용자: "What time are you available?"
당신: "We have openings at 2 PM and 4 PM today."
"""),
    MessagesPlaceholder(variable_name="history"),
    ("user", "{input}")
])

# 메모리 (대화 기록)
memory = ConversationBufferMemory(return_messages=True)

# 대화 체인
roleplay_chain = ConversationChain(
    llm=llm,
    prompt=roleplay_prompt,
    memory=memory,
    verbose=True
)

# 롤플레이 시작
scenario = "친구와 영화를 보려고 합니다. 극장에 전화하세요."
user_role = "고객"
ai_role = "극장 직원"

# 초기화
roleplay_chain.predict(
    input="[시작]",
    scenario=scenario,
    user_role=user_role,
    ai_role=ai_role
)

# 대화 진행
response_1 = roleplay_chain.predict(input="What movies are showing today?")
# AI: "We're showing Avatar 2, Spider-Man, and The Batman."

response_2 = roleplay_chain.predict(input="What times are available for Spider-Man?")
# AI: "Spider-Man is showing at 3 PM, 6 PM, and 9 PM."

# ... 계속
```

---

### 프롬프트 전략

#### System Prompt (문제 선택)

```
당신은 OPIc 시험 문제 출제 전문가입니다.

사용자의 현재 수준과 목표 수준을 고려하여 적절한 난이도의 문제를 선택해야 합니다.

## 원칙

1. **약한 주제 우선**: 사용자가 약한 주제는 2배 가중치로 출제
2. **난이도 조절**:
   - 현재 수준 = 목표 수준: 현재 수준 문제 70%, 한 단계 위 30%
   - 현재 수준 < 목표 수준: 목표 수준 문제 50%, 현재 수준 50%
3. **유형 균형**: 묘사-루틴-경험을 번갈아 출제
4. **콤보 유지**: 같은 주제 3문제는 연속으로 출제

## 문제 유형별 특징

- 묘사: 대상, 장소의 특징 설명 요구
- 루틴: 과정, 방법의 순서 설명 요구
- 경험: 특정 사건, 과거 경험 서술 요구
- 롤플레이: 상황극, 자연스러운 대화 요구

## 수준별 기준

- IM1~IM3: 7~9문장, 일상 어휘, 기본 시제
- IH: 10문장, 다양한 어휘, 모든 시제, 논리적 구조
- AL: 15문장, 184단어, 접속사 3~4개, 수식어 18~24개
```

#### System Prompt (롤플레이)

```
당신은 OPIc 롤플레이 시험에서 {ai_role} 역할을 맡은 AI입니다.

## 시나리오
{scenario_description}

## 당신의 역할
{ai_role_details}

## 대화 규칙

1. **자연스러운 응답**: 실제 {ai_role}처럼 말하세요.
2. **간결성**: 답변은 1~2문장으로 간결하게
3. **맥락 유지**: 이전 대화를 기억하고 일관성 유지
4. **정보 제공**: 질문에 명확하게 답변
5. **종료 조건**: 사용자가 3~4개 질문 완료 시 "That's all. Thank you!"

## 예시 대화

User: "What time are you open?"
You: "We're open from 9 AM to 10 PM every day."

User: "Do you have parking?"
You: "Yes, we have free parking in the back."

User: "How much is a ticket?"
You: "Regular tickets are $12, and student tickets are $8."

## 주의사항

- 질문하지 마세요 (사용자가 질문하는 역할)
- 너무 길게 말하지 마세요
- 친절하고 도움이 되는 톤 유지
```

---

## 2. 수준 판별 Agent

### 역할

- 사용자 답변 분석 (5가지 기준)
- 수준 평가 및 업데이트 판단
- 상세 피드백 생성

---

### LangChain 구현

#### 2.1 기본 구조

```python
from langchain.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from typing import List

# 출력 스키마 정의
class EvaluationScores(BaseModel):
    utterance: int = Field(description="발화량 점수 (0~10)")
    grammar: int = Field(description="문법 정확도 (0~10)")
    vocabulary: int = Field(description="어휘 다양성 (0~10)")
    structure: int = Field(description="논리적 구조 (0~10)")
    pronunciation: int = Field(description="발음 정확도 (0~10)")

class Feedback(BaseModel):
    strengths: List[str] = Field(description="잘한 점 목록")
    weaknesses: List[str] = Field(description="부족한 점 목록")
    improvements: List[str] = Field(description="개선 방법 목록")
    model_answer: str = Field(description="모범 답안 예시")

class EvaluationResult(BaseModel):
    evaluated_level: str = Field(description="평가된 수준 (NL~AL)")
    should_update: bool = Field(description="수준 업데이트 여부")
    scores: EvaluationScores
    feedback: Feedback
    overall_comment: str = Field(description="종합 의견")

# 파서
parser = PydanticOutputParser(pydantic_object=EvaluationResult)

# 프롬프트
evaluation_prompt = ChatPromptTemplate.from_messages([
    ("system", """당신은 OPIc 평가 전문가입니다.

사용자 답변을 5가지 기준으로 평가하고, 상세한 피드백을 제공하세요.

## 평가 기준

### 1. 발화량 (Utterance)
- 문장 수, 단어 수
- 등급별 기준:
  * IM1~IM3: 7~9문장, 90~130단어
  * IH: 10문장, 150단어
  * AL: 15문장, 184단어

### 2. 문법 정확도 (Grammar)
- 시제 일관성
- 수 일치 (단수/복수)
- 구문 정확도 (관계절, 조건절 등)

### 3. 어휘 다양성 (Vocabulary)
- 어휘 범위
- 동의어 사용
- 고급 표현 활용
- 등급별 기준:
  * IM: 일상 어휘, 간단한 형용사
  * IH: 다양한 어휘, 관용 표현
  * AL: 광범위한 어휘, 수식어 18~24개

### 4. 논리적 구조 (Structure)
- 도입-전개-결론
- 문장 간 연결성
- 접속사 활용
- 등급별 기준:
  * IM: 기본 접속사 (and, but, so)
  * IH: 다양한 접속사 (however, therefore)
  * AL: 접속사 3~4개, 문단 결속력

### 5. 발음 정확도 (Pronunciation)
- 텍스트 기반 추정 (반복, 오타, 불명확한 표현)
- 실제 발음은 STT 결과로 추정

## 수준 판정

점수 합계를 기준으로:
- 0~15: NL~IL
- 16~25: IM1~IM3
- 26~35: IH
- 36~50: AL

단, 각 항목이 균형있어야 함 (한 항목만 높으면 안 됨)

## 피드백 원칙

1. 구체적으로: "좋았어요" → "10문장으로 충분한 발화량"
2. 실행 가능하게: "어휘를 늘리세요" → "however, therefore 같은 접속사 활용"
3. 긍정적으로: 잘한 점을 먼저 언급
4. 모범 답안: 사용자 답변을 개선한 버전 제시

{format_instructions}
"""),
    ("user", """
질문: {question}
사용자 답변: {answer}
현재 수준: {current_level}
목표 수준: {target_level}
""")
])

# 체인 생성
evaluation_chain = evaluation_prompt | llm | parser

# 실행
result = evaluation_chain.invoke({
    "question": "자주 가는 카페에 대해 설명해주세요.",
    "answer": "I often go to a cafe near my house. It's very cozy and comfortable. I like to study there because it's quiet. They have good coffee and pastries. The barista is friendly. I go there every weekend.",
    "current_level": "IM2",
    "target_level": "IH",
    "format_instructions": parser.get_format_instructions()
})

print(result)
```

---

#### 2.2 출력 예시

```json
{
  "evaluated_level": "IM3",
  "should_update": true,
  "scores": {
    "utterance": 7,
    "grammar": 8,
    "vocabulary": 6,
    "structure": 7,
    "pronunciation": 8
  },
  "feedback": {
    "strengths": [
      "6문장으로 충분한 발화량을 보였습니다.",
      "기본 문법이 정확합니다 (주어-동사 일치).",
      "간결하고 명확한 문장 구성입니다."
    ],
    "weaknesses": [
      "어휘가 단순합니다 (cozy, comfortable 외 형용사 부족).",
      "접속사가 없어 문장이 단절되어 있습니다.",
      "도입-전개-결론 구조가 명확하지 않습니다."
    ],
    "improvements": [
      "다양한 형용사 사용: cozy → warm and inviting atmosphere",
      "접속사 활용: Moreover, Additionally, What I especially like",
      "구조화: 도입(소개) → 전개(특징, 활동) → 결론(느낌)",
      "IH 수준 목표: 10문장, 다양한 시제, 접속사 2~3개"
    ],
    "model_answer": "I'd like to tell you about my favorite cafe near my house. It's a cozy place with a warm and inviting atmosphere. I often go there on weekends to study because it's relatively quiet compared to other cafes. What I especially like is their excellent coffee and freshly baked pastries. Moreover, the barista is always friendly and remembers my usual order. The cafe has comfortable seating and good lighting, which makes it perfect for reading. Overall, it has become my go-to place for relaxation and productivity."
  },
  "overall_comment": "IM3 수준의 답변입니다. 기본 문법과 발화량은 양호하나, IH로 향상하기 위해서는 접속사 활용과 어휘 다양성을 개선해야 합니다. 특히 도입-전개-결론 구조를 의식적으로 연습하세요."
}
```

---

### 프롬프트 전략

#### 발화량 분석 프롬프트

```python
utterance_prompt = """
답변을 분석하여 발화량을 평가하세요.

답변: {answer}

분석 항목:
1. 문장 수: {sentence_count}
2. 단어 수: {word_count}
3. 평균 문장 길이: {avg_sentence_length}

등급별 기준:
- IM1: 7문장, 90단어
- IM2: 8문장, 110단어
- IM3: 9문장, 130단어
- IH: 10문장, 150단어
- AL: 15문장, 184단어

현재 수준 ({current_level}) 기준으로 평가:
- 달성: {sentence_count >= target}
- 점수: {score}/10
- 피드백: {...}
"""
```

#### 문법 분석 프롬프트

```python
grammar_prompt = """
답변의 문법을 분석하세요.

답변: {answer}

체크리스트:
1. 시제 일관성
   - 현재형: { }
   - 과거형: { }
   - 미래형: { }
   - 완료형: { }

2. 주어-동사 일치
   - 오류: [ ]

3. 관사 사용 (a/an/the)
   - 적절성: [ ]

4. 복잡한 구문 (관계절, 조건절)
   - 사용 여부: [ ]
   - 정확성: [ ]

점수: {score}/10
피드백: {...}
```

---

## 3. 문제 생성 Agent

### 역할 (Phase 3)

- 사용자가 모든 문제를 숙달했을 때 새로운 문제 생성
- 주제, 유형, 난이도에 맞는 문제 자동 생성

---

### LangChain 구현

```python
from langchain.prompts import ChatPromptTemplate

# 문제 생성 프롬프트
generation_prompt = ChatPromptTemplate.from_messages([
    ("system", """당신은 OPIc 문제 출제 전문가입니다.

주제, 문제 유형, 난이도에 맞는 새로운 문제를 생성하세요.

## 문제 유형별 특징

### 묘사 (Description)
- 대상이나 장소의 특징 설명 요구
- 예: "자주 가는 카페를 묘사하세요."

### 루틴 (Routine)
- 과정이나 방법의 순서 설명 요구
- 예: "카페에서 주로 무엇을 하나요?"

### 경험 (Experience)
- 특정 사건이나 과거 경험 서술 요구
- 예: "카페에서 있었던 기억에 남는 경험을 말하세요."

### 롤플레이 (Roleplay)
- 상황극, 문제 해결 요구
- 예: "카페에 전화해서 예약하세요."

## 난이도별 특징

### IM1~IM3
- 일상적이고 친숙한 상황
- 간단한 묘사나 설명
- 구체적인 가이드 제공

### IH
- 약간 복잡한 상황
- 비교나 대조 요구
- 논리적 설명 필요

### AL
- 복잡하거나 추상적 상황
- 깊이 있는 분석 요구
- 다양한 시각 제시

## 출력 형식

{
  "question_text": "...",
  "expected_answer_structure": "도입 → ... → 결론",
  "key_vocabulary": ["word1", "word2", ...],
  "difficulty_justification": "왜 이 난이도인지 설명"
}
"""),
    ("user", """
새로운 문제를 생성하세요.

주제: {topic}
문제 유형: {question_type}
난이도: {difficulty}
기존 문제 (중복 방지):
{existing_questions}
""")
])

# 체인
generation_chain = generation_prompt | llm | parser

# 실행
result = generation_chain.invoke({
    "topic": "카페",
    "question_type": "경험",
    "difficulty": "IH",
    "existing_questions": [
        "카페에서 있었던 기억에 남는 경험",
        "카페에서 문제가 생긴 상황"
    ]
})
```

---

## 구현 가이드

### Python (FastAPI) 구현

```python
# app/agents/question_agent.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from langchain.chat_models import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_functions_agent

app = FastAPI()

class QuestionRequest(BaseModel):
    user_id: str
    user_level: str
    topics: list[str]

@app.post("/api/question/next")
async def get_next_question(request: QuestionRequest):
    try:
        # Agent 실행
        result = question_agent.invoke({
            "user_id": request.user_id,
            "user_level": request.user_level,
            "topics": request.topics
        })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/evaluate")
async def evaluate_answer(request: EvaluationRequest):
    try:
        result = evaluation_agent.invoke({...})
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

### FastAPI SSE 서버 구현

```python
# main.py
from fastapi import FastAPI, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
import asyncio
import json
from typing import AsyncGenerator

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-app.vercel.app",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 인증 검증 (모든 엔드포인트 필수)
from fastapi import Header, HTTPException
from supabase import create_client, Client
import os

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

async def verify_token(authorization: str = Header(None)):
    """
    Supabase JWT 검증
    모든 API 요청은 로그인 필수
    """
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="인증 토큰이 필요합니다. 로그인 후 이용하세요."
        )

    try:
        token = authorization.replace("Bearer ", "")

        # Supabase Auth API로 토큰 검증
        user_response = supabase.auth.get_user(token)

        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=401,
                detail="유효하지 않은 토큰입니다."
            )

        return user_response.user

    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=f"인증 실패: {str(e)}"
        )

# SSE 평가 엔드포인트
@app.post("/evaluate")
async def evaluate_answer(
    request: EvaluationRequest,
    user = Depends(verify_token)
):
    """답변 평가 SSE 스트리밍"""

    async def event_generator() -> AsyncGenerator:
        try:
            # 1. 발화량 분석
            yield {
                "event": "progress",
                "data": json.dumps({
                    "step": "utterance",
                    "progress": 20,
                    "message": "발화량 분석 중..."
                })
            }
            await asyncio.sleep(0.5)

            # 2. 문법 분석
            yield {
                "event": "progress",
                "data": json.dumps({
                    "step": "grammar",
                    "progress": 40,
                    "message": "문법 평가 중..."
                })
            }

            # LangChain Agent 실행
            result = await evaluation_agent.ainvoke({
                "question": request.question,
                "answer": request.answer,
                "current_level": request.current_level
            })

            # 3. 최종 결과
            yield {
                "event": "complete",
                "data": json.dumps({
                    "progress": 100,
                    "result": {
                        "evaluated_level": result.evaluated_level,
                        "scores": result.scores.dict(),
                        "feedback": result.feedback.dict()
                    }
                })
            }

        except Exception as e:
            yield {
                "event": "error",
                "data": json.dumps({"message": str(e)})
            }

    return EventSourceResponse(event_generator())

# 롤플레이 대화 SSE
@app.post("/roleplay/chat")
async def roleplay_chat(
    request: RoleplayChatRequest,
    user = Depends(verify_token)
):
    """롤플레이 대화 SSE 스트리밍"""

    async def event_generator() -> AsyncGenerator:
        # LangChain Memory에서 대화 이력 로드
        conversation = get_conversation(request.session_id)

        # 사용자 메시지 추가
        conversation.add_message(HumanMessage(content=request.message))

        # AI 응답 생성 (스트리밍)
        async for chunk in conversation.astream(request.message):
            yield {
                "event": "message",
                "data": json.dumps({
                    "content": chunk.content,
                    "done": False
                })
            }

        yield {
            "event": "message",
            "data": json.dumps({"done": True})
        }

    return EventSourceResponse(event_generator())
```

---

### Frontend SSE 클라이언트 구현 (Next.js)

```typescript
// app/components/AnswerEvaluation.tsx
"use client";

import { useState } from "react";
import { useSupabase } from "@/lib/supabase-provider";

interface EvaluationProgress {
  step: string;
  progress: number;
  message: string;
}

interface EvaluationResult {
  evaluated_level: string;
  scores: Record<string, number>;
  feedback: any;
}

export default function AnswerEvaluation() {
  const { session } = useSupabase();
  const [progress, setProgress] = useState<EvaluationProgress | null>(null);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const evaluateAnswer = async (
    answer: string,
    questionId: string,
    question: string
  ) => {
    setIsEvaluating(true);
    setProgress(null);
    setResult(null);

    const token = session?.access_token;
    const fastApiUrl = process.env.NEXT_PUBLIC_FASTAPI_URL;

    // 1. 평가 시작 (POST)
    await fetch(`${fastApiUrl}/evaluate`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question,
        answer,
        current_level: "IM2",
      }),
    });

    // 2. SSE 스트림 연결
    const eventSource = new EventSource(
      `${fastApiUrl}/evaluate?token=${token}`,
      { withCredentials: true }
    );

    // 진행 상황 이벤트
    eventSource.addEventListener("progress", (e) => {
      const data = JSON.parse(e.data);
      setProgress(data);
    });

    // 완료 이벤트
    eventSource.addEventListener("complete", async (e) => {
      const data = JSON.parse(e.data);
      setResult(data.result);

      // 3. 결과 저장 (Next.js API)
      await fetch("/api/feedback/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId,
          answer,
          ...data.result,
        }),
      });

      eventSource.close();
      setIsEvaluating(false);
    });

    // 에러 처리
    eventSource.addEventListener("error", (e) => {
      console.error("SSE Error:", e);
      eventSource.close();
      setIsEvaluating(false);
    });
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => evaluateAnswer("...", "123", "...")}
        disabled={isEvaluating}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        {isEvaluating ? "평가 중..." : "평가 시작"}
      </button>

      {progress && (
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600">{progress.message}</p>
        </div>
      )}

      {result && (
        <div className="border rounded-lg p-4">
          <h3 className="font-bold">평가 결과: {result.evaluated_level}</h3>
          <div className="mt-2">
            <h4 className="font-semibold">점수:</h4>
            <ul>
              {Object.entries(result.scores).map(([key, value]) => (
                <li key={key}>
                  {key}: {value}/10
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### 롤플레이 SSE 클라이언트

```typescript
// app/components/RoleplayChat.tsx
"use client";

import { useState } from "react";

export default function RoleplayChat({ sessionId }: { sessionId: string }) {
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
  const [currentAiMessage, setCurrentAiMessage] = useState("");
  const [isResponding, setIsResponding] = useState(false);

  const sendMessage = async (userMessage: string) => {
    // 사용자 메시지 추가
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsResponding(true);
    setCurrentAiMessage("");

    const fastApiUrl = process.env.NEXT_PUBLIC_FASTAPI_URL;
    const token = session?.access_token;

    // SSE 연결
    const eventSource = new EventSource(
      `${fastApiUrl}/roleplay/chat`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          message: userMessage,
        })
      }
    );

    eventSource.addEventListener("message", (e) => {
      const data = JSON.parse(e.data);

      if (data.done) {
        // AI 응답 완료
        setMessages(prev => [
          ...prev,
          { role: "assistant", content: currentAiMessage }
        ]);
        setCurrentAiMessage("");
        setIsResponding(false);
        eventSource.close();
      } else {
        // 스트리밍 중 (타이핑 효과)
        setCurrentAiMessage(prev => prev + data.content);
      }
    });
  };

  return (
    <div className="flex flex-col h-96">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-2 rounded ${
              msg.role === "user" ? "bg-blue-100 ml-auto" : "bg-gray-100"
            }`}
          >
            {msg.content}
          </div>
        ))}
        {currentAiMessage && (
          <div className="p-2 rounded bg-gray-100">
            {currentAiMessage}
            <span className="animate-pulse">▋</span>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 성능 최적화

### 1. 캐싱 전략

```python
from functools import lru_cache

@lru_cache(maxsize=100)
def get_evaluation_prompt(level: str) -> str:
    """등급별 프롬프트 캐싱"""
    return load_prompt_template(level)
```

### 2. 스트리밍 응답

```python
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler

llm = ChatOpenAI(
    streaming=True,
    callbacks=[StreamingStdOutCallbackHandler()]
)
```

### 3. 배치 처리

```python
# 여러 문제를 한 번에 평가
from langchain.chains import SequentialChain

evaluation_chain = SequentialChain(
    chains=[utterance_chain, grammar_chain, vocab_chain],
    input_variables=["answer"],
    output_variables=["scores"]
)
```

### 4. 프롬프트 최적화

- 불필요한 설명 제거
- 예시를 최소화
- Few-shot → Zero-shot (가능한 경우)

---

## 모니터링 및 로깅

### LangSmith 활용

```python
from langchain.smith import RunEvalConfig

# 평가 설정
eval_config = RunEvalConfig(
    evaluators=["qa", "cot_qa"],
    custom_evaluators=[custom_evaluator]
)

# 추적
from langsmith import Client
client = Client()

client.create_run(
    name="evaluation_run",
    inputs={"question": "...", "answer": "..."},
    outputs={"result": result}
)
```

---

## 다음 단계

1. ✅ 각 Agent별 프롬프트 템플릿 작성
2. ✅ LangChain 코드 구현
3. ⏳ 단위 테스트 작성
4. ⏳ 프롬프트 A/B 테스트
5. ⏳ 성능 벤치마킹

---

## 참고 자료

- [LangChain을 활용한 AI 에이전트 생성 가이드](https://velog.io/@gogocomputer/Creating-an-AI-Agent-with-LangChain)
- [LangChain 공식 문서 - Agents](https://python.langchain.com/docs/modules/agents/)
- [OpenAI API 문서](https://platform.openai.com/docs/api-reference)
- [Prompt Engineering Guide](https://www.promptingguide.ai/)
