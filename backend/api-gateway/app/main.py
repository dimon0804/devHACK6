from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import httpx

from app.core.config import settings
from app.routers import proxy, health

app = FastAPI(
    title="API Gateway",
    description="API Gateway for FinTech Education Platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(proxy.router, prefix="/api/v1", tags=["api"])


@app.get("/")
async def root():
    return {
        "service": "api-gateway",
        "version": "1.0.0",
        "endpoints": {
            "auth": "/api/v1/auth",
            "users": "/api/v1/users",
            "budget": "/api/v1/budget",
            "savings": "/api/v1/savings",
            "categories": "/api/v1/categories",
            "transactions": "/api/v1/transactions",
            "quests": "/api/v1/quests",
            "quizzes": "/api/v1/quizzes",
            "badges": "/api/v1/badges",
            "guided": "/api/v1/guided",
            "achievements": "/api/v1/achievements",
            "daily-challenges": "/api/v1/daily-challenges",
            "admin": "/api/v1/admin",
            "analytics": "/api/v1/analytics"
        }
    }


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"}
    )
