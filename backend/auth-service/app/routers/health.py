from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from app.core.database import engine
from sqlalchemy import text

router = APIRouter()


@router.get("/")
async def health_check():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "healthy", "service": "auth-service"}
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "unhealthy", "error": str(e)}
        )
