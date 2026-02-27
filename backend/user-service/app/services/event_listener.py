import asyncio
import json
import logging
try:
    import redis.asyncio as redis
except ImportError:
    import aioredis as redis
from typing import Optional
from app.core.config import settings
from app.core.database import SessionLocal
from app.services.user_service import UserService

logger = logging.getLogger(__name__)


class EventListener:
    def __init__(self):
        self.redis_client: Optional[redis.Redis] = None
        self.running = False

    async def connect(self):
        """Connect to Redis"""
        try:
            self.redis_client = await redis.from_url(
                settings.REDIS_URL,
                decode_responses=True
            )
            logger.info("Connected to Redis for event listening")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise

    async def disconnect(self):
        """Disconnect from Redis"""
        if self.redis_client:
            await self.redis_client.close()
            logger.info("Disconnected from Redis")

    async def listen_for_events(self):
        """Listen for events from Redis pub/sub"""
        if not self.redis_client:
            await self.connect()

        pubsub = self.redis_client.pubsub()
        await pubsub.subscribe('user_events')

        logger.info("Started listening for user events")

        try:
            while self.running:
                message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                if message:
                    try:
                        event_data = json.loads(message['data'])
                        await self.handle_event(event_data)
                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to parse event data: {e}")
                    except Exception as e:
                        logger.error(f"Error handling event: {e}", exc_info=True)
        except asyncio.CancelledError:
            logger.info("Event listener cancelled")
        finally:
            await pubsub.unsubscribe('user_events')
            await pubsub.close()

    async def handle_event(self, event_data: dict):
        """Handle incoming event"""
        event_type = event_data.get('type')
        user_id = event_data.get('user_id')
        data = event_data.get('data', {})

        logger.info(f"Received event: {event_type} for user {user_id}")

        db = SessionLocal()
        try:
            if event_type == 'xp_added':
                xp_amount = data.get('xp', 0)
                if xp_amount > 0:
                    from app.schemas.user import XPUpdate
                    UserService.add_xp(db, user_id, XPUpdate(xp=xp_amount))
                    logger.info(f"Added {xp_amount} XP to user {user_id}")

            elif event_type == 'goal_completed':
                xp_reward = data.get('xp_reward', 0)
                if xp_reward > 0:
                    from app.schemas.user import XPUpdate
                    UserService.add_xp(db, user_id, XPUpdate(xp=xp_reward))
                    logger.info(f"Added {xp_reward} XP for goal completion to user {user_id}")

            elif event_type == 'budget_planned':
                xp_reward = data.get('xp_reward', 0)
                if xp_reward > 0:
                    from app.schemas.user import XPUpdate
                    UserService.add_xp(db, user_id, XPUpdate(xp=xp_reward))
                    logger.info(f"Added {xp_reward} XP for budget planning to user {user_id}")

        except Exception as e:
            logger.error(f"Error processing event {event_type}: {e}", exc_info=True)
            db.rollback()
        finally:
            db.close()

    async def start(self):
        """Start the event listener"""
        self.running = True
        await self.listen_for_events()

    async def stop(self):
        """Stop the event listener"""
        self.running = False
        await self.disconnect()


# Global event listener instance
event_listener = EventListener()
