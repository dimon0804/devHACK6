from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.auth import verify_token
from app.services.budget_service import BudgetService
from app.schemas.budget import BudgetPlanRequest, BudgetPlanResponse

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


@router.post("/plan", response_model=BudgetPlanResponse)
async def plan_budget(
    budget_request: BudgetPlanRequest,
    user_and_token: tuple[int, str] = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    user_id, token = user_and_token
    result = await BudgetService.process_budget_plan(budget_request, user_id, token)
    return result
