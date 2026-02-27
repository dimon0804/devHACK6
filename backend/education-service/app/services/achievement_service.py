from sqlalchemy.orm import Session
from sqlalchemy import desc, text
from fastapi import HTTPException, status
from typing import List, Optional
from datetime import datetime
import json

from app.models.achievement import Achievement, UserAchievement


class AchievementService:
    @staticmethod
    def get_all_achievements(db: Session) -> List[Achievement]:
        return db.query(Achievement).order_by(Achievement.id).all()

    @staticmethod
    def get_user_achievements(db: Session, user_id: int) -> List[UserAchievement]:
        return db.query(UserAchievement).filter(
            UserAchievement.user_id == user_id
        ).order_by(desc(UserAchievement.unlocked_at)).all()

    @staticmethod
    def check_and_award_achievement(
        db: Session,
        user_id: int,
        achievement_type: str,
        condition_data: dict
    ) -> Optional[Achievement]:
        """Check if user should receive an achievement and award it"""
        
        # Find achievements by condition type using raw SQL
        result = db.execute(
            text("SELECT id, title, description, icon, condition FROM achievements WHERE condition->>'type' = :achievement_type"),
            {"achievement_type": achievement_type}
        )
        
        achievements = result.fetchall()
        
        for achievement_row in achievements:
            achievement_id, title, description, icon, condition_json = achievement_row
            condition = json.loads(condition_json) if isinstance(condition_json, str) else condition_json
            
            # Check if already earned
            existing = db.query(UserAchievement).filter(
                UserAchievement.user_id == user_id,
                UserAchievement.achievement_id == achievement_id
            ).first()

            if existing:
                continue

            # Check condition based on type
            should_award = False
            
            if condition.get('type') == 'first_budget':
                should_award = True
            elif condition.get('type') == 'savings_amount':
                target_amount = condition.get('amount', 0)
                current_amount = condition_data.get('current_amount', 0)
                if current_amount >= target_amount:
                    should_award = True
            elif condition.get('type') == 'planning_streak':
                required_days = condition.get('days', 5)
                current_streak = condition_data.get('streak', 0)
                if current_streak >= required_days:
                    should_award = True
            elif condition.get('type') == 'quizzes_completed':
                required_count = condition.get('count', 3)
                completed_count = condition_data.get('completed_count', 0)
                if completed_count >= required_count:
                    should_award = True
            
            if should_award:
                # Award achievement
                user_achievement = UserAchievement(
                    user_id=user_id,
                    achievement_id=achievement_id,
                    unlocked_at=datetime.utcnow()
                )
                db.add(user_achievement)
                db.commit()
                db.refresh(user_achievement)
                
                # Return achievement object
                achievement = db.query(Achievement).filter(Achievement.id == achievement_id).first()
                return achievement

        return None
