"""
OPIc 롤플레이 대화 Agent.
AI가 상대역을 맡아 자연스러운 대화를 진행.
"""

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_community.chat_message_histories import ChatMessageHistory

from app.core.config import settings


# 세션별 대화 기록 저장소
_conversation_histories: dict[str, ChatMessageHistory] = {}


def get_session_history(session_id: str) -> ChatMessageHistory:
    """세션별 대화 기록 반환"""
    if session_id not in _conversation_histories:
        _conversation_histories[session_id] = ChatMessageHistory()
    return _conversation_histories[session_id]


def clear_session_history(session_id: str) -> None:
    """세션 대화 기록 초기화"""
    if session_id in _conversation_histories:
        del _conversation_histories[session_id]


ROLEPLAY_SYSTEM_PROMPT = """당신은 OPIc 롤플레이 시험에서 {ai_role} 역할을 맡은 AI입니다.

## 시나리오
{scenario}

## 당신의 역할
{ai_role_details}

## 대화 규칙

1. **자연스러운 응답**: 실제 {ai_role}처럼 자연스럽게 말하세요.
2. **간결성**: 답변은 1~2문장으로 간결하게 유지하세요.
3. **맥락 유지**: 이전 대화를 기억하고 일관성을 유지하세요.
4. **정보 제공**: 사용자의 질문에 명확하고 도움이 되게 답변하세요.
5. **영어 사용**: 모든 응답은 영어로 하세요.

## 중요 사항

- 질문하지 마세요 (사용자가 질문하는 역할입니다)
- 너무 길게 말하지 마세요 (실제 대화처럼)
- 친절하고 도움이 되는 톤을 유지하세요
- 대화가 자연스럽게 이어지도록 하세요

## 예시 대화

User: "What time are you open?"
You: "We're open from 9 AM to 10 PM every day."

User: "Do you have parking?"
You: "Yes, we have free parking in the back."
"""


def create_roleplay_agent():
    """롤플레이 Agent 생성"""

    # Grok LLM
    llm = ChatOpenAI(
        model=settings.XAI_MODEL,
        api_key=settings.XAI_API_KEY,
        base_url=settings.XAI_API_BASE,
        temperature=0.7,  # 자연스러운 대화를 위해 약간 높은 temperature
    )

    # Prompt template with message history
    prompt = ChatPromptTemplate.from_messages([
        ("system", ROLEPLAY_SYSTEM_PROMPT),
        MessagesPlaceholder(variable_name="history"),
        ("human", "{input}")
    ])

    # Chain 구성
    chain = prompt | llm

    # 메시지 히스토리를 포함한 Runnable
    chain_with_history = RunnableWithMessageHistory(
        chain,
        get_session_history,
        input_messages_key="input",
        history_messages_key="history",
    )

    return chain_with_history


async def generate_roleplay_response(
    session_id: str,
    user_message: str,
    scenario: str,
    ai_role: str,
    ai_role_details: str,
) -> str:
    """
    롤플레이 응답 생성

    Args:
        session_id: 대화 세션 ID
        user_message: 사용자 메시지
        scenario: 시나리오 설명
        ai_role: AI 역할 (예: "극장 직원")
        ai_role_details: AI 역할 상세 설명

    Returns:
        AI 응답 텍스트
    """
    chain = create_roleplay_agent()

    config = {"configurable": {"session_id": session_id}}

    result = await chain.ainvoke(
        {
            "input": user_message,
            "scenario": scenario,
            "ai_role": ai_role,
            "ai_role_details": ai_role_details,
        },
        config=config,
    )

    return result.content


async def generate_roleplay_response_stream(
    session_id: str,
    user_message: str,
    scenario: str,
    ai_role: str,
    ai_role_details: str,
):
    """
    롤플레이 응답 스트리밍 생성

    Yields:
        응답 텍스트 청크
    """
    # Grok LLM with streaming
    llm = ChatOpenAI(
        model=settings.XAI_MODEL,
        api_key=settings.XAI_API_KEY,
        base_url=settings.XAI_API_BASE,
        temperature=0.7,
        streaming=True,
    )

    # 대화 기록 가져오기
    history = get_session_history(session_id)

    # 메시지 구성
    messages = [
        SystemMessage(content=ROLEPLAY_SYSTEM_PROMPT.format(
            scenario=scenario,
            ai_role=ai_role,
            ai_role_details=ai_role_details,
        )),
        *history.messages,
        HumanMessage(content=user_message),
    ]

    # 스트리밍 응답
    full_response = ""
    async for chunk in llm.astream(messages):
        if chunk.content:
            full_response += chunk.content
            yield chunk.content

    # 대화 기록에 추가
    history.add_user_message(user_message)
    history.add_ai_message(full_response)


def get_conversation_count(session_id: str) -> int:
    """현재 대화 횟수 반환"""
    if session_id not in _conversation_histories:
        return 0
    # 사용자 메시지 수 카운트
    history = _conversation_histories[session_id]
    return len([m for m in history.messages if isinstance(m, HumanMessage)])
