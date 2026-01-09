"""
OPIc 답변 평가 Agent.
LangChain v1 기반으로 구현.
"""

from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser

from app.core.config import settings


class EvaluationScores(BaseModel):
    """5가지 평가 기준 점수"""
    utterance: int = Field(description="발화량 점수 (0~10)", ge=0, le=10)
    grammar: int = Field(description="문법 정확도 (0~10)", ge=0, le=10)
    vocabulary: int = Field(description="어휘 다양성 (0~10)", ge=0, le=10)
    structure: int = Field(description="논리적 구조 (0~10)", ge=0, le=10)
    pronunciation: int = Field(description="발음 정확도 (0~10)", ge=0, le=10)


class Feedback(BaseModel):
    """상세 피드백"""
    strengths: list[str] = Field(description="잘한 점 목록 (한국어)")
    weaknesses: list[str] = Field(description="부족한 점 목록 (한국어)")
    improvements: list[str] = Field(description="구체적인 개선 방법 (한국어)")
    model_answer: str = Field(description="모범 답안 예시 (영어)")


class EvaluationResult(BaseModel):
    """평가 결과"""
    evaluated_level: str = Field(description="평가된 수준 (NL, IL, IM1, IM2, IM3, IH, AL)")
    scores: EvaluationScores
    feedback: Feedback
    overall_comment: str = Field(description="종합 의견 (한국어)")


EVALUATION_SYSTEM_PROMPT = """당신은 OPIc 평가 전문가입니다.
사용자 답변을 5가지 기준으로 평가하고, 상세한 피드백을 한국어로 제공하세요.

## 평가 기준

### 1. 발화량 (Utterance)
- 문장 수, 단어 수 분석
- 등급별 기준:
  * IM1~IM3: 7~9문장, 90~130단어
  * IH: 10문장, 150단어
  * AL: 15문장, 184단어

### 2. 문법 정확도 (Grammar)
- 시제 일관성
- 주어-동사 일치
- 관사, 전치사 사용

### 3. 어휘 다양성 (Vocabulary)
- 어휘 범위와 적절성
- 동의어 및 고급 표현 활용
- 등급별:
  * IM: 일상 어휘, 간단한 형용사
  * IH: 다양한 어휘, 관용 표현
  * AL: 광범위한 어휘, 수식어 18~24개

### 4. 논리적 구조 (Structure)
- 도입-전개-결론 구조
- 문장 간 연결성
- 접속사 활용 (IM: and/but/so, IH: however/therefore, AL: 3~4개 접속사)

### 5. 발음 정확도 (Pronunciation)
- 텍스트 기반 추정 (반복, 불명확한 표현 등)

## 수준 판정 기준
총점 기준:
- 0~15: NL~IL
- 16~25: IM1~IM3
- 26~35: IH
- 36~50: AL

## 피드백 원칙
1. 구체적으로: "좋았어요" → "10문장으로 충분한 발화량을 보였습니다"
2. 실행 가능하게: "어휘를 늘리세요" → "however, therefore 같은 접속사를 활용하세요"
3. 긍정적으로: 잘한 점을 먼저 언급
4. 모범 답안: 사용자 답변을 개선한 버전 제시 (영어로)

{format_instructions}
"""


def create_evaluation_agent():
    """평가 Agent 생성"""

    # Grok LLM (OpenAI 호환 API)
    llm = ChatOpenAI(
        model=settings.XAI_MODEL,
        api_key=settings.XAI_API_KEY,
        base_url=settings.XAI_API_BASE,
        temperature=0.3,  # 일관된 평가를 위해 낮은 temperature
    )

    # Output parser
    parser = PydanticOutputParser(pydantic_object=EvaluationResult)

    # Prompt template
    prompt = ChatPromptTemplate.from_messages([
        ("system", EVALUATION_SYSTEM_PROMPT),
        ("human", """
질문: {question}

사용자 답변: {answer}

현재 수준: {current_level}
목표 수준: {target_level}

위 답변을 평가하고 JSON 형식으로 결과를 반환하세요.
""")
    ])

    # Chain 구성
    chain = prompt.partial(format_instructions=parser.get_format_instructions()) | llm | parser

    return chain


async def evaluate_answer(
    question: str,
    answer: str,
    current_level: str = "IM2",
    target_level: str = "IH"
) -> EvaluationResult:
    """
    답변 평가 실행

    Args:
        question: 문제 텍스트
        answer: 사용자 답변
        current_level: 현재 수준
        target_level: 목표 수준

    Returns:
        EvaluationResult: 평가 결과
    """
    chain = create_evaluation_agent()

    result = await chain.ainvoke({
        "question": question,
        "answer": answer,
        "current_level": current_level,
        "target_level": target_level,
    })

    return result
