from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional, List

from app.core.database import get_db
from app.core.auth import verify_token
from app.services.badge_service import BadgeService
from app.schemas.badge import BadgeResponse, UserBadgeResponse, BadgeListResponse

router = APIRouter()


async def get_current_user_id(
    authorization: Optional[str] = Header(None)
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


@router.post("/check")
async def check_and_award_badge(
    request_data: dict,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Check and award badge based on condition"""
    badge_type = request_data.get("badge_type")
    condition = request_data.get("condition", {})
    
    if not badge_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="badge_type is required"
        )
    
    badge = BadgeService.check_and_award_badge(
        db, user_id, badge_type, condition
    )
    
    if badge:
        return {
            "awarded": True,
            "badge": {
                "id": badge.id,
                "name": badge.name,
                "title": badge.title,
                "description": badge.description,
                "icon": badge.icon
            }
        }
    
    return {"awarded": False}
