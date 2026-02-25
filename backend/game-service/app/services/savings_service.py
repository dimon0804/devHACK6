from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from decimal import Decimal
import httpx
from app.models.goal import Goal
from app.schemas.savings import GoalCreate, SavingsDeposit
from app.core.config import settings


class SavingsService:
    INTEREST_RATE = Decimal("0.05")
    XP_REWARD_GOAL_COMPLETED = 100

    @staticmethod
    def create_goal(db: Session, user_id: int, goal_data: GoalCreate) -> Goal:
        goal = Goal(
            user_id=user_id,
            title=goal_data.title,
            target_amount=goal_data.target_amount,
            current_amount=Decimal("0.00")
        )
        db.add(goal)
        db.commit()
        db.refresh(goal)
        return goal

    @staticmethod
    def get_user_goals(db: Session, user_id: int) -> list[Goal]:
        return db.query(Goal).filter(Goal.user_id == user_id).all()

    @staticmethod
    def get_goal_by_id(db: Session, goal_id: int, user_id: int) -> Goal:
        goal = db.query(Goal).filter(
            Goal.id == goal_id,
            Goal.user_id == user_id
        ).first()
        if not goal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Goal not found"
            )
        return goal

    @staticmethod
    async def deposit_to_goal(
        db: Session,
        user_id: int,
        deposit_data: SavingsDeposit,
        token: str
    ) -> Goal:
        goal = SavingsService.get_goal_by_id(db, deposit_data.goal_id, user_id)

        if goal.completed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Goal already completed"
            )

        async with httpx.AsyncClient() as client:
            try:
                balance_response = await client.post(
                    f"{settings.USER_SERVICE_URL}/api/v1/users/balance",
                    headers={"Authorization": f"Bearer {token}"},
                    json={"amount": str(-deposit_data.amount)},
                    timeout=5.0
                )
                if balance_response.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Insufficient balance"
                    )

                transaction_response = await client.post(
                    f"{settings.PROGRESS_SERVICE_URL}/api/v1/transactions",
                    headers={"Authorization": f"Bearer {token}"},
                    json={
                        "type": "savings_deposit",
                        "amount": str(-deposit_data.amount),
                        "description": f"Deposit to goal: {goal.title}"
                    },
                    timeout=5.0
                )
            except httpx.RequestError:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Service unavailable"
                )

        goal.current_amount += deposit_data.amount

        if goal.current_amount >= goal.target_amount:
            goal.completed = True
            goal.current_amount = goal.target_amount

            try:
                async with httpx.AsyncClient() as client:
                    xp_response = await client.post(
                        f"{settings.USER_SERVICE_URL}/api/v1/users/xp",
                        headers={"Authorization": f"Bearer {token}"},
                        json={"xp": SavingsService.XP_REWARD_GOAL_COMPLETED},
                        timeout=5.0
                    )
            except httpx.RequestError:
                pass

        db.commit()
        db.refresh(goal)
        return goal

    @staticmethod
    async def apply_interest(
        db: Session,
        goal_id: int,
        user_id: int,
        token: str
    ) -> dict:
        goal = SavingsService.get_goal_by_id(db, goal_id, user_id)

        if goal.completed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Goal already completed"
            )

        interest_amount = goal.current_amount * SavingsService.INTEREST_RATE
        goal.current_amount += interest_amount

        if goal.current_amount >= goal.target_amount:
            goal.completed = True
            goal.current_amount = goal.target_amount

            try:
                async with httpx.AsyncClient() as client:
                    xp_response = await client.post(
                        f"{settings.USER_SERVICE_URL}/api/v1/users/xp",
                        headers={"Authorization": f"Bearer {token}"},
                        json={"xp": SavingsService.XP_REWARD_GOAL_COMPLETED},
                        timeout=5.0
                    )
            except httpx.RequestError:
                pass

        db.commit()
        db.refresh(goal)

        return {
            "goal_id": goal.id,
            "interest_amount": interest_amount,
            "new_amount": goal.current_amount
        }
