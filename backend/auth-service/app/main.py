from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import engine, Base
from app.routers import auth, health


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Auth Service",
    description="Authentication and authorization service",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])


@app.get("/")
async def root():
    return {"service": "auth-service", "version": "1.0.0"}
