from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Badge(Base):
    __tablename__ = "badges"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    icon = Column(String, nullable=True)  # icon name or emoji
    condition = Column(JSON, nullable=True)  # {"type": "quiz_completed", "quiz_id": 1}
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user_badges = relationship("UserBadge", back_populates="badge", cascade="all, delete-orphan")


class UserBadge(Base):
    __tablename__ = "user_badges"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)  # FK handled at DB level
    badge_id = Column(Integer, ForeignKey("badges.id", use_alter=True), nullable=False, index=True)
    earned_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    badge = relationship("Badge", back_populates="user_badges")
