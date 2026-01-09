"""
SSE 기반 롤플레이 대화 API.
실시간 AI 응답을 스트리밍으로 전달.
"""

import json
import uuid
from typing import AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from app.agents.roleplay_agent import (
    generate_roleplay_response,
    generate_roleplay_response_stream,
    clear_session_history,
    get_conversation_count,
)
from app.middleware.auth import verify_token, TokenData

router = APIRouter()


class StartRoleplayRequest(BaseModel):
    """롤플레이 시작 요청"""
    scenario: str
    ai_role: str
    ai_role_details: str
    expected_interactions: int = 3


class RoleplayChatRequest(BaseModel):
    """롤플레이 대화 요청"""
    session_id: str
    message: str
    scenario: str
    ai_role: str
    ai_role_details: str


class StartRoleplayResponse(BaseModel):
    """롤플레이 시작 응답"""
    session_id: str
    greeting: str


@router.post("/roleplay/start")
async def start_roleplay(
    request: StartRoleplayRequest,
    token_data: TokenData = Depends(verify_token)
) -> StartRoleplayResponse:
    """
    롤플레이 세션 시작.
    새로운 세션 ID를 생성하고 AI의 첫 인사를 반환.
    """
    # 새 세션 ID 생성
    session_id = str(uuid.uuid4())

    # AI 첫 인사 생성
    greeting = await generate_roleplay_response(
        session_id=session_id,
        user_message="[Start the roleplay. Give a brief, natural greeting appropriate for the scenario.]",
        scenario=request.scenario,
        ai_role=request.ai_role,
        ai_role_details=request.ai_role_details,
    )

    return StartRoleplayResponse(
        session_id=session_id,
        greeting=greeting,
    )


@router.post("/roleplay/chat")
async def roleplay_chat_sse(
    request: RoleplayChatRequest,
    token_data: TokenData = Depends(verify_token)
):
    """
    롤플레이 대화 SSE 스트리밍 엔드포인트.

    Events:
    - chunk: AI 응답 청크 (실시간 타이핑 효과)
    - done: 응답 완료
    - error: 에러 발생
    """

    async def event_generator() -> AsyncGenerator[dict, None]:
        try:
            full_response = ""

            async for chunk in generate_roleplay_response_stream(
                session_id=request.session_id,
                user_message=request.message,
                scenario=request.scenario,
                ai_role=request.ai_role,
                ai_role_details=request.ai_role_details,
            ):
                full_response += chunk
                yield {
                    "event": "chunk",
                    "data": json.dumps({
                        "content": chunk,
                        "done": False,
                    }, ensure_ascii=False)
                }

            # 대화 횟수 확인
            conversation_count = get_conversation_count(request.session_id)

            yield {
                "event": "done",
                "data": json.dumps({
                    "content": full_response,
                    "done": True,
                    "conversation_count": conversation_count,
                }, ensure_ascii=False)
            }

        except Exception as e:
            yield {
                "event": "error",
                "data": json.dumps({
                    "message": f"대화 중 오류가 발생했습니다: {str(e)}"
                }, ensure_ascii=False)
            }

    return EventSourceResponse(event_generator())


@router.post("/roleplay/chat/sync")
async def roleplay_chat_sync(
    request: RoleplayChatRequest,
    token_data: TokenData = Depends(verify_token)
) -> dict:
    """
    동기식 롤플레이 대화 엔드포인트.
    SSE를 지원하지 않는 클라이언트용.
    """
    try:
        response = await generate_roleplay_response(
            session_id=request.session_id,
            user_message=request.message,
            scenario=request.scenario,
            ai_role=request.ai_role,
            ai_role_details=request.ai_role_details,
        )

        conversation_count = get_conversation_count(request.session_id)

        return {
            "success": True,
            "response": response,
            "conversation_count": conversation_count,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"대화 중 오류가 발생했습니다: {str(e)}"
        )


@router.post("/roleplay/end")
async def end_roleplay(
    session_id: str,
    token_data: TokenData = Depends(verify_token)
) -> dict:
    """
    롤플레이 세션 종료.
    대화 기록을 정리하고 세션을 종료.
    """
    clear_session_history(session_id)

    return {
        "success": True,
        "message": "롤플레이 세션이 종료되었습니다.",
    }
