from fastapi import APIRouter, Request, HTTPException, status
from fastapi.responses import Response
import httpx
from app.core.config import settings

router = APIRouter()

SERVICE_ROUTES = {
    "auth": settings.AUTH_SERVICE_URL,
    "users": settings.USER_SERVICE_URL,
    "budget": settings.GAME_SERVICE_URL,
    "savings": settings.GAME_SERVICE_URL,
    "categories": settings.GAME_SERVICE_URL,
    "transactions": settings.PROGRESS_SERVICE_URL,
    "quests": settings.PROGRESS_SERVICE_URL,
    "quizzes": settings.EDUCATION_SERVICE_URL,
    "badges": settings.EDUCATION_SERVICE_URL,
    "guided": settings.EDUCATION_SERVICE_URL,
    "achievements": settings.EDUCATION_SERVICE_URL,
    "daily-challenges": settings.EDUCATION_SERVICE_URL,
    "admin": settings.ADMIN_SERVICE_URL,
    "analytics": settings.ANALYTICS_SERVICE_URL,
}


async def _proxy_request(service: str, path: str, request: Request):
    if service not in SERVICE_ROUTES:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service '{service}' not found"
        )

    base_url = SERVICE_ROUTES[service]
    # Special handling for transactions and quests - they're already under /api/v1/transactions
    if service in ["transactions", "quests"]:
        if path:
            url = f"{base_url}/api/v1/{service}/{path}"
        else:
            url = f"{base_url}/api/v1/{service}"
    elif service in ["quizzes", "badges", "guided", "achievements", "daily-challenges"]:
        # Education service endpoints are already under /api/v1/
        if path:
            url = f"{base_url}/api/v1/{service}/{path}"
        else:
            url = f"{base_url}/api/v1/{service}"
    elif service == "admin":
        # Admin service endpoints are under /api/v1/admin/
        if path:
            url = f"{base_url}/api/v1/admin/{path}"
        else:
            url = f"{base_url}/api/v1/admin"
    elif service == "analytics":
        # Analytics service endpoints are under /api/v1/analytics/
        if path:
            url = f"{base_url}/api/v1/analytics/{path}"
        else:
            url = f"{base_url}/api/v1/analytics"
    else:
        # For categories, budget, savings - they're already under /api/v1 in game-service
        if path:
            url = f"{base_url}/api/v1/{service}/{path}"
        else:
            url = f"{base_url}/api/v1/{service}"

    headers = dict(request.headers)
    headers.pop("host", None)
    headers.pop("content-length", None)

    body = await request.body()

    try:
        async with httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT, follow_redirects=False) as client:
            response = await client.request(
                method=request.method,
                url=url,
                headers=headers,
                content=body,
                params=request.query_params
            )

            return Response(
                content=response.content,
                status_code=response.status_code,
                headers=dict(response.headers)
            )
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Service request timeout"
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Service unavailable: {str(e)}"
        )


@router.api_route(
    "/{service}",
    methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    include_in_schema=True
)
async def proxy_request_no_path(service: str, request: Request):
    return await _proxy_request(service, "", request)


@router.api_route(
    "/{service}/{path:path}",
    methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    include_in_schema=True
)
async def proxy_request(service: str, path: str, request: Request):
    return await _proxy_request(service, path, request)
