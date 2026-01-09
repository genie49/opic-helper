"""
OPIc 문제 생성 Agent.
LangChain v1 기반으로 구현.
"""

from pydantic import BaseModel, Field, SecretStr
from langchain_xai import ChatXAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser

from app.core.config import settings


class GeneratedQuestion(BaseModel):
    """생성된 문제"""

    topic: str = Field(description="주제 (예: 카페, 음악, 여행)")
    question_type: str = Field(
        description="문제 유형 (description, routine, experience, roleplay, surprise)"
    )
    question_text: str = Field(description="문제 텍스트 (영어)")
    expected_answer_structure: str = Field(
        description="예상 답변 구조 (예: 도입 → 설명 → 느낌)"
    )
    key_vocabulary: list[str] = Field(description="핵심 어휘 목록")
    difficulty_level: str = Field(
        description="난이도 (NL, NM, NH, IL, IM1, IM2, IM3, IH, AL)"
    )


QUESTION_GENERATION_SYSTEM_PROMPT = """당신은 OPIc 출제 전문가입니다.
사용자의 현재 수준과 목표 수준에 맞춰 맞춤형 OPIc 문제를 생성하세요.

## 문제 생성 원칙

### 1. 난이도 조절
- **NL-NH**: 기본적인 묘사/루틴 문제
  - "현재 살고 있는 집에 대해 설명해주세요."
  - "일주일 루틴에 대해 말해주세요."
- **IL-IM3**: 구체적인 경험/묘사 문제
  - "가장 기억에 남는 여행 경험에 대해 말해주세요."
  - "좋아하는 카페의 특징과 경험에 대해 설명해주세요."
- **IH**: 복합적 주제와 논리적 구조
  - "최근 읽은 책이나 본 영화에 대해 설명하고, 왜 그것이 흥미로웠는지 말해주세요."
  - "주말 활동에 대해 말하고, 그것이 당신의 삶에 미치는 영향에 대해 설명해주세요."
- **AL**: 깊이 있는 주제와 복잡한 구조
  - "환경 보호의 중요성에 대해 논의하고, 개인적으로 참여하는 활동에 대해 설명해주세요."

### 2. 주제 범위
- **개인 생활**: 집, 취미, 운동, 음식
- **여가 활동**: 카페, 영화, 음악, 여행
- **학업/직업**: 공부 방법, 직업 계획
- **사회적 주제**: 기술, 환경, 패션 (높은 등급용)

### 3. 문제 유형
- **description**: 상황/장소 묘사
- **routine**: 일상적 활동 설명
- **experience**: 개인 경험 공유
- **roleplay**: 특정 역할 상황에서의 답변
- **surprise**: 돌발적 질문

### 4. OPIc 스타일
- 질문은 자연스럽고 대화형으로 작성
- 복잡한 문장 구조는 피하고 명확하게 작성
- 문제 길이는 2-3문장으로 제한

## 출력 형식

1. **topic**: 명확한 주제 (한국어)
2. **question_text**: 자연스러운 영어 질문
3. **question_type**: OPIc 문제 유형
4. **expected_answer_structure**: 논리적 구조 안내 (한국어)
5. **key_vocabulary**: 3-5개의 핵심 어휘 (영어)
6. **difficulty_level**: 생성된 문제의 난이도

{format_instructions}
"""


def create_question_generation_agent():
    """문제 생성 Agent 생성"""

    # Grok LLM (xAI)
    llm = ChatXAI(
        model=settings.XAI_MODEL,
        api_key=SecretStr(settings.XAI_API_KEY),
        temperature=0.7,  # 다양한 문제 생성을 위해 높은 temperature
    )

    # Output parser
    parser = PydanticOutputParser(pydantic_object=GeneratedQuestion)

    # Prompt template
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", QUESTION_GENERATION_SYSTEM_PROMPT),
            (
                "human",
                """
주제: {topic}
문제 유형: {question_type}
현재 수준: {current_level}
목표 수준: {target_level}

위 조건에 맞춰 OPIc 문제를 생성하세요.
""",
            ),
        ]
    )

    # Chain 구성
    chain = (
        prompt.partial(format_instructions=parser.get_format_instructions())
        | llm
        | parser
    )

    return chain


async def generate_question(
    topic: str = "일상",
    question_type: str = "experience",
    current_level: str = "IM2",
    target_level: str = "IH",
) -> GeneratedQuestion:
    """
    문제 생성 실행

    Args:
        topic: 주제 (예: 카페, 음악, 여행)
        question_type: 문제 유형 (description, routine, experience, roleplay, surprise)
        current_level: 현재 수준
        target_level: 목표 수준

    Returns:
        GeneratedQuestion: 생성된 문제
    """
    chain = create_question_generation_agent()

    result = await chain.ainvoke(
        {
            "topic": topic,
            "question_type": question_type,
            "current_level": current_level,
            "target_level": target_level,
        }
    )

    return result
