from pydantic import BaseModel, field_serializer
from datetime import datetime
from typing import List, Optional, Dict


class QuestionOption(BaseModel):
    text: str
    index: int


class QuestionCreate(BaseModel):
    question: str
    options: List[str]  # 4 options
    correct_answer: int  # index 0-3
    explanation: Optional[str] = None


class QuestionResponse(BaseModel):
    id: int
    quiz_id: int
    question: str
    options: List[str]
    explanation: Optional[str] = None

    class Config:
        from_attributes = True


class QuizCreate(BaseModel):
    title: str
    difficulty: str  # easy, medium, hard
    xp_reward: int
    description: Optional[str] = None
    questions: List[QuestionCreate]


class QuizResponse(BaseModel):
    id: int
    title: str
    difficulty: str
    xp_reward: int
    description: Optional[str]
    created_at: datetime
    questions: List[QuestionResponse]

    class Config:
        from_attributes = True


class QuizListItem(BaseModel):
    id: int
    title: str
    difficulty: str
    xp_reward: int
    description: Optional[str]

    class Config:
        from_attributes = True


class QuizAnswer(BaseModel):
    question_id: int
    answer: int  # selected option index


class QuizSubmission(BaseModel):
    quiz_id: int
    answers: List[QuizAnswer]


class QuizProgressResponse(BaseModel):
    id: int
    user_id: int
    quiz_id: int
    score: int
    completed: bool
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class QuizResultResponse(BaseModel):
    quiz_id: int
    score: int
    total_questions: int
    correct_answers: int
    xp_earned: int
    completed: bool
    feedback: str
