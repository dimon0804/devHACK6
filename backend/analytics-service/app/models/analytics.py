from sqlalchemy import Column, Integer, String, DateTime, JSON, Float
from sqlalchemy.sql import func
from app.core.database import Base


class AnalyticsEvent(Base):
    """Anonymous analytics events"""
    __tablename__ = "analytics_events"
    
    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String, nullable=False, index=True)  # quiz_error, scenario_completion, etc.
    event_category = Column(String, nullable=True, index=True)  # quiz, budget, savings, etc.
    metadata = Column(JSON, nullable=True)  # Additional event data (anonymized)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)


class AnalyticsAggregate(Base):
    """Pre-aggregated analytics data"""
    __tablename__ = "analytics_aggregates"
    
    id = Column(Integer, primary_key=True, index=True)
    metric_name = Column(String, nullable=False, index=True)  # quiz_difficulty_rate, scenario_success_rate, etc.
    metric_category = Column(String, nullable=True, index=True)
    metric_value = Column(Float, nullable=False)
    period_start = Column(DateTime(timezone=True), nullable=False, index=True)
    period_end = Column(DateTime(timezone=True), nullable=False)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
