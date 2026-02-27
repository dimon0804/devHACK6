from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime


class AnalyticsEventCreate(BaseModel):
    event_type: str
    event_category: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None  # Keep in schema for API, will be mapped to event_data in model


class AnalyticsEventResponse(BaseModel):
    id: int
    event_type: str
    event_category: Optional[str]
    metadata: Optional[Dict[str, Any]] = None  # Map from event_data
    created_at: datetime
    
    class Config:
        from_attributes = True
    
    @classmethod
    def from_orm(cls, obj):
        """Custom from_orm to map event_data to metadata"""
        data = {
            "id": obj.id,
            "event_type": obj.event_type,
            "event_category": obj.event_category,
            "metadata": obj.event_data,  # Map event_data to metadata
            "created_at": obj.created_at
        }
        return cls(**data)


class AggregatedAnalyticsResponse(BaseModel):
    quiz_difficulties: Dict[str, float]  # {quiz_id: error_rate}
    scenario_success_rates: Dict[str, float]  # {scenario_type: success_rate}
    common_errors: Dict[str, int]  # {error_type: count}
    topic_completion_rates: Dict[str, float]  # {topic: completion_rate}
    user_engagement: Dict[str, Any]  # Various engagement metrics
