import httpx
from fastapi import HTTPException, status
from app.core.config import settings


async def verify_token(token: str) -> dict:
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{settings.USER_SERVICE_URL}/api/v1/users/me",
                headers={"Authorization": f"Bearer {token}"},
                timeout=5.0
            )
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token"
                )
        except httpx.RequestError:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="User service unavailable"
            )
