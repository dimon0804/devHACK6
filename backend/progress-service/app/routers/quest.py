from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.auth import verify_token
from app.services.quest_service import QuestService
from app.schemas.quest import QuestResponse, QuestProgressResponse, QuestProgressCreate

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


@router.get("", response_model=list[QuestResponse])
async def get_all_quests(db: Session = Depends(get_db)):
    quests = QuestService.get_all_quests(db)
    return quests


@router.get("/progress", response_model=list[QuestProgressResponse])
async def get_user_quest_progress(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    progress = QuestService.get_user_quest_progress(db, user_id)
    return progress


@router.post("/progress", response_model=QuestProgressResponse, status_code=status.HTTP_201_CREATED)
async def create_quest_progress(
    progress_data: QuestProgressCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    progress = QuestService.create_or_update_quest_progress(db, user_id, progress_data)
    return progress
