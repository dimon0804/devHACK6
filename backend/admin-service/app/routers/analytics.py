from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
import httpx
from app.core.config import settings
from app.core.auth import verify_admin_token

router = APIRouter()


@router.get("/dashboard")
async def get_dashboard_stats(
    token: str = Depends(verify_admin_token)
) -> Dict[str, Any]:
    """Get comprehensive dashboard statistics"""
    async with httpx.AsyncClient() as client:
        # Fetch data from all services
        try:
            # Users stats
            users_response = await client.get(
                f"{settings.USER_SERVICE_URL}/api/v1/users/stats",
                headers={"Authorization": f"Bearer {token}"},
                timeout=10.0
            )
            users_stats = users_response.json() if users_response.status_code == 200 else {}
        except:
            users_stats = {}
        
        try:
            # Transactions stats
            transactions_response = await client.get(
                f"{settings.PROGRESS_SERVICE_URL}/api/v1/transactions/stats",
                headers={"Authorization": f"Bearer {token}"},
                timeout=10.0
            )
            transactions_stats = transactions_response.json() if transactions_response.status_code == 200 else {}
        except:
            transactions_stats = {}
        
        try:
            # Quizzes stats
            quizzes_response = await client.get(
                f"{settings.EDUCATION_SERVICE_URL}/api/v1/quizzes/stats",
                headers={"Authorization": f"Bearer {token}"},
                timeout=10.0
            )
            quizzes_stats = quizzes_response.json() if quizzes_response.status_code == 200 else {}
        except:
            quizzes_stats = {}
        
        try:
            # Goals stats
            goals_response = await client.get(
                f"{settings.GAME_SERVICE_URL}/api/v1/savings/stats",
                headers={"Authorization": f"Bearer {token}"},
                timeout=10.0
            )
            goals_stats = goals_response.json() if goals_response.status_code == 200 else {}
        except:
            goals_stats = {}
        
        try:
            # Analytics aggregated data
            analytics_response = await client.get(
                f"{settings.ANALYTICS_SERVICE_URL}/api/v1/analytics/aggregated",
                headers={"Authorization": f"Bearer {token}"},
                timeout=10.0
            )
            analytics_data = analytics_response.json() if analytics_response.status_code == 200 else {}
        except:
            analytics_data = {}
    
    return {
        "users": users_stats,
        "transactions": transactions_stats,
        "quizzes": quizzes_stats,
        "goals": goals_stats,
        "analytics": analytics_data,
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
