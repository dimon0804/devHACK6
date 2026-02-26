from sqlalchemy.orm import Session
from sqlalchemy import desc
from fastapi import HTTPException, status
import httpx
from typing import List, Optional

from app.models.badge import Badge, UserBadge
from app.core.config import settings


class BadgeService:
    @staticmethod
    def get_all_badges(db: Session) -> List[Badge]:
        return db.query(Badge).order_by(Badge.id).all()

    @staticmethod
    def get_user_badges(db: Session, user_id: int) -> List[UserBadge]:
        return db.query(UserBadge).filter(
            UserBadge.user_id == user_id
        ).order_by(desc(UserBadge.earned_at)).all()

    @staticmethod
    def check_and_award_badge(
        db: Session,
        user_id: int,
        badge_type: str,
        condition_data: dict,
        token: str = None
    ) -> Optional[Badge]:
        """Check if user should receive a badge and award it"""
        from sqlalchemy import text
        import json
        
        # Find badges by condition type using raw SQL
        result = db.execute(
            text("SELECT id, name, title, description, icon, condition FROM badges WHERE condition->>'type' = :badge_type"),
            {"badge_type": badge_type}
        )
        
        badges = result.fetchall()
        
        for badge_row in badges:
            badge_id, name, title, description, icon, condition_json = badge_row
            condition = json.loads(condition_json) if isinstance(condition_json, str) else condition_json
            
            # Check if already earned
            existing = db.query(UserBadge).filter(
                UserBadge.user_id == user_id,
                UserBadge.badge_id == badge_id
            ).first()

            if existing:
                continue

            # Check condition
            if condition.get('type') == 'quiz_completed':
                if condition_data.get('quiz_id') == condition.get('quiz_id'):
                    # Award badge
                    from datetime import datetime
                    user_badge = UserBadge(
                        user_id=user_id,
                        badge_id=badge_id,
                        earned_at=datetime.utcnow()
                    )
                    db.add(user_badge)
                    db.commit()
                    db.refresh(user_badge)
                    
                    # Return badge object
                    badge = db.query(Badge).filter(Badge.id == badge_id).first()
                    return badge
            
            elif condition.get('type') == 'goal_completed':
                # Award badge for completing any goal
                from datetime import datetime
                user_badge = UserBadge(
                    user_id=user_id,
                    badge_id=badge_id,
                    earned_at=datetime.utcnow()
                )
                db.add(user_badge)
                db.commit()
                db.refresh(user_badge)
                
                # Return badge object
                badge = db.query(Badge).filter(Badge.id == badge_id).first()
                return badge
            
            elif condition.get('type') == 'budget_created':
                # Award badge for creating first budget
                from datetime import datetime
                user_badge = UserBadge(
                    user_id=user_id,
                    badge_id=badge_id,
                    earned_at=datetime.utcnow()
                )
                db.add(user_badge)
                db.commit()
                db.refresh(user_badge)
                
                # Return badge object
                badge = db.query(Badge).filter(Badge.id == badge_id).first()
                return badge

        return None
