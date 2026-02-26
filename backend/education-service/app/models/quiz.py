from sqlalchemy import Column, Integer, String, ForeignKey, JSON, Boolean, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    difficulty = Column(String, nullable=False)  # easy, medium, hard
    xp_reward = Column(Integer, nullable=False, default=0)
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    questions = relationship("Question", back_populates="quiz", cascade="all, delete-orphan")
    progress = relationship("QuizProgress", back_populates="quiz", cascade="all, delete-orphan")


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", use_alter=True), nullable=False, index=True)
    question = Column(String, nullable=False)
    options = Column(JSON, nullable=False)  # ["option1", "option2", "option3", "option4"]
    correct_answer = Column(Integer, nullable=False)  # index in options array (0-3)
    explanation = Column(String, nullable=True)  # explanation of correct answer
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    quiz = relationship("Quiz", back_populates="questions")


class QuizProgress(Base):
    __tablename__ = "quiz_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)  # FK handled at DB level
    quiz_id = Column(Integer, ForeignKey("quizzes.id", use_alter=True), nullable=False, index=True)
    score = Column(Integer, nullable=False, default=0)  # percentage 0-100
    completed = Column(Boolean, nullable=False, default=False)
    answers = Column(JSON, nullable=True)  # {"question_id": selected_answer_index}
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    quiz = relationship("Quiz", back_populates="progress")
