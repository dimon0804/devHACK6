import logging
from typing import Optional

from app.models import TelegramNotification
from app.services.database import AsyncSessionLocal

logger = logging.getLogger(__name__)


async def log_notification(user_id: int, notification_type: str, message: str) -> None:
    """
    Простая функция логирования отправленных уведомлений в БД.
    Фактическая отправка сообщений происходит в обработчиках бота.
    """
    async with AsyncSessionLocal() as session:
        record = TelegramNotification(
            user_id=user_id,
            notification_type=notification_type,
            message=message,
        )
        session.add(record)
        await session.commit()

    logger.info("Logged notification: user_id=%s type=%s", user_id, notification_type)


async def mark_notification_read(notification_id: int) -> None:
    """
    Пометка уведомления как прочитанного.
    Сейчас не используется, но оставлено для будущего расширения.
    """
    async with AsyncSessionLocal() as session:
        db_obj: Optional[TelegramNotification] = await session.get(TelegramNotification, notification_id)
        if not db_obj:
            return
        db_obj.read_at = db_obj.sent_at  # условно считаем прочитанным сразу
        await session.commit()


