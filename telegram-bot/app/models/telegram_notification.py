import sqlalchemy as sa
from sqlalchemy.sql import func

from app.services.database import Base


class TelegramNotification(Base):
    """
    Лог отправленных Telegram-уведомлений пользователю.
    Используется для аналитики и возможного повторного отправления.
    """

    __tablename__ = "telegram_notifications"

    id = sa.Column(sa.Integer, primary_key=True, index=True)
    # Простой integer-идентификатор пользователя без внешнего ключа.
    user_id = sa.Column(sa.Integer, nullable=False)
    notification_type = sa.Column(sa.String(50), nullable=False)
    message = sa.Column(sa.Text, nullable=False)
    sent_at = sa.Column(sa.DateTime(timezone=True), server_default=func.now())
    read_at = sa.Column(sa.DateTime(timezone=True), nullable=True)


