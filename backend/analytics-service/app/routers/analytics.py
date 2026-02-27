from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any
from app.core.database import get_db
from app.schemas.analytics import AnalyticsEventCreate, AnalyticsEventResponse, AggregatedAnalyticsResponse
from app.services.analytics_service import AnalyticsService

router = APIRouter()


@router.post("/events", response_model=AnalyticsEventResponse)
async def create_analytics_event(
    event: AnalyticsEventCreate,
    db: Session = Depends(get_db)
):
    """Create an anonymous analytics event"""
    # Anonymize user_id if present in metadata
    metadata = event.metadata or {}
    if "user_id" in metadata:
        # Hash or remove user_id for anonymity
        del metadata["user_id"]
    
    created_event = AnalyticsService.create_event(
        db=db,
        event_type=event.event_type,
        event_category=event.event_category,
        metadata=metadata
    )
    return created_event


@router.get("/aggregated", response_model=AggregatedAnalyticsResponse)
async def get_aggregated_analytics(
    db: Session = Depends(get_db)
) -> AggregatedAnalyticsResponse:
    """Get aggregated anonymous analytics"""
    data = AnalyticsService.get_aggregated_analytics(db)
    return AggregatedAnalyticsResponse(**data)


@router.get("/errors")
async def get_error_analytics(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get error analytics"""
    return AnalyticsService.get_error_analytics(db)


@router.get("/scenarios")
async def get_scenario_analytics(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get scenario effectiveness analytics"""
    return AnalyticsService.get_scenario_analytics(db)
