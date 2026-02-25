from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal


class GoalCreate(BaseModel):
    title: str
    target_amount: Decimal


class GoalResponse(BaseModel):
    id: int
    user_id: int
    title: str
    target_amount: Decimal
    current_amount: Decimal
    completed: bool
    created_at: datetime

    class Config:
        from_attributes = True


class SavingsDeposit(BaseModel):
    goal_id: int
    amount: Decimal


class SavingsInterestResponse(BaseModel):
    goal_id: int
    interest_amount: Decimal
    new_amount: Decimal
