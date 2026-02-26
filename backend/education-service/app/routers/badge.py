from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.auth import verify_token
from app.services.badge_service import BadgeService
from app.schemas.badge import BadgeResponse, UserBadgeResponse, BadgeListResponse

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


@router.get("", response_model=BadgeListResponse)
async def get_badges(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get all badges and user's earned badges"""
    badges = BadgeService.get_all_badges(db)
    user_badges = BadgeService.get_user_badges(db, user_id)
    user_badge_ids = [ub.badge_id for ub in user_badges]
    
    return {
        "badges": badges,
        "user_badges": user_badge_ids
    }


@router.get("/my", response_model=List[UserBadgeResponse])
async def get_my_badges(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get user's earned badges"""
    user_badges = BadgeService.get_user_badges(db, user_id)
    return user_badges
