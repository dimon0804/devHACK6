from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    level: int
    xp: int
    balance: Decimal
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    username: str | None = None


class BalanceUpdate(BaseModel):
    amount: Decimal


class XPUpdate(BaseModel):
    xp: int


class LevelResponse(BaseModel):
    level: int
    xp: int
    xp_to_next_level: int
