from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from decimal import Decimal
from app.models.user import User
from app.schemas.user import UserUpdate, BalanceUpdate, XPUpdate


class UserService:
    XP_PER_LEVEL = 100

    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> User:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return user

    @staticmethod
    def update_user(db: Session, user_id: int, user_update: UserUpdate) -> User:
        user = UserService.get_user_by_id(db, user_id)

        if user_update.username:
            existing_user = db.query(User).filter(
                User.username == user_update.username,
                User.id != user_id
            ).first()
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already taken"
                )
            user.username = user_update.username

        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def update_balance(db: Session, user_id: int, balance_update: BalanceUpdate) -> User:
        user = UserService.get_user_by_id(db, user_id)
        new_balance = user.balance + balance_update.amount

        if new_balance < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Insufficient balance"
            )

        user.balance = new_balance
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def add_xp(db: Session, user_id: int, xp_update: XPUpdate) -> User:
        user = UserService.get_user_by_id(db, user_id)
        user.xp += xp_update.xp

        old_level = user.level
        new_level = user.xp // UserService.XP_PER_LEVEL + 1

        if new_level > old_level:
            user.level = new_level

        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def calculate_level_info(xp: int) -> dict:
        level = xp // UserService.XP_PER_LEVEL + 1
        xp_in_current_level = xp % UserService.XP_PER_LEVEL
        xp_to_next_level = UserService.XP_PER_LEVEL - xp_in_current_level
        return {
            "level": level,
            "xp": xp,
            "xp_to_next_level": xp_to_next_level
        }
