from fastapi import APIRouter
from sqlalchemy.orm import Session
from app.core.database import get_db

router = APIRouter()


@router.get("")
async def health_check(db: Session = get_db().__next__()):
    """Health check endpoint"""
    try:
        # Test database connection
        db.execute("SELECT 1")
        return {
            "status": "healthy",
            "service": "education-service",
            "database": "connected"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "service": "education-service",
            "database": "disconnected",
            "error": str(e)
        }
