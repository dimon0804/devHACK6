from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime


class AnalyticsEventCreate(BaseModel):
    event_type: str
    event_category: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class AnalyticsEventResponse(BaseModel):
    id: int
    event_type: str
    event_category: Optional[str]
    metadata: Optional[Dict[str, Any]]
    created_at: datetime
    
    class Config:
        from_attributes = True


class AggregatedAnalyticsResponse(BaseModel):
    quiz_difficulties: Dict[str, float]  # {quiz_id: error_rate}
    scenario_success_rates: Dict[str, float]  # {scenario_type: success_rate}
    common_errors: Dict[str, int]  # {error_type: count}
    topic_completion_rates: Dict[str, float]  # {topic: completion_rate}
    user_engagement: Dict[str, Any]  # Various engagement metrics
