import httpx
import logging
from decimal import Decimal
from app.core.config import settings
from app.schemas.budget import BudgetPlanRequest, BudgetCategory


class BudgetService:
    BALANCED_THRESHOLD = Decimal("0.10")
    XP_REWARD_BALANCED = 50
    XP_REWARD_UNBALANCED = 10
    logger = logging.getLogger(__name__)

    @staticmethod
    async def process_budget_plan(
        request: BudgetPlanRequest,
        user_id: int,
        token: str
    ) -> dict:
        total_allocated = sum(cat.amount for cat in request.categories)
        difference = abs(request.income - total_allocated)

        if difference > request.income * BudgetService.BALANCED_THRESHOLD:
            feedback = "Распределение бюджета не соответствует вашему доходу. Попробуйте распределить ровно столько, сколько вы зарабатываете!"
            xp_reward = BudgetService.XP_REWARD_UNBALANCED
            success = False
        else:
            categories_count = len(request.categories)
            if categories_count < 3:
                feedback = "Хорошее начало! Рекомендуем добавить больше категорий для лучшего планирования бюджета."
                xp_reward = BudgetService.XP_REWARD_UNBALANCED
                success = False
            else:
                feedback = "Отличное планирование бюджета! Вы хорошо сбалансировали доходы и расходы."
                xp_reward = BudgetService.XP_REWARD_BALANCED
                success = True

        # Планирование бюджета - это только создание плана, не изменение баланса
        # Баланс будет изменяться только при реальных операциях (получение дохода, траты)
        async with httpx.AsyncClient() as client:
            try:
                # Publish event for XP addition (event-based)
                from app.core.events import event_publisher
                await event_publisher.publish(
                    'budget_planned',
                    user_id,
                    {'xp_reward': xp_reward, 'success': success}
                )
                
                # Fallback: direct HTTP call if event publishing fails
                try:
                    xp_response = await client.post(
                        f"{settings.USER_SERVICE_URL}/api/v1/users/xp",
                        headers={"Authorization": f"Bearer {token}"},
                        json={"xp": xp_reward},
                        timeout=5.0
                    )
                except Exception:
                    pass  # Event-based approach is primary

                # Создаем транзакцию только для записи плана (не меняет баланс)
                try:
                    transaction_url = f"{settings.PROGRESS_SERVICE_URL}/api/v1/transactions"
                    
                    # Создаем транзакцию-план для дохода (тип budget_plan для отличия от реальных транзакций)
                    income_transaction = {
                        "type": "income",
                        "amount": str(request.income),
                        "description": f"📋 План бюджета: Доход {request.income} ₽"
                    }
                    await client.post(
                        transaction_url,
                        headers={"Authorization": f"Bearer {token}"},
                        json=income_transaction,
                        timeout=5.0
                    )
                    
                    # Check for achievements and daily challenges
                    try:
                        # Check first budget achievement
                        await client.post(
                            f"{settings.EDUCATION_SERVICE_URL}/api/v1/achievements/check",
                            headers={"Authorization": f"Bearer {token}"},
                            json={
                                "achievement_type": "first_budget",
                                "condition": {}
                            },
                            timeout=5.0
                        )
                        
                        # Check daily challenge
                        await client.post(
                            f"{settings.EDUCATION_SERVICE_URL}/api/v1/daily-challenges/check",
                            headers={"Authorization": f"Bearer {token}"},
                            json={
                                "challenge_type": "create_budget",
                                "condition_data": {}
                            },
                            timeout=5.0
                        )
                    except Exception:
                        pass  # Don't fail if achievement check fails
                    
                    # Создаем транзакции-планы для каждой категории
                    for category in request.categories:
                        category_transaction = {
                            "type": "expense",
                            "amount": str(category.amount),
                            "description": f"📋 План бюджета: {category.name} - {category.amount} ₽"
                        }
                        await client.post(
                            transaction_url,
                            headers={"Authorization": f"Bearer {token}"},
                            json=category_transaction,
                            timeout=5.0
                        )
                except Exception:
                    BudgetService.logger.exception("Error creating plan transactions")
            except httpx.RequestError as e:
                BudgetService.logger.warning(f"Error updating XP: {e}")

        return {
            "success": success,
            "xp_reward": xp_reward,
            "feedback": feedback,
            "balance_updated": False  # Планирование не меняет баланс
        }
