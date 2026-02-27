import sqlalchemy as sa
from sqlalchemy.sql import func

from app.services.database import Base


class TelegramSession(Base):
    """
    Сессия пользователя Telegram, привязанная к пользователю платформы.

    Хранит access/refresh токены для работы с API Gateway от имени пользователя.
    """

    __tablename__ = "telegram_sessions"

    id = sa.Column(sa.Integer, primary_key=True, index=True)
    # Храним ссылку на пользователя по id без внешнего ключа,
    # чтобы не тянуть схему user-service в метадату.
    user_id = sa.Column(sa.Integer, nullable=True)
    telegram_user_id = sa.Column(sa.BigInteger, unique=True, nullable=False, index=True)
    access_token = sa.Column(sa.Text, nullable=True)
    refresh_token = sa.Column(sa.Text, nullable=True)
    created_at = sa.Column(sa.DateTime(timezone=True), server_default=func.now())
    last_activity = sa.Column(
        sa.DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )


