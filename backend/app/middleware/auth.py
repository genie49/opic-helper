"""
Supabase JWT 인증 미들웨어.
모든 API 요청에서 JWT 토큰을 검증.
"""

from fastapi import Header, HTTPException
from pydantic import BaseModel
from supabase import create_client, Client

from app.core.config import settings


class TokenData(BaseModel):
    """토큰에서 추출한 사용자 정보"""
    user_id: str
    email: str | None = None


# Supabase 클라이언트 (싱글톤)
_supabase_client: Client | None = None


def get_supabase_client() -> Client:
    """Supabase 클라이언트 반환"""
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY
        )
    return _supabase_client


async def verify_token(authorization: str = Header(None)) -> TokenData:
    """
    JWT 토큰 검증.

    Args:
        authorization: Authorization 헤더 (Bearer <token>)

    Returns:
        TokenData: 검증된 사용자 정보

    Raises:
        HTTPException: 인증 실패 시 401 에러
    """
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="인증 토큰이 필요합니다. 로그인 후 이용하세요."
        )

    # Bearer 토큰 추출
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="잘못된 인증 형식입니다. Bearer 토큰을 사용하세요."
        )

    token = authorization.replace("Bearer ", "")

    try:
        # Supabase Auth API로 토큰 검증
        supabase = get_supabase_client()
        user_response = supabase.auth.get_user(token)

        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=401,
                detail="유효하지 않은 토큰입니다."
            )

        user = user_response.user

        return TokenData(
            user_id=user.id,
            email=user.email
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=f"인증 실패: {str(e)}"
        )


async def verify_token_optional(
    authorization: str = Header(None)
) -> TokenData | None:
    """
    선택적 JWT 토큰 검증.
    토큰이 없어도 에러를 발생시키지 않음.
    """
    if not authorization:
        return None

    try:
        return await verify_token(authorization)
    except HTTPException:
        return None
