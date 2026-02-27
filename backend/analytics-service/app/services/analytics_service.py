from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import Dict, Any, List
from datetime import datetime, timedelta
from app.models.analytics import AnalyticsEvent, AnalyticsAggregate


class AnalyticsService:
    @staticmethod
    def create_event(db: Session, event_type: str, event_category: str = None, metadata: Dict[str, Any] = None):
        """Create an anonymous analytics event"""
        event = AnalyticsEvent(
            event_type=event_type,
            event_category=event_category,
            event_data=metadata or {}  # Map metadata to event_data
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event
    
    @staticmethod
    def get_aggregated_analytics(db: Session) -> Dict[str, Any]:
        """Get aggregated anonymous analytics"""
        # Quiz difficulties (error rates by quiz)
        quiz_errors = db.execute(
            text("""
                SELECT 
                    event_data->>'quiz_id' as quiz_id,
                    COUNT(*) FILTER (WHERE event_type = 'quiz_error') as error_count,
                    COUNT(*) FILTER (WHERE event_type = 'quiz_completed') as total_count
                FROM analytics_events
                WHERE event_category = 'quiz'
                GROUP BY event_data->>'quiz_id'
            """)
        ).fetchall()
        
        quiz_difficulties = {}
        for row in quiz_errors:
            quiz_id = row[0]
            error_count = row[1] or 0
            total_count = row[2] or 0
            if total_count > 0:
                quiz_difficulties[quiz_id] = (error_count / total_count) * 100
        
        # Scenario success rates
        scenario_stats = db.execute(
            text("""
                SELECT 
                    event_category,
                    COUNT(*) FILTER (WHERE event_type = 'scenario_success') as success_count,
                    COUNT(*) FILTER (WHERE event_type = 'scenario_failure') as failure_count
                FROM analytics_events
                WHERE event_category IN ('budget', 'savings', 'quiz')
                GROUP BY event_category
            """)
        ).fetchall()
        
        scenario_success_rates = {}
        for row in scenario_stats:
            category = row[0]
            success = row[1] or 0
            failure = row[2] or 0
            total = success + failure
            if total > 0:
                scenario_success_rates[category] = (success / total) * 100
        
        # Common errors
        common_errors = db.execute(
            text("""
                SELECT 
                    event_data->>'error_type' as error_type,
                    COUNT(*) as error_count
                FROM analytics_events
                WHERE event_type = 'error'
                GROUP BY event_data->>'error_type'
                ORDER BY error_count DESC
                LIMIT 10
            """)
        ).fetchall()
        
        common_errors_dict = {row[0]: row[1] for row in common_errors if row[0]}
        
        # Topic completion rates
        topic_completions = db.execute(
            text("""
                SELECT 
                    event_category as topic,
                    COUNT(*) FILTER (WHERE event_type = 'topic_completed') as completed,
                    COUNT(*) as total
                FROM analytics_events
                WHERE event_category IN ('budget', 'savings', 'quiz', 'antifraud')
                GROUP BY event_category
            """)
        ).fetchall()
        
        topic_completion_rates = {}
        for row in topic_completions:
            topic = row[0]
            completed = row[1] or 0
            total = row[2] or 0
            if total > 0:
                topic_completion_rates[topic] = (completed / total) * 100
        
        # User engagement (daily active users, etc.)
        last_30_days = datetime.utcnow() - timedelta(days=30)
        daily_active = db.execute(
            text("""
                SELECT 
                    DATE(created_at) as date,
                    COUNT(DISTINCT event_data->>'user_id') as active_users
                FROM analytics_events
                WHERE created_at >= :start_date
                GROUP BY DATE(created_at)
                ORDER BY date DESC
            """),
            {"start_date": last_30_days}
        ).fetchall()
        
        user_engagement = {
            "daily_active_users": [
                {"date": str(row[0]), "count": row[1]} for row in daily_active
            ],
            "total_events_30d": db.query(AnalyticsEvent).filter(
                AnalyticsEvent.created_at >= last_30_days
            ).count()
        }
        
        return {
            "quiz_difficulties": quiz_difficulties,
            "scenario_success_rates": scenario_success_rates,
            "common_errors": common_errors_dict,
            "topic_completion_rates": topic_completion_rates,
            "user_engagement": user_engagement,
        }
    
    @staticmethod
    def get_error_analytics(db: Session) -> Dict[str, Any]:
        """Get detailed error analytics"""
        # Errors by category
        errors_by_category = db.execute(
            text("""
                SELECT 
                    event_category,
                    COUNT(*) as error_count
                FROM analytics_events
                WHERE event_type = 'error'
                GROUP BY event_category
                ORDER BY error_count DESC
            """)
        ).fetchall()
        
        # Errors by quiz/question
        quiz_errors = db.execute(
            text("""
                SELECT 
                    event_data->>'quiz_id' as quiz_id,
                    event_data->>'question_id' as question_id,
                    COUNT(*) as error_count
                FROM analytics_events
                WHERE event_type = 'quiz_error'
                GROUP BY event_data->>'quiz_id', event_data->>'question_id'
                ORDER BY error_count DESC
                LIMIT 20
            """)
        ).fetchall()
        
        return {
            "errors_by_category": {row[0]: row[1] for row in errors_by_category if row[0]},
            "quiz_errors": [
                {"quiz_id": row[0], "question_id": row[1], "count": row[2]}
                for row in quiz_errors if row[0]
            ]
        }
    
    @staticmethod
    def get_scenario_analytics(db: Session) -> Dict[str, Any]:
        """Get scenario effectiveness analytics"""
        # Success rates by scenario type
        scenario_stats = db.execute(
            text("""
                SELECT 
                    event_category,
                    COUNT(*) FILTER (WHERE event_type = 'scenario_success') as success,
                    COUNT(*) FILTER (WHERE event_type = 'scenario_failure') as failure,
                    AVG((event_data->>'completion_time')::float) as avg_completion_time
                FROM analytics_events
                WHERE event_category IN ('budget', 'savings', 'quiz', 'antifraud')
                GROUP BY event_category
            """)
        ).fetchall()
        
        scenarios = []
        for row in scenario_stats:
            category = row[0]
            success = row[1] or 0
            failure = row[2] or 0
            total = success + failure
            avg_time = row[3] or 0
            
            scenarios.append({
                "scenario_type": category,
                "success_rate": (success / total * 100) if total > 0 else 0,
                "total_attempts": total,
                "avg_completion_time_seconds": avg_time
            })
        
        return {"scenarios": scenarios}
