from fastapi import APIRouter, Depends, HTTPException, status, Header, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.auth import verify_token
from app.services.category_service import CategoryService
from app.schemas.category import CategoryCreate, CategoryResponse
from app.models.category import CategoryType

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


@router.get("/categories", response_model=list[CategoryResponse])
async def get_categories(
    category_type: Optional[CategoryType] = Query(None, description="Filter by category type"),
    user_and_token: tuple[int, str] = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Получить все категории (глобальные + пользовательские)"""
    user_id, _ = user_and_token
    categories = CategoryService.get_categories(db, user_id, category_type)
    return categories


@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_data: CategoryCreate,
    user_and_token: tuple[int, str] = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Создать пользовательскую категорию"""
    user_id, _ = user_and_token
    category = CategoryService.create_category(db, user_id, category_data)
    return category


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    user_and_token: tuple[int, str] = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Удалить пользовательскую категорию"""
    user_id, _ = user_and_token
    CategoryService.delete_category(db, category_id, user_id)
    return None

