from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any, List


class BadgeResponse(BaseModel):
    id: int
    name: str
    title: str
    description: Optional[str]
    icon: Optional[str]

    class Config:
        from_attributes = True


class UserBadgeResponse(BaseModel):
    id: int
    badge: BadgeResponse
    earned_at: datetime

    class Config:
        from_attributes = True


class BadgeListResponse(BaseModel):
    badges: List[BadgeResponse]
    user_badges: List[int]  # list of badge IDs user has earned
