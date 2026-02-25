from pydantic import BaseModel
from decimal import Decimal


class BudgetCategory(BaseModel):
    name: str
    amount: Decimal


class BudgetPlanRequest(BaseModel):
    income: Decimal
    categories: list[BudgetCategory]


class BudgetPlanResponse(BaseModel):
    success: bool
    xp_reward: int
    feedback: str
    balance_updated: bool
