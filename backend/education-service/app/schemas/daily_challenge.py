from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date


class DailyChallengeBase(BaseModel):
    title: str
    description: str
    challenge_date: date
    xp_reward: int = 20
    condition: str
    condition_value: Optional[str] = None


class DailyChallengeCreate(DailyChallengeBase):
    pass


class DailyChallengeResponse(DailyChallengeBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class UserDailyChallengeResponse(BaseModel):
    id: int
    user_id: int
    challenge_id: int
    completed: bool
    completed_at: Optional[datetime] = None
    challenge: DailyChallengeResponse

    class Config:
        from_attributes = True


class TodayChallengeResponse(BaseModel):
    challenge: Optional[DailyChallengeResponse] = None
    user_progress: Optional[UserDailyChallengeResponse] = None
