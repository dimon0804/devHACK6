from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional
import logging

from app.core.database import get_db
from app.core.auth import verify_token
from app.services.savings_service import SavingsService
from app.schemas.savings import GoalCreate, GoalResponse, SavingsDeposit, SavingsInterestResponse

logger = logging.getLogger(__name__)

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


@router.post("/goals", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
async def create_goal(
    goal_data: GoalCreate,
    user_and_token: tuple[int, str] = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    try:
        user_id, _ = user_and_token
        goal = SavingsService.create_goal(db, user_id, goal_data)
        # Явно конвертируем в dict для сериализации
        return GoalResponse(
            id=goal.id,
            user_id=goal.user_id,
            title=goal.title,
            target_amount=goal.target_amount,
            current_amount=goal.current_amount,
            completed=goal.completed,
            created_at=goal.created_at
        )
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        logger.error(f"Error in create_goal: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create goal: {str(e)}"
        )


@router.get("/goals", response_model=list[GoalResponse])
async def get_goals(
    user_and_token: tuple[int, str] = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    user_id, _ = user_and_token
    goals = SavingsService.get_user_goals(db, user_id)
    return goals


@router.get("/goals/{goal_id}", response_model=GoalResponse)
async def get_goal(
    goal_id: int,
    user_and_token: tuple[int, str] = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    user_id, _ = user_and_token
    goal = SavingsService.get_goal_by_id(db, goal_id, user_id)
    return goal


@router.post("/deposit", response_model=GoalResponse)
async def deposit_to_goal(
    deposit_data: SavingsDeposit,
    user_and_token: tuple[int, str] = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    user_id, token = user_and_token
    goal = await SavingsService.deposit_to_goal(db, user_id, deposit_data, token)
    return goal


@router.post("/interest/{goal_id}", response_model=SavingsInterestResponse)
async def apply_interest(
    goal_id: int,
    user_and_token: tuple[int, str] = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    user_id, token = user_and_token
    result = await SavingsService.apply_interest(db, goal_id, user_id, token)
    return result
