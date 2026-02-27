from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
import httpx
from app.core.config import settings
from app.core.auth import verify_admin_token
from app.core.database import get_db
from sqlalchemy import text

router = APIRouter()


@router.get("/dashboard")
async def get_dashboard_stats(
    token: str = Depends(verify_admin_token),
    db = Depends(get_db)
) -> Dict[str, Any]:
    """Get comprehensive dashboard statistics"""
    
    # Get stats directly from database
    try:
        # Users count
        users_result = db.execute(text("SELECT COUNT(*) as count FROM users")).fetchone()
        users_stats = {"total_users": users_result[0] if users_result else 0}
    except Exception as e:
        print(f"Error fetching users stats: {e}")
        users_stats = {"total_users": 0}
    
    try:
        # Transactions count
        transactions_result = db.execute(text("SELECT COUNT(*) as count FROM transactions")).fetchone()
        transactions_stats = {"total_transactions": transactions_result[0] if transactions_result else 0}
    except Exception as e:
        print(f"Error fetching transactions stats: {e}")
        transactions_stats = {"total_transactions": 0}
    
    try:
        # Quizzes completed count
        quizzes_result = db.execute(text("SELECT COUNT(*) as count FROM quiz_progress WHERE completed = true")).fetchone()
        quizzes_stats = {"completed_quizzes": quizzes_result[0] if quizzes_result else 0}
    except Exception as e:
        print(f"Error fetching quizzes stats: {e}")
        quizzes_stats = {"completed_quizzes": 0}
    
    try:
        # Goals completed count
        goals_result = db.execute(text("SELECT COUNT(*) as count FROM goals WHERE completed = true")).fetchone()
        goals_stats = {"completed_goals": goals_result[0] if goals_result else 0}
    except Exception as e:
        print(f"Error fetching goals stats: {e}")
        goals_stats = {"completed_goals": 0}
    
    return {
        "users": users_stats,
        "transactions": transactions_stats,
        "quizzes": quizzes_stats,
        "goals": goals_stats,
        "analytics": {},
    }


@router.get("/users")
async def get_users_list(
    page: int = 1,
    page_size: int = 50,
    token: str = Depends(verify_admin_token)
) -> Dict[str, Any]:
    """Get list of users with pagination"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{settings.USER_SERVICE_URL}/api/v1/users",
                params={"page": page, "page_size": page_size},
                headers={"Authorization": f"Bearer {token}"},
                timeout=10.0
            )
            if response.status_code == 200:
                return response.json()
            raise HTTPException(status_code=response.status_code, detail=response.text)
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Service unavailable: {str(e)}")


@router.get("/analytics/errors")
async def get_error_analytics(
    token: str = Depends(verify_admin_token)
) -> Dict[str, Any]:
    """Get analytics about common errors and difficulties"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{settings.ANALYTICS_SERVICE_URL}/api/v1/analytics/errors",
                headers={"Authorization": f"Bearer {token}"},
                timeout=10.0
            )
            if response.status_code == 200:
                return response.json()
            return {}
        except:
            return {}


@router.get("/analytics/scenarios")
async def get_scenario_analytics(
    token: str = Depends(verify_admin_token)
) -> Dict[str, Any]:
    """Get analytics about scenario effectiveness"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{settings.ANALYTICS_SERVICE_URL}/api/v1/analytics/scenarios",
                headers={"Authorization": f"Bearer {token}"},
                timeout=10.0
            )
            if response.status_code == 200:
                return response.json()
            return {}
        except:
            return {}
