import httpx
from decimal import Decimal
from app.core.config import settings
from app.schemas.budget import BudgetPlanRequest, BudgetCategory


class BudgetService:
    BALANCED_THRESHOLD = Decimal("0.10")
    XP_REWARD_BALANCED = 50
    XP_REWARD_UNBALANCED = 10

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

        balance_updated = False
        # Always try to update balance and add XP, even if budget is not perfectly balanced
        async with httpx.AsyncClient() as client:
            try:
                balance_response = await client.post(
                    f"{settings.USER_SERVICE_URL}/api/v1/users/balance",
                    headers={"Authorization": f"Bearer {token}"},
                    json={"amount": str(request.income)},
                    timeout=5.0
                )
                if balance_response.status_code == 200:
                    balance_updated = True

                xp_response = await client.post(
                    f"{settings.USER_SERVICE_URL}/api/v1/users/xp",
                    headers={"Authorization": f"Bearer {token}"},
                    json={"xp": xp_reward},
                    timeout=5.0
                )

                transaction_response = await client.post(
                    f"{settings.PROGRESS_SERVICE_URL}/api/v1/transactions",
                    headers={"Authorization": f"Bearer {token}"},
                    json={
                        "type": "income",
                        "amount": str(request.income),
                        "description": "Планирование бюджета"
                    },
                    timeout=5.0
                )
            except httpx.RequestError as e:
                # Log error but don't fail the request
                print(f"Error updating balance/XP/transaction: {e}")
                pass

        return {
            "success": success,
            "xp_reward": xp_reward,
            "feedback": feedback,
            "balance_updated": balance_updated
        }
