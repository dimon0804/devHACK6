from fastapi import APIRouter
import httpx
from app.core.config import settings

router = APIRouter()


@router.get("/")
async def health_check():
    services_status = {}
    services = {
        "auth": settings.AUTH_SERVICE_URL,
        "user": settings.USER_SERVICE_URL,
        "game": settings.GAME_SERVICE_URL,
        "progress": settings.PROGRESS_SERVICE_URL,
    }

    async with httpx.AsyncClient(timeout=5.0) as client:
        for name, url in services.items():
            try:
                response = await client.get(f"{url}/health/")
                services_status[name] = "healthy" if response.status_code == 200 else "unhealthy"
            except Exception:
                services_status[name] = "unavailable"

    all_healthy = all(status == "healthy" for status in services_status.values())

    return {
        "status": "healthy" if all_healthy else "degraded",
        "service": "api-gateway",
        "services": services_status
    }
