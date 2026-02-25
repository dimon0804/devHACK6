from pydantic import BaseModel, field_serializer
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

    @field_serializer('amount')
    def serialize_decimal(self, value: Decimal) -> str:
        return str(value)

    class Config:
        from_attributes = True


class TransactionListResponse(BaseModel):
    transactions: list[TransactionResponse]
    total: int
    page: int
    page_size: int
