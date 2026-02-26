from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import traceback

from app.core.config import settings
from app.routers import budget, savings, health, category

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


app = FastAPI(
    title="Game Service",
    description="Game scenarios and logic service",
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
app.include_router(budget.router, prefix="/api/v1/budget", tags=["budget"])
app.include_router(savings.router, prefix="/api/v1/savings", tags=["savings"])
app.include_router(category.router, prefix="/api/v1", tags=["categories"])


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    logger.error(f"Traceback: {traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"}
    )


@app.get("/")
async def root():
    return {"service": "game-service", "version": "1.0.0"}
