from fastapi import APIRouter, Depends, HTTPException, status, Header, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from app.core.database import get_db
from app.core.auth import verify_token
from app.services.quiz_service import QuizService
from app.services.badge_service import BadgeService
from app.schemas.quiz import (
    QuizResponse,
    QuizListItem,
    QuizSubmission,
    QuizResultResponse,
    QuizProgressResponse
)

router = APIRouter()


async def get_current_user_id(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> tuple[int, str]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header"
        )
    token = authorization.split(" ")[1]
    user_data = await verify_token(token)
    return user_data["id"], token


@router.get("", response_model=List[QuizListItem])
async def get_quizzes(
    db: Session = Depends(get_db)
):
    """Get list of all available quizzes"""
    quizzes = QuizService.get_all_quizzes(db)
    return quizzes


@router.get("/{quiz_id}", response_model=QuizResponse)
async def get_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    user_and_token: tuple[int, str] = Depends(get_current_user_id)
):
    """Get quiz details with questions (without correct answers)"""
    user_id, token = user_and_token
    quiz = QuizService.get_quiz_by_id(db, quiz_id, include_answers=False)
    
    # Remove correct_answer from questions
    for question in quiz.questions:
        question.correct_answer = None
    
    return quiz


@router.post("/{quiz_id}/submit", response_model=QuizResultResponse)
async def submit_quiz(
    quiz_id: int,
    submission: QuizSubmission,
    user_and_token: tuple[int, str] = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Submit quiz answers and get results"""
    user_id, token = user_and_token
    
    if submission.quiz_id != quiz_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quiz ID mismatch"
        )
    
    result = await QuizService.submit_quiz(db, user_id, quiz_id, submission, token)
    
    # Check for badge
    if result["completed"]:
        badge = BadgeService.check_and_award_badge(
            db, user_id, "quiz_completed", {"quiz_id": quiz_id}, token
        )
        if badge:
            result["badge_earned"] = badge.name
    
    return result


@router.get("/progress", response_model=List[QuizProgressResponse])
async def get_user_progress(
    user_and_token: tuple[int, str] = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get user's quiz progress"""
    user_id, token = user_and_token
    progress = QuizService.get_user_progress_list(db, user_id)
    return progress
