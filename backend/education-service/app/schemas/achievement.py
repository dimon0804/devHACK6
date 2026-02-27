from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class AchievementBase(BaseModel):
    title: str
    description: str
    icon: Optional[str] = None
    condition: dict


class AchievementCreate(AchievementBase):
    pass


class AchievementResponse(AchievementBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class UserAchievementResponse(BaseModel):
    id: int
    user_id: int
    achievement_id: int
    unlocked_at: datetime
    achievement: AchievementResponse

    class Config:
        from_attributes = True


class AchievementListResponse(BaseModel):
    achievements: List[AchievementResponse]
    user_achievements: List[int]  # IDs of unlocked achievements
