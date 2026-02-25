from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import user, health


app = FastAPI(
    title="User Service",
    description="User management service",
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
app.include_router(user.router, prefix="/api/v1/users", tags=["users"])


@app.get("/")
async def root():
    return {"service": "user-service", "version": "1.0.0"}
