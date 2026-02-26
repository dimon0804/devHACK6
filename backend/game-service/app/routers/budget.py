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


@router.post("/income", response_model=dict)
async def receive_income(
    income_data: dict,
    user_and_token: tuple[int, str] = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Получить доход - добавляет деньги на баланс"""
    user_id, token = user_and_token
    amount = income_data.get("amount", 0)
    
    if amount <= 0:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Amount must be positive"
        )
    
    import httpx
    from app.core.config import settings
    
    async with httpx.AsyncClient() as client:
        # Обновляем баланс
        balance_response = await client.post(
            f"{settings.USER_SERVICE_URL}/api/v1/users/balance",
            headers={"Authorization": f"Bearer {token}"},
            json={"amount": str(amount)},
            timeout=5.0
        )
        
        if balance_response.status_code != 200:
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update balance"
            )
        
        # Создаем транзакцию
        try:
            await client.post(
                f"{settings.PROGRESS_SERVICE_URL}/api/v1/transactions",
                headers={"Authorization": f"Bearer {token}"},
                json={
                    "type": "income",
                    "amount": str(amount),
                    "description": f"💰 Получен доход: {amount} ₽"
                },
                timeout=5.0
            )
        except Exception:
            pass
    
    return {
        "success": True,
        "message": f"Получен доход: {amount} ₽",
        "amount": amount
    }


@router.post("/spend", response_model=dict)
async def spend_money(
    spend_data: dict,
    user_and_token: tuple[int, str] = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Потратить деньги - списывает с баланса"""
    user_id, token = user_and_token
    amount = spend_data.get("amount", 0)
    category = spend_data.get("category", "Прочее")
    
    if amount <= 0:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Amount must be positive"
        )
    
    import httpx
    from app.core.config import settings
    
    async with httpx.AsyncClient() as client:
        # Списываем с баланса (отрицательное значение)
        balance_response = await client.post(
            f"{settings.USER_SERVICE_URL}/api/v1/users/balance",
            headers={"Authorization": f"Bearer {token}"},
            json={"amount": str(-amount)},
            timeout=5.0
        )
        
        if balance_response.status_code != 200:
            from fastapi import HTTPException, status
            try:
                error_data = balance_response.json()
                error_detail = error_data.get("detail", "Недостаточно средств")
            except:
                error_detail = "Недостаточно средств"
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_detail
            )
        
        # Создаем транзакцию
        try:
            await client.post(
                f"{settings.PROGRESS_SERVICE_URL}/api/v1/transactions",
                headers={"Authorization": f"Bearer {token}"},
                json={
                    "type": "expense",
                    "amount": str(amount),
                    "description": f"💸 Трата: {category} - {amount} ₽"
                },
                timeout=5.0
            )
        except Exception:
            pass
    
    return {
        "success": True,
        "message": f"Потрачено: {amount} ₽ на {category}",
        "amount": amount
    }