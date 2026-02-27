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
        # Users count and stats
        users_result = db.execute(text("SELECT COUNT(*) as count FROM users")).fetchone()
        users_active = db.execute(text("""
            SELECT COUNT(DISTINCT user_id) 
            FROM transactions 
            WHERE created_at >= NOW() - INTERVAL '30 days'
        """)).fetchone()
        users_stats = {
            "total_users": users_result[0] if users_result else 0,
            "active_users_30d": users_active[0] if users_active else 0
        }
    except Exception as e:
        print(f"Error fetching users stats: {e}")
        users_stats = {"total_users": 0, "active_users_30d": 0}
    
    try:
        # Transactions count and stats
        transactions_result = db.execute(text("SELECT COUNT(*) as count FROM transactions")).fetchone()
        transactions_total = db.execute(text("""
            SELECT COALESCE(SUM(amount), 0) 
            FROM transactions 
            WHERE type = 'income'
        """)).fetchone()
        transactions_stats = {
            "total_transactions": transactions_result[0] if transactions_result else 0,
            "total_income": float(transactions_total[0]) if transactions_total else 0
        }
    except Exception as e:
        print(f"Error fetching transactions stats: {e}")
        transactions_stats = {"total_transactions": 0, "total_income": 0}
    
    try:
        # Quizzes completed count and stats
        quizzes_result = db.execute(text("SELECT COUNT(*) as count FROM quiz_progress WHERE completed = true")).fetchone()
        quizzes_avg_score = db.execute(text("""
            SELECT COALESCE(AVG(score), 0) 
            FROM quiz_progress 
            WHERE completed = true
        """)).fetchone()
        quizzes_stats = {
            "completed_quizzes": quizzes_result[0] if quizzes_result else 0,
            "avg_score": round(float(quizzes_avg_score[0]), 1) if quizzes_avg_score else 0
        }
    except Exception as e:
        print(f"Error fetching quizzes stats: {e}")
        quizzes_stats = {"completed_quizzes": 0, "avg_score": 0}
    
    try:
        # Goals completed count and stats
        goals_result = db.execute(text("SELECT COUNT(*) as count FROM goals WHERE completed = true")).fetchone()
        goals_total = db.execute(text("SELECT COUNT(*) as count FROM goals")).fetchone()
        goals_total_amount = db.execute(text("""
            SELECT COALESCE(SUM(target_amount), 0) 
            FROM goals 
            WHERE completed = true
        """)).fetchone()
        goals_stats = {
            "completed_goals": goals_result[0] if goals_result else 0,
            "total_goals": goals_total[0] if goals_total else 0,
            "total_saved": float(goals_total_amount[0]) if goals_total_amount else 0
        }
    except Exception as e:
        print(f"Error fetching goals stats: {e}")
        goals_stats = {"completed_goals": 0, "total_goals": 0, "total_saved": 0}
    
    try:
        # Badges and achievements
        badges_count = db.execute(text("SELECT COUNT(*) FROM user_badges")).fetchone()
        achievements_count = db.execute(text("SELECT COUNT(*) FROM user_achievements")).fetchone()
        gamification_stats = {
            "total_badges_earned": badges_count[0] if badges_count else 0,
            "total_achievements_unlocked": achievements_count[0] if achievements_count else 0
        }
    except Exception as e:
        print(f"Error fetching gamification stats: {e}")
        gamification_stats = {"total_badges_earned": 0, "total_achievements_unlocked": 0}
    
    return {
        "users": users_stats,
        "transactions": transactions_stats,
        "quizzes": quizzes_stats,
        "goals": goals_stats,
        "gamification": gamification_stats,
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
    token: str = Depends(verify_admin_token),
    db = Depends(get_db)
) -> Dict[str, Any]:
    """Get analytics about common errors and difficulties"""
    try:
        # Get quiz errors by quiz title
        quiz_errors_query = text("""
            SELECT 
                q.title as quiz_title,
                COUNT(qp.id) FILTER (WHERE qp.score < 70) as error_count,
                COUNT(qp.id) as total_attempts
            FROM quiz_progress qp
            JOIN quizzes q ON qp.quiz_id = q.id
            GROUP BY q.id, q.title
            HAVING COUNT(qp.id) > 0
            ORDER BY error_count DESC
            LIMIT 10
        """)
        quiz_errors = db.execute(quiz_errors_query).fetchall()
        
        quiz_errors_list = []
        for row in quiz_errors:
            quiz_errors_list.append({
                "quiz_title": row[0],
                "error_count": row[1] or 0,
                "total_attempts": row[2] or 0,
                "error_rate": round((row[1] or 0) / (row[2] or 1) * 100, 1)
            })
        
        # Get errors by category (from analytics_events if exists)
        try:
            errors_by_category_query = text("""
                SELECT 
                    event_category,
                    COUNT(*) as error_count
                FROM analytics_events
                WHERE event_type = 'quiz_error' OR event_type = 'error'
                GROUP BY event_category
                ORDER BY error_count DESC
            """)
            errors_by_category = db.execute(errors_by_category_query).fetchall()
            errors_by_category_dict = {row[0]: row[1] for row in errors_by_category if row[0]}
        except:
            errors_by_category_dict = {}
        
        # Get most problematic quiz questions
        problematic_questions_query = text("""
            SELECT 
                q.title as quiz_title,
                qn.question,
                COUNT(*) FILTER (WHERE qp.score < 70) as error_count
            FROM quiz_progress qp
            JOIN quizzes q ON qp.quiz_id = q.id
            JOIN questions qn ON qn.quiz_id = q.id
            WHERE qp.score < 70
            GROUP BY q.id, q.title, qn.id, qn.question
            ORDER BY error_count DESC
            LIMIT 10
        """)
        try:
            problematic_questions = db.execute(problematic_questions_query).fetchall()
            problematic_questions_list = [
                {
                    "quiz_title": row[0],
                    "question": row[1][:100] + "..." if len(row[1]) > 100 else row[1],
                    "error_count": row[2] or 0
                }
                for row in problematic_questions
            ]
        except:
            problematic_questions_list = []
        
        return {
            "errors_by_category": errors_by_category_dict,
            "quiz_errors": quiz_errors_list,
            "problematic_questions": problematic_questions_list
        }
    except Exception as e:
        print(f"Error fetching error analytics: {e}")
        return {
            "errors_by_category": {},
            "quiz_errors": [],
            "problematic_questions": []
        }


@router.get("/analytics/scenarios")
async def get_scenario_analytics(
    token: str = Depends(verify_admin_token),
    db = Depends(get_db)
) -> Dict[str, Any]:
    """Get analytics about scenario effectiveness"""
    try:
        scenarios = []
        
        # Budget planning scenario
        try:
            budget_query = text("""
                SELECT 
                    COUNT(*) as total_attempts,
                    COUNT(*) FILTER (WHERE amount > 0) as successful_attempts,
                    AVG(amount) as avg_amount
                FROM transactions
                WHERE type = 'income' AND description LIKE '%бюджет%'
            """)
            budget_result = db.execute(budget_query).fetchone()
            if budget_result and budget_result[0] > 0:
                total = budget_result[0] or 0
                successful = budget_result[1] or 0
                scenarios.append({
                    "scenario_type": "budget",
                    "total_attempts": total,
                    "success_count": successful,
                    "failure_count": total - successful,
                    "success_rate": round((successful / total * 100) if total > 0 else 0, 1),
                    "avg_completion_time_seconds": 0
                })
        except Exception as e:
            print(f"Error fetching budget stats: {e}")
        
        # Savings goals scenario
        try:
            savings_query = text("""
                SELECT 
                    COUNT(*) as total_goals,
                    COUNT(*) FILTER (WHERE completed = true) as completed_goals,
                    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_time
                FROM goals
            """)
            savings_result = db.execute(savings_query).fetchone()
            if savings_result and savings_result[0] > 0:
                total = savings_result[0] or 0
                completed = savings_result[1] or 0
                avg_time = savings_result[2] or 0
                scenarios.append({
                    "scenario_type": "savings",
                    "total_attempts": total,
                    "success_count": completed,
                    "failure_count": total - completed,
                    "success_rate": round((completed / total * 100) if total > 0 else 0, 1),
                    "avg_completion_time_seconds": round(avg_time, 1) if avg_time else 0
                })
        except Exception as e:
            print(f"Error fetching savings stats: {e}")
        
        # Quiz scenario
        try:
            quiz_query = text("""
                SELECT 
                    COUNT(*) as total_attempts,
                    COUNT(*) FILTER (WHERE completed = true AND score >= 70) as successful_attempts,
                    AVG(score) as avg_score
                FROM quiz_progress
            """)
            quiz_result = db.execute(quiz_query).fetchone()
            if quiz_result and quiz_result[0] > 0:
                total = quiz_result[0] or 0
                successful = quiz_result[1] or 0
                scenarios.append({
                    "scenario_type": "quiz",
                    "total_attempts": total,
                    "success_count": successful,
                    "failure_count": total - successful,
                    "success_rate": round((successful / total * 100) if total > 0 else 0, 1),
                    "avg_completion_time_seconds": 0
                })
        except Exception as e:
            print(f"Error fetching quiz stats: {e}")
        
        return {
            "scenarios": scenarios
        }
    except Exception as e:
        print(f"Error fetching scenario analytics: {e}")
        return {
            "scenarios": []
        }
