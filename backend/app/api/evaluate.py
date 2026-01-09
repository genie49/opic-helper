"""
SSE 기반 답변 평가 API.
실시간 진행 상황을 스트리밍으로 전달.
"""

import json
import asyncio
from typing import AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from app.agents.evaluation_agent import evaluate_answer, EvaluationResult
from app.middleware.auth import verify_token, TokenData

router = APIRouter()


class EvaluateRequest(BaseModel):
    """평가 요청"""
    question_id: str
    question: str
    answer: str
    current_level: str = "IM2"
    target_level: str = "IH"


class ProgressEvent(BaseModel):
    """진행 상황 이벤트"""
    step: str
    progress: int
    message: str


@router.post("/evaluate")
async def evaluate_answer_sse(
    request: EvaluateRequest,
    token_data: TokenData = Depends(verify_token)
):
    """
    답변 평가 SSE 스트리밍 엔드포인트.

    Events:
    - progress: 진행 상황 (step, progress %, message)
    - complete: 평가 완료 (result)
    - error: 에러 발생 (message)
    """

    async def event_generator() -> AsyncGenerator[dict, None]:
        try:
            # 1. 시작
            yield {
                "event": "progress",
                "data": json.dumps({
                    "step": "start",
                    "progress": 10,
                    "message": "평가를 시작합니다..."
                }, ensure_ascii=False)
            }
            await asyncio.sleep(0.3)

            # 2. 발화량 분석
            yield {
                "event": "progress",
                "data": json.dumps({
                    "step": "utterance",
                    "progress": 25,
                    "message": "발화량을 분석하고 있습니다..."
                }, ensure_ascii=False)
            }
            await asyncio.sleep(0.2)

            # 3. 문법 분석
            yield {
                "event": "progress",
                "data": json.dumps({
                    "step": "grammar",
                    "progress": 40,
                    "message": "문법을 평가하고 있습니다..."
                }, ensure_ascii=False)
            }
            await asyncio.sleep(0.2)

            # 4. 어휘/구조 분석
            yield {
                "event": "progress",
                "data": json.dumps({
                    "step": "vocabulary",
                    "progress": 55,
                    "message": "어휘와 구조를 분석하고 있습니다..."
                }, ensure_ascii=False)
            }
            await asyncio.sleep(0.2)

            # 5. AI 평가 실행
            yield {
                "event": "progress",
                "data": json.dumps({
                    "step": "ai_evaluation",
                    "progress": 70,
                    "message": "AI가 종합 평가를 생성하고 있습니다..."
                }, ensure_ascii=False)
            }

            # LangChain Agent 실행
            result: EvaluationResult = await evaluate_answer(
                question=request.question,
                answer=request.answer,
                current_level=request.current_level,
                target_level=request.target_level,
            )

            # 6. 피드백 생성
            yield {
                "event": "progress",
                "data": json.dumps({
                    "step": "feedback",
                    "progress": 90,
                    "message": "피드백을 생성하고 있습니다..."
                }, ensure_ascii=False)
            }
            await asyncio.sleep(0.2)

            # 7. 완료
            yield {
                "event": "complete",
                "data": json.dumps({
                    "progress": 100,
                    "result": {
                        "evaluated_level": result.evaluated_level,
                        "scores": result.scores.model_dump(),
                        "feedback": result.feedback.model_dump(),
                        "overall_comment": result.overall_comment,
                    }
                }, ensure_ascii=False)
            }

        except Exception as e:
            yield {
                "event": "error",
                "data": json.dumps({
                    "message": f"평가 중 오류가 발생했습니다: {str(e)}"
                }, ensure_ascii=False)
            }

    return EventSourceResponse(event_generator())


@router.post("/evaluate/sync")
async def evaluate_answer_sync(
    request: EvaluateRequest,
    token_data: TokenData = Depends(verify_token)
) -> dict:
    """
    동기식 답변 평가 엔드포인트.
    SSE를 지원하지 않는 클라이언트용.
    """
    try:
        result = await evaluate_answer(
            question=request.question,
            answer=request.answer,
            current_level=request.current_level,
            target_level=request.target_level,
        )

        return {
            "success": True,
            "result": {
                "evaluated_level": result.evaluated_level,
                "scores": result.scores.model_dump(),
                "feedback": result.feedback.model_dump(),
                "overall_comment": result.overall_comment,
            }
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"평가 중 오류가 발생했습니다: {str(e)}"
        )
