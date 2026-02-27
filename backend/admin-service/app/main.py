from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import analytics, health

app = FastAPI(
    title="Admin Service",
    description="Admin panel and analytics service",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(analytics.router, prefix="/api/v1/admin", tags=["admin"])


@app.get("/")
async def root():
    return {"service": "admin-service", "version": "1.0.0"}
