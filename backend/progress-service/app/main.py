from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import transaction, quest, health


app = FastAPI(
    title="Progress Service",
    description="Progress tracking and transactions service",
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
app.include_router(transaction.router, prefix="/api/v1/transactions", tags=["transactions"])
app.include_router(quest.router, prefix="/api/v1/quests", tags=["quests"])


@app.get("/")
async def root():
    return {"service": "progress-service", "version": "1.0.0"}
