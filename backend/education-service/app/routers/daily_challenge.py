from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.auth import verify_token
from app.services.daily_challenge_service import DailyChallengeService
from app.schemas.daily_challenge import TodayChallengeResponse, UserDailyChallengeResponse
from typing import List

router = APIRouter()


async def get_current_user_id(
    authorization: Optional[str] = Header(None)
) -> tuple[int, str]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header"
        )
    token = authorization.split(" ")[1]
    user_data = await verify_token(token)
    return user_data["id"], token


@router.get("/today", response_model=TodayChallengeResponse)
async def get_today_challenge(
    user_and_token: tuple[int, str] = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get today's daily challenge and user's progress"""
    user_id, token = user_and_token
    
    challenge = DailyChallengeService.get_or_create_today_challenge(db)
    user_challenge = DailyChallengeService.get_user_today_challenge(db, user_id)
    
    return {
        "challenge": challenge,
        "user_progress": user_challenge
    }


@router.post("/check")
async def check_and_complete_challenge(
    request_data: dict,
    user_and_token: tuple[int, str] = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Check if user completed today's challenge"""
    user_id, token = user_and_token
    
    challenge_type = request_data.get("challenge_type")
    condition_data = request_data.get("condition_data", {})
    
    if not challenge_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="challenge_type is required"
        )
    
    challenge = await DailyChallengeService.check_and_complete_challenge(
        db, user_id, challenge_type, condition_data, token
    )
    
    if challenge:
        return {
            "completed": True,
            "challenge": {
                "id": challenge.id,
                "title": challenge.title,
                "xp_reward": challenge.xp_reward
            }
        }
    
    return {"completed": False}
