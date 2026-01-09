"""
AI 기반 문제 생성 API.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.agents.question_generation_agent import generate_question
from app.middleware.auth import verify_token, TokenData

router = APIRouter()


class GenerateQuestionRequest(BaseModel):
    """문제 생성 요청"""

    topic: str = "일상"
    question_type: str = "experience"
    current_level: str = "IM2"
    target_level: str = "IH"


@router.post("/generate-question")
async def generate_question_endpoint(
    request: GenerateQuestionRequest, token_data: TokenData = Depends(verify_token)
) -> dict:
    """
    AI 기반 OPIc 문제 생성 엔드포인트.

    Args:
        request: 문제 생성 요청 (topic, question_type, current_level, target_level)

    Returns:
        dict: 생성된 문제 정보
    """
    try:
        result = await generate_question(
            topic=request.topic,
            question_type=request.question_type,
            current_level=request.current_level,
            target_level=request.target_level,
        )

        return {
            "success": True,
            "question": {
                "topic": result.topic,
                "question_type": result.question_type,
                "question_text": result.question_text,
                "expected_answer_structure": result.expected_answer_structure,
                "key_vocabulary": result.key_vocabulary,
                "difficulty_level": result.difficulty_level,
            },
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"문제 생성 중 오류가 발생했습니다: {str(e)}"
        )
