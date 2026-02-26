import httpx
from app.core.config import settings


async def verify_token(token: str) -> dict:
    """Verify JWT token with auth-service"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{settings.USER_SERVICE_URL}/api/v1/users/me",
                headers={"Authorization": f"Bearer {token}"},
                timeout=5.0
            )
            if response.status_code == 200:
                return response.json()
            raise ValueError("Invalid token")
        except httpx.RequestError:
            raise ValueError("Auth service unavailable")
