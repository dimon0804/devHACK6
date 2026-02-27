from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Date, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class DailyChallenge(Base):
    __tablename__ = "daily_challenges"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    challenge_date = Column(Date, nullable=False, unique=True, index=True)
    xp_reward = Column(Integer, default=20, nullable=False)
    condition = Column(String(100), nullable=False)  # Тип задачи: "save_percentage", "create_category", etc.
    condition_value = Column(String(255), nullable=True)  # Значение условия (например, "15" для процента)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class UserDailyChallenge(Base):
    __tablename__ = "user_daily_challenges"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    challenge_id = Column(Integer, ForeignKey("daily_challenges.id", ondelete="CASCADE"), nullable=False)
    completed = Column(Boolean, default=False, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    challenge = relationship("DailyChallenge", backref="user_challenges")
