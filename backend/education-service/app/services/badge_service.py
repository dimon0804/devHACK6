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
        token: str
    ) -> Optional[Badge]:
        """Check if user should receive a badge and award it"""
        # Find badge by condition
        badge = db.query(Badge).filter(
            Badge.condition['type'].astext == badge_type
        ).first()

        if not badge:
            return None

        # Check if already earned
        existing = db.query(UserBadge).filter(
            UserBadge.user_id == user_id,
            UserBadge.badge_id == badge.id
        ).first()

        if existing:
            return badge

        # Check condition
        condition = badge.condition
        if condition.get('type') == 'quiz_completed':
            if condition_data.get('quiz_id') == condition.get('quiz_id'):
                # Award badge
                from datetime import datetime
                user_badge = UserBadge(
                    user_id=user_id,
                    badge_id=badge.id,
                    earned_at=datetime.utcnow()
                )
                db.add(user_badge)
                db.commit()
                return badge

        return None
