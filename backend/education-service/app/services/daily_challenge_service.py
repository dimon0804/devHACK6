from sqlalchemy.orm import Session
from sqlalchemy import and_
from fastapi import HTTPException, status
from typing import Optional
from datetime import datetime, date, timedelta
import httpx

from app.models.daily_challenge import DailyChallenge, UserDailyChallenge
from app.core.config import settings


class DailyChallengeService:
    @staticmethod
    def get_or_create_today_challenge(db: Session) -> DailyChallenge:
        """Get or create today's daily challenge"""
        today = date.today()
        
        challenge = db.query(DailyChallenge).filter(
            DailyChallenge.challenge_date == today
        ).first()
        
        if not challenge:
            # Create a new challenge for today
            # Rotate between different challenge types
            challenge_types = [
                {
                    "title": "Отложи процент от дохода",
                    "description": "Сегодня отложи {value}% от своего дохода",
                    "condition": "save_percentage",
                    "condition_value": "15"
                },
                {
                    "title": "Создай новую категорию",
                    "description": "Создай новую категорию для планирования бюджета",
                    "condition": "create_category",
                    "condition_value": None
                },
                {
                    "title": "Пополни цель",
                    "description": "Пополни любую цель накопления",
                    "condition": "deposit_to_goal",
                    "condition_value": None
                },
                {
                    "title": "Спланируй бюджет",
                    "description": "Создай новый план бюджета",
                    "condition": "create_budget",
                    "condition_value": None
                },
                {
                    "title": "Пройди квиз",
                    "description": "Пройди любой обучающий квиз",
                    "condition": "complete_quiz",
                    "condition_value": None
                }
            ]
            
            # Use day of year to rotate challenges
            day_of_year = today.timetuple().tm_yday
            challenge_type = challenge_types[day_of_year % len(challenge_types)]
            
            challenge = DailyChallenge(
                title=challenge_type["title"],
                description=challenge_type["description"].format(
                    value=challenge_type.get("condition_value", "15")
                ),
                challenge_date=today,
                xp_reward=20,
                condition=challenge_type["condition"],
                condition_value=challenge_type.get("condition_value")
            )
            db.add(challenge)
            db.commit()
            db.refresh(challenge)
        
        return challenge

    @staticmethod
    def get_user_today_challenge(db: Session, user_id: int) -> Optional[UserDailyChallenge]:
        """Get user's progress on today's challenge"""
        today = date.today()
        
        challenge = DailyChallengeService.get_or_create_today_challenge(db)
        
        user_challenge = db.query(UserDailyChallenge).filter(
            and_(
                UserDailyChallenge.user_id == user_id,
                UserDailyChallenge.challenge_id == challenge.id
            )
        ).first()
        
        if not user_challenge:
            # Create user challenge entry
            user_challenge = UserDailyChallenge(
                user_id=user_id,
                challenge_id=challenge.id,
                completed=False
            )
            db.add(user_challenge)
            db.commit()
            db.refresh(user_challenge)
        
        return user_challenge

    @staticmethod
    async def check_and_complete_challenge(
        db: Session,
        user_id: int,
        challenge_type: str,
        condition_data: dict,
        token: str
    ) -> Optional[DailyChallenge]:
        """Check if user completed today's challenge and award XP"""
        today = date.today()
        
        challenge = db.query(DailyChallenge).filter(
            DailyChallenge.challenge_date == today,
            DailyChallenge.condition == challenge_type
        ).first()
        
        if not challenge:
            return None
        
        user_challenge = db.query(UserDailyChallenge).filter(
            and_(
                UserDailyChallenge.user_id == user_id,
                UserDailyChallenge.challenge_id == challenge.id
            )
        ).first()
        
        if not user_challenge:
            user_challenge = UserDailyChallenge(
                user_id=user_id,
                challenge_id=challenge.id,
                completed=False
            )
            db.add(user_challenge)
        
        if user_challenge.completed:
            return None  # Already completed
        
        # Check if condition is met
        should_complete = False
        
        if challenge.condition == "save_percentage":
            # Check if user saved the required percentage
            saved_percentage = condition_data.get('saved_percentage', 0)
            required_percentage = float(challenge.condition_value or 15)
            if saved_percentage >= required_percentage:
                should_complete = True
        elif challenge.condition == "create_category":
            should_complete = True  # If this function is called, category was created
        elif challenge.condition == "deposit_to_goal":
            should_complete = True  # If this function is called, deposit was made
        elif challenge.condition == "create_budget":
            should_complete = True  # If this function is called, budget was created
        elif challenge.condition == "complete_quiz":
            should_complete = True  # If this function is called, quiz was completed
        
        if should_complete:
            user_challenge.completed = True
            user_challenge.completed_at = datetime.utcnow()
            db.commit()
            db.refresh(user_challenge)
            
            # Award XP
            try:
                async with httpx.AsyncClient() as client:
                    await client.post(
                        f"{settings.USER_SERVICE_URL}/api/v1/users/xp",
                        headers={"Authorization": f"Bearer {token}"},
                        json={"xp": challenge.xp_reward},
                        timeout=5.0
                    )
            except Exception:
                pass  # Don't fail if XP award fails
            
            return challenge
        
        return None
