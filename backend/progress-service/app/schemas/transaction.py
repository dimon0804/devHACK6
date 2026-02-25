from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal


class TransactionCreate(BaseModel):
    type: str
    amount: Decimal
    description: str | None = None


class TransactionResponse(BaseModel):
    id: int
    user_id: int
    type: str
    amount: Decimal
    description: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class TransactionListResponse(BaseModel):
    transactions: list[TransactionResponse]
    total: int
    page: int
    page_size: int
