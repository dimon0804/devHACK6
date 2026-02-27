import os
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base


DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://fintech_user:fintech_pass@postgres:5432/fintech_db",
)


def _make_async_url(sync_url: str) -> str:
    if sync_url.startswith("postgresql://"):
        return sync_url.replace("postgresql://", "postgresql+asyncpg://")
    return sync_url


ASYNC_DATABASE_URL = _make_async_url(DATABASE_URL)

engine = create_async_engine(ASYNC_DATABASE_URL, echo=False, future=True)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

Base = declarative_base()


async def init_db() -> None:
    """
    Инициализация БД: создание таблиц, если их ещё нет.
    Используется только для наших telegram_* таблиц, основная схема уже создана другими сервисами.
    """
    # Ленивая импортируем модели, чтобы избежать циклических зависимостей
    from app.models import telegram_session, telegram_notification  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


