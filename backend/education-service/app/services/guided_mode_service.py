from sqlalchemy.orm import Session
from typing import Dict, List, Optional
from fastapi import HTTPException, status

from app.models.quiz import QuizProgress


class GuidedModeService:
    """Service for guided step-by-step learning mode"""
    
    STEPS = [
        {
            "id": 1,
            "title": "Создай свой первый бюджет",
            "description": "Узнай, как правильно распределять доходы по категориям",
            "action": "create_budget",
            "required": True,
            "unlocks": [2]
        },
        {
            "id": 2,
            "title": "Отложи 20% на накопления",
            "description": "Научись откладывать часть дохода на будущее",
            "action": "save_20_percent",
            "required": True,
            "unlocks": [3]
        },
        {
            "id": 3,
            "title": "Создай цель накопления",
            "description": "Поставь финансовую цель и начни к ней идти",
            "action": "create_goal",
            "required": True,
            "unlocks": [4]
        },
        {
            "id": 4,
            "title": "Достигни своей цели",
            "description": "Пополняй цель и достигни её, чтобы получить награду",
            "action": "complete_goal",
            "required": True,
            "unlocks": [5]
        },
        {
            "id": 5,
            "title": "Пройди квиз 'Что такое бюджет?'",
            "description": "Закрепи знания о бюджете, пройдя обучающий квиз",
            "action": "complete_quiz",
            "quiz_id": 1,
            "required": False,
            "unlocks": []
        }
    ]

    @staticmethod
    def get_guided_steps() -> List[Dict]:
        return GuidedModeService.STEPS

    @staticmethod
    def get_step_by_id(step_id: int) -> Optional[Dict]:
        for step in GuidedModeService.STEPS:
            if step["id"] == step_id:
                return step
        return None

    @staticmethod
    def check_step_completion(
        db: Session,
        user_id: int,
        step_id: int,
        action_data: Dict
    ) -> bool:
        """Check if a guided step is completed"""
        step = GuidedModeService.get_step_by_id(step_id)
        if not step:
            return False

        action = step.get("action")

        if action == "create_budget":
            # Check if user has any budget transactions
            from sqlalchemy import text
            result = db.execute(
                text("SELECT COUNT(*) FROM transactions WHERE user_id = :user_id AND type = 'income'"),
                {"user_id": user_id}
            )
            count = result.scalar()
            return count > 0

        elif action == "save_20_percent":
            # Check if user has savings deposits
            result = db.execute(
                text("SELECT COUNT(*) FROM transactions WHERE user_id = :user_id AND type = 'savings_deposit'"),
                {"user_id": user_id}
            )
            count = result.scalar()
            return count > 0

        elif action == "create_goal":
            # Check if user has goals
            result = db.execute(
                text("SELECT COUNT(*) FROM goals WHERE user_id = :user_id"),
                {"user_id": user_id}
            )
            count = result.scalar()
            return count > 0

        elif action == "complete_goal":
            # Check if user has completed goals
            result = db.execute(
                text("SELECT COUNT(*) FROM goals WHERE user_id = :user_id AND completed = true"),
                {"user_id": user_id}
            )
            count = result.scalar()
            return count > 0

        elif action == "complete_quiz":
            quiz_id = step.get("quiz_id")
            if quiz_id:
                progress = db.query(QuizProgress).filter(
                    QuizProgress.user_id == user_id,
                    QuizProgress.quiz_id == quiz_id,
                    QuizProgress.completed == True
                ).first()
                return progress is not None

        return False
