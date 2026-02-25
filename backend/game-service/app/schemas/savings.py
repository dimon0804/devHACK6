from pydantic import BaseModel, field_serializer
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

    @field_serializer('target_amount', 'current_amount')
    def serialize_decimal(self, value: Decimal) -> str:
        return str(value)

    class Config:
        from_attributes = True


class SavingsDeposit(BaseModel):
    goal_id: int
    amount: Decimal


class SavingsInterestResponse(BaseModel):
    goal_id: int
    interest_amount: Decimal
    new_amount: Decimal

    @field_serializer('interest_amount', 'new_amount')
    def serialize_decimal(self, value: Decimal) -> str:
        return str(value)
