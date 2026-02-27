from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.auth import verify_token
from app.services.achievement_service import AchievementService
from app.schemas.achievement import AchievementListResponse, UserAchievementResponse
from typing import List

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


@router.get("", response_model=AchievementListResponse)
async def get_achievements(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get all achievements and user's unlocked achievements"""
    achievements = AchievementService.get_all_achievements(db)
    user_achievements = AchievementService.get_user_achievements(db, user_id)
    user_achievement_ids = [ua.achievement_id for ua in user_achievements]
    
    return {
        "achievements": achievements,
        "user_achievements": user_achievement_ids
    }


@router.get("/my", response_model=List[UserAchievementResponse])
async def get_my_achievements(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get user's unlocked achievements"""
    user_achievements = AchievementService.get_user_achievements(db, user_id)
    return user_achievements


@router.post("/check")
async def check_and_award_achievement(
    request_data: dict,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Check and award achievement based on condition"""
    achievement_type = request_data.get("achievement_type")
    condition = request_data.get("condition", {})
    
    if not achievement_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="achievement_type is required"
        )
    
    achievement = AchievementService.check_and_award_achievement(
        db, user_id, achievement_type, condition
    )
    
    if achievement:
        return {
            "awarded": True,
            "achievement": {
                "id": achievement.id,
                "title": achievement.title,
                "description": achievement.description,
                "icon": achievement.icon
            }
        }
    
    return {"awarded": False}
