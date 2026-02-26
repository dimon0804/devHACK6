from pydantic import BaseModel
from datetime import datetime
from app.models.category import CategoryType


class CategoryBase(BaseModel):
    name: str
    type: CategoryType


class CategoryCreate(CategoryBase):
    pass


class CategoryResponse(CategoryBase):
    id: int
    user_id: int | None
    created_at: datetime

    class Config:
        from_attributes = True

