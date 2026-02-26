from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional, List, Dict

from app.core.database import get_db
from app.core.auth import verify_token
from app.services.guided_mode_service import GuidedModeService

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


@router.get("/steps")
async def get_guided_steps(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get all guided mode steps with completion status"""
    steps = GuidedModeService.get_guided_steps()
    
    result = []
    for step in steps:
        completed = GuidedModeService.check_step_completion(
            db, user_id, step["id"], {}
        )
        result.append({
            **step,
            "completed": completed,
            "locked": False  # Can be enhanced with unlock logic
        })
    
    return {"steps": result}


@router.get("/steps/{step_id}")
async def get_step(
    step_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get specific step details"""
    step = GuidedModeService.get_step_by_id(step_id)
    if not step:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Step not found"
        )
    
    completed = GuidedModeService.check_step_completion(
        db, user_id, step_id, {}
    )
    
    return {
        **step,
        "completed": completed
    }
