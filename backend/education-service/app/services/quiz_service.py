from sqlalchemy.orm import Session
from sqlalchemy import desc
from fastapi import HTTPException, status
import httpx
from decimal import Decimal
from typing import List, Dict

from app.models.quiz import Quiz, Question, QuizProgress
from app.schemas.quiz import QuizSubmission, QuizAnswer
from app.core.config import settings


class QuizService:
    @staticmethod
    def get_all_quizzes(db: Session) -> List[Quiz]:
        return db.query(Quiz).order_by(Quiz.id).all()

    @staticmethod
    def get_quiz_by_id(db: Session, quiz_id: int, include_answers: bool = False) -> Quiz:
        quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
        if not quiz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quiz not found"
            )
        return quiz

    @staticmethod
    def get_user_progress(db: Session, user_id: int, quiz_id: int) -> QuizProgress:
        progress = db.query(QuizProgress).filter(
            QuizProgress.user_id == user_id,
            QuizProgress.quiz_id == quiz_id
        ).first()
        return progress

    @staticmethod
    async def submit_quiz(
        db: Session,
        user_id: int,
        quiz_id: int,
        submission: QuizSubmission,
        token: str
    ) -> Dict:
        quiz = QuizService.get_quiz_by_id(db, quiz_id)
        
        # Check if already completed
        existing_progress = QuizService.get_user_progress(db, user_id, quiz_id)
        if existing_progress and existing_progress.completed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Quiz already completed"
            )

        # Calculate score
        questions = {q.id: q for q in quiz.questions}
        correct_count = 0
        total_questions = len(questions)
        
        answers_dict = {}
        for answer in submission.answers:
            question = questions.get(answer.question_id)
            if not question:
                continue
            
            answers_dict[answer.question_id] = answer.answer
            if answer.answer == question.correct_answer:
                correct_count += 1

        score = int((correct_count / total_questions) * 100) if total_questions > 0 else 0
        completed = score >= 70  # 70% to pass

        # Save progress
        if existing_progress:
            existing_progress.score = score
            existing_progress.completed = completed
            existing_progress.answers = answers_dict
            if completed:
                from datetime import datetime
                existing_progress.completed_at = datetime.utcnow()
        else:
            from datetime import datetime
            progress = QuizProgress(
                user_id=user_id,
                quiz_id=quiz_id,
                score=score,
                completed=completed,
                answers=answers_dict,
                completed_at=datetime.utcnow() if completed else None
            )
            db.add(progress)

        db.commit()

        # Send analytics event
        try:
            async with httpx.AsyncClient() as client:
                # Track quiz completion/error
                wrong_answers = []
                for answer in submission.answers:
                    question = questions.get(answer.question_id)
                    if question and answer.answer != question.correct_answer:
                        wrong_answers.append({
                            "quiz_id": quiz_id,
                            "question_id": answer.question_id
                        })
                
                if wrong_answers:
                    # Track errors
                    for error in wrong_answers:
                        await client.post(
                            f"{settings.ANALYTICS_SERVICE_URL}/api/v1/analytics/events",
                            json={
                                "event_type": "quiz_error",
                                "event_category": "quiz",
                                "metadata": error
                            },
                            timeout=2.0
                        )
                
                # Track completion
                await client.post(
                    f"{settings.ANALYTICS_SERVICE_URL}/api/v1/analytics/events",
                    json={
                        "event_type": "quiz_completed" if completed else "quiz_attempted",
                        "event_category": "quiz",
                        "metadata": {
                            "quiz_id": quiz_id,
                            "score": score,
                            "completed": completed
                        }
                    },
                    timeout=2.0
                )
        except Exception:
            pass  # Don't fail if analytics fails

        # Award XP if completed
        xp_earned = 0
        if completed:
            xp_earned = quiz.xp_reward
            try:
                async with httpx.AsyncClient() as client:
                    await client.post(
                        f"{settings.USER_SERVICE_URL}/api/v1/users/xp",
                        headers={"Authorization": f"Bearer {token}"},
                        json={"xp": xp_earned},
                        timeout=5.0
                    )
                    
                    # Check for achievements
                    try:
                        # Get count of completed quizzes
                        completed_quizzes = db.query(QuizProgress).filter(
                            QuizProgress.user_id == user_id,
                            QuizProgress.completed == True
                        ).count()
                        
                        await client.post(
                            f"{settings.EDUCATION_SERVICE_URL}/api/v1/achievements/check",
                            headers={"Authorization": f"Bearer {token}"},
                            json={
                                "achievement_type": "quizzes_completed",
                                "condition": {"completed_count": completed_quizzes}
                            },
                            timeout=5.0
                        )
                        
                        # Check daily challenge
                        await client.post(
                            f"{settings.EDUCATION_SERVICE_URL}/api/v1/daily-challenges/check",
                            headers={"Authorization": f"Bearer {token}"},
                            json={
                                "challenge_type": "complete_quiz",
                                "condition_data": {}
                            },
                            timeout=5.0
                        )
                    except Exception:
                        pass  # Don't fail if achievement check fails
            except httpx.RequestError:
                pass  # Log but don't fail

        # Generate feedback
        if completed:
            feedback = f"Отлично! Вы прошли квиз с результатом {score}% и заработали {xp_earned} XP!"
        elif score >= 50:
            feedback = f"Хорошая попытка! Вы набрали {score}%. Попробуйте еще раз, чтобы заработать XP."
        else:
            feedback = f"Вы набрали {score}%. Изучите материал еще раз и попробуйте снова!"

        return {
            "quiz_id": quiz_id,
            "score": score,
            "total_questions": total_questions,
            "correct_answers": correct_count,
            "xp_earned": xp_earned,
            "completed": completed,
            "feedback": feedback
        }

    @staticmethod
    def get_user_progress_list(db: Session, user_id: int) -> List[QuizProgress]:
        return db.query(QuizProgress).filter(
            QuizProgress.user_id == user_id
        ).order_by(desc(QuizProgress.completed_at)).all()
