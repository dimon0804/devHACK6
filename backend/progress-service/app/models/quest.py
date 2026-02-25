from sqlalchemy import Column, Integer, String, Boolean, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Quest(Base):
    __tablename__ = "quests"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    difficulty = Column(String, nullable=False)
    reward_xp = Column(Integer, nullable=False, default=0)


class QuestProgress(Base):
    __tablename__ = "quest_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    quest_id = Column(Integer, ForeignKey("quests.id"), nullable=False, index=True)
    completed = Column(Boolean, default=False, nullable=False)
    score = Column(Integer, default=0, nullable=False)
