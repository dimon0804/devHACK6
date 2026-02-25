from fastapi import APIRouter
from app.core.database import engine
from sqlalchemy import text

router = APIRouter()


@router.get("/")
async def health_check():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "healthy", "service": "progress-service"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}, 503
