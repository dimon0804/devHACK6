from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from decimal import Decimal
import httpx
import logging
from app.models.goal import Goal
from app.schemas.savings import GoalCreate, SavingsDeposit
from app.core.config import settings

logger = logging.getLogger(__name__)


class SavingsService:
    INTEREST_RATE = Decimal("0.05")
    XP_REWARD_GOAL_COMPLETED = 100

    @staticmethod
    def create_goal(db: Session, user_id: int, goal_data: GoalCreate) -> Goal:
        try:
            logger.info(f"Creating goal for user {user_id}: title={goal_data.title}, target_amount={goal_data.target_amount}")
            goal = Goal(
                user_id=user_id,
                title=goal_data.title,
                target_amount=goal_data.target_amount,
                current_amount=Decimal("0.00")
            )
            db.add(goal)
            db.commit()
            db.refresh(goal)
            logger.info(f"Goal created successfully: id={goal.id}")
            return goal
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to create goal: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create goal: {str(e)}"
            )

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
                    try:
                        error_data = balance_response.json()
                        error_detail = error_data.get("detail", "Недостаточно средств на балансе")
                    except:
                        error_detail = "Недостаточно средств на балансе"
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=error_detail
                    )

                # Create transaction for deposit
                try:
                    transaction_url = f"{settings.PROGRESS_SERVICE_URL}/api/v1/transactions"
                    transaction_payload = {
                        "type": "savings_deposit",
                        "amount": str(-deposit_data.amount),
                        "description": f"Пополнение цели: {goal.title}"
                    }
                    print(f"Creating transaction: {transaction_url} with payload: {transaction_payload}")
                    transaction_response = await client.post(
                        transaction_url,
                        headers={"Authorization": f"Bearer {token}"},
                        json=transaction_payload,
                        timeout=5.0
                    )
                    print(f"Transaction response: {transaction_response.status_code}, {transaction_response.text}")
                    if transaction_response.status_code != 201:
                        print(f"Failed to create transaction: {transaction_response.status_code}, {transaction_response.text}")
                except Exception:
                    logger.exception("Error creating transaction")
                    # Don't fail the deposit if transaction creation fails
            except httpx.RequestError as e:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Service unavailable"
                )

        goal.current_amount += deposit_data.amount

        if goal.current_amount >= goal.target_amount:
            goal.completed = True
            goal.current_amount = goal.target_amount

            try:
                from app.core.events import event_publisher
                await event_publisher.publish(
                    "goal_completed",
                    user_id,
                    {"xp_reward": SavingsService.XP_REWARD_GOAL_COMPLETED, "goal_id": goal.id}
                )
                async with httpx.AsyncClient() as client:
                    await client.post(
                        f"{settings.USER_SERVICE_URL}/api/v1/users/xp",
                        headers={"Authorization": f"Bearer {token}"},
                        json={"xp": SavingsService.XP_REWARD_GOAL_COMPLETED},
                        timeout=5.0
                    )
                    # Create transaction for goal completion
                    try:
                        await client.post(
                            f"{settings.PROGRESS_SERVICE_URL}/api/v1/transactions",
                            headers={"Authorization": f"Bearer {token}"},
                            json={
                                "type": "goal_completed",
                                "amount": str(goal.target_amount),
                                "description": f"Цель достигнута: {goal.title}"
                            },
                            timeout=5.0
                        )
                    except Exception:
                        pass
                    
                    # Award badge for goal completion
                    try:
                        await client.post(
                            f"{settings.EDUCATION_SERVICE_URL}/api/v1/badges/check",
                            headers={"Authorization": f"Bearer {token}"},
                            json={
                                "badge_type": "goal_completed",
                                "condition": {"type": "goal_completed", "goal_id": goal.id}
                            },
                            timeout=5.0
                        )
                    except Exception:
                        pass
                    
                    # Check savings amount achievement
                    try:
                        total_savings = goal.current_amount
                        await client.post(
                            f"{settings.EDUCATION_SERVICE_URL}/api/v1/achievements/check",
                            headers={"Authorization": f"Bearer {token}"},
                            json={
                                "achievement_type": "savings_amount",
                                "condition": {"current_amount": float(total_savings)}
                            },
                            timeout=5.0
                        )
                    except Exception:
                        pass
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

        # Create transaction for interest
        try:
            async with httpx.AsyncClient() as client:
                await client.post(
                    f"{settings.PROGRESS_SERVICE_URL}/api/v1/transactions",
                    headers={"Authorization": f"Bearer {token}"},
                    json={
                        "type": "interest",
                        "amount": str(interest_amount),
                        "description": f"Проценты по цели: {goal.title}"
                    },
                    timeout=5.0
                )
        except Exception:
            pass

        if goal.current_amount >= goal.target_amount:
            goal.completed = True
            goal.current_amount = goal.target_amount

            try:
                from app.core.events import event_publisher
                await event_publisher.publish(
                    "goal_completed",
                    user_id,
                    {"xp_reward": SavingsService.XP_REWARD_GOAL_COMPLETED, "goal_id": goal.id}
                )
                async with httpx.AsyncClient() as client:
                    await client.post(
                        f"{settings.USER_SERVICE_URL}/api/v1/users/xp",
                        headers={"Authorization": f"Bearer {token}"},
                        json={"xp": SavingsService.XP_REWARD_GOAL_COMPLETED},
                        timeout=5.0
                    )
                    # Create transaction for goal completion
                    try:
                        await client.post(
                            f"{settings.PROGRESS_SERVICE_URL}/api/v1/transactions",
                            headers={"Authorization": f"Bearer {token}"},
                            json={
                                "type": "goal_completed",
                                "amount": str(goal.target_amount),
                                "description": f"Цель достигнута: {goal.title}"
                            },
                            timeout=5.0
                        )
                    except Exception:
                        pass
            except httpx.RequestError:
                pass

        db.commit()
        db.refresh(goal)

        return {
            "goal_id": goal.id,
            "interest_amount": interest_amount,
            "new_amount": goal.current_amount
        }
