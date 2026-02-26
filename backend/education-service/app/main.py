from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import quiz, badge, guided, health


app = FastAPI(
    title="Education Service",
    description="Educational quizzes and guided learning service",
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
app.include_router(quiz.router, prefix="/api/v1/quizzes", tags=["quizzes"])
app.include_router(badge.router, prefix="/api/v1/badges", tags=["badges"])
app.include_router(guided.router, prefix="/api/v1/guided", tags=["guided"])


@app.get("/")
async def root():
    return {"service": "education-service", "version": "1.0.0"}
