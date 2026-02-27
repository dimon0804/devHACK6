from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import quiz, badge, guided, health, achievement, daily_challenge


app = FastAPI(
    title="Education Service",
    description="Educational quizzes and guided learning service",
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
app.include_router(quiz.router, prefix="/api/v1/quizzes", tags=["quizzes"])
app.include_router(badge.router, prefix="/api/v1/badges", tags=["badges"])
app.include_router(guided.router, prefix="/api/v1/guided", tags=["guided"])
app.include_router(achievement.router, prefix="/api/v1/achievements", tags=["achievements"])
app.include_router(daily_challenge.router, prefix="/api/v1/daily-challenges", tags=["daily-challenges"])


@app.get("/")
async def root():
    return {"service": "education-service", "version": "1.0.0"}
