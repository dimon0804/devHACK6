from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.auth import verify_token
from app.services.user_service import UserService
from app.schemas.user import UserResponse, UserUpdate, BalanceUpdate, XPUpdate, LevelResponse

router = APIRouter()


async def get_current_user_id(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> int:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header"
        )
    token = authorization.split(" ")[1]
    user_data = await verify_token(token)
    return user_data["id"]


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    user = UserService.get_user_by_id(db, user_id)
    return user


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    user = UserService.update_user(db, user_id, user_update)
    return user


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    if user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this user"
        )
    user = UserService.get_user_by_id(db, user_id)
    return user


@router.post("/balance", response_model=UserResponse)
async def update_balance(
    balance_update: BalanceUpdate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    user = UserService.update_balance(db, user_id, balance_update)
    return user


@router.post("/xp", response_model=UserResponse)
async def add_xp(
    xp_update: XPUpdate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    user = UserService.add_xp(db, user_id, xp_update)
    return user


@router.get("/me/level", response_model=LevelResponse)
async def get_level_info(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    user = UserService.get_user_by_id(db, user_id)
    level_info = UserService.calculate_level_info(user.xp)
    return level_info
