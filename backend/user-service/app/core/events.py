import json
import logging
try:
    import redis.asyncio as redis
except ImportError:
    import aioredis as redis
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


class EventPublisher:
    """Publish events to Redis pub/sub"""
    
    def __init__(self):
        self.redis_client: Optional[redis.Redis] = None

    async def connect(self):
        """Connect to Redis"""
        try:
            self.redis_client = await redis.from_url(
                settings.REDIS_URL,
                decode_responses=True
            )
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")

    async def publish(self, event_type: str, user_id: int, data: dict):
        """Publish an event"""
        if not self.redis_client:
            await self.connect()

        event = {
            'type': event_type,
            'user_id': user_id,
            'data': data,
            'timestamp': None  # Will be set by receiver if needed
        }

        try:
            await self.redis_client.publish('user_events', json.dumps(event))
            logger.info(f"Published event: {event_type} for user {user_id}")
        except Exception as e:
            logger.error(f"Failed to publish event: {e}")

    async def close(self):
        """Close Redis connection"""
        if self.redis_client:
            await self.redis_client.close()


# Global event publisher instance
event_publisher = EventPublisher()
