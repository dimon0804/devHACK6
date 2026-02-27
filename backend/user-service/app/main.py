from contextlib import asynccontextmanager
from contextvars import ContextVar
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import logging
import uuid

from app.core.config import settings
from app.routers import user, health
from app.services.event_listener import event_listener

# Configure structured logging
correlation_id_ctx: ContextVar[str] = ContextVar("correlation_id", default="-")


class CorrelationIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.correlation_id = correlation_id_ctx.get()
        return True


logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - [%(correlation_id)s] - %(message)s'
)
for handler in logging.getLogger().handlers:
    handler.addFilter(CorrelationIdFilter())
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting user-service")
    try:
        # Start event listener in background
        import asyncio
        asyncio.create_task(event_listener.start())
        logger.info("Event listener started")
    except Exception as e:
        logger.error(f"Failed to start event listener: {e}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down user-service")
    await event_listener.stop()


app = FastAPI(
    title="User Service",
    description="User management service",
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


# Middleware for correlation ID
@app.middleware("http")
async def add_correlation_id(request: Request, call_next):
    correlation_id = request.headers.get("X-Correlation-ID") or str(uuid.uuid4())
    request.state.correlation_id = correlation_id

    token = correlation_id_ctx.set(correlation_id)
    try:
        response = await call_next(request)
        response.headers["X-Correlation-ID"] = correlation_id
        return response
    finally:
        correlation_id_ctx.reset(token)


app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(user.router, prefix="/api/v1/users", tags=["users"])


@app.get("/")
async def root():
    return {"service": "user-service", "version": "1.0.0"}
