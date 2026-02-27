import os
from typing import Any, Dict, List, Optional

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import TelegramSession
from app.services.database import AsyncSessionLocal


class APIClient:
    """
    Клиент для работы с API Gateway FinTeen.
    
    Поддерживает два режима работы:
    - Локальный: http://api-gateway:8000 (когда бот и API Gateway на одном сервере)
    - Внешний: https://api.finteen.clv-digital.tech (когда бот на другом сервере)
    
    Режим определяется через переменную окружения API_GATEWAY_URL.
    """

    def __init__(self, base_url: Optional[str] = None, access_token: Optional[str] = None):
        # Определяем URL API Gateway:
        # 1. Если передан явно - используем его
        # 2. Если задана переменная окружения - используем её
        # 3. По умолчанию - внешний API Gateway (для продакшн)
        default_url = os.getenv("API_GATEWAY_URL", "https://api.finteen.clv-digital.tech")
        self.base_url = base_url or default_url
        self.access_token = access_token

    def _get_headers(self) -> Dict[str, str]:
        headers: Dict[str, str] = {"Content-Type": "application/json"}
        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
        return headers

    async def _request(self, method: str, path: str, **kwargs: Any) -> Any:
        url = f"{self.base_url}{path}"
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.request(method, url, headers=self._get_headers(), **kwargs)
            response.raise_for_status()
            if response.content:
                return response.json()
            return None

    # ---------- Auth ----------

    async def register(self, email: str, username: str, password: str) -> Dict[str, Any]:
        data = {"email": email, "username": username, "password": password}
        result = await self._request("POST", "/api/v1/auth/register", json=data)
        self.access_token = result.get("access_token")
        return result

    async def login(self, email: str, password: str) -> Dict[str, Any]:
        data = {"email": email, "password": password}
        result = await self._request("POST", "/api/v1/auth/login", json=data)
        self.access_token = result.get("access_token")
        return result

    async def refresh(self, refresh_token: str) -> Dict[str, Any]:
        data = {"refresh_token": refresh_token}
        result = await self._request("POST", "/api/v1/auth/refresh", json=data)
        self.access_token = result.get("access_token")
        return result

    # ---------- User / Profile ----------

    async def get_user_profile(self) -> Dict[str, Any]:
        return await self._request("GET", "/api/v1/users/me")

    async def get_level_info(self) -> Dict[str, Any]:
        return await self._request("GET", "/api/v1/users/me/level")

    # ---------- Finance ----------

    async def get_transactions(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        params = {"page": page, "page_size": page_size}
        return await self._request("GET", "/api/v1/transactions", params=params)

    async def change_balance(self, amount: float) -> Dict[str, Any]:
        """
        Изменение баланса пользователя (как на сайте при пополнении/трате).
        Положительное число = пополнение, отрицательное = списание.
        """
        data = {"amount": amount}
        return await self._request("POST", "/api/v1/users/balance", json=data)

    async def add_transaction(self, tx_type: str, amount: float, description: str = "") -> Dict[str, Any]:
        """
        Явное создание транзакции. Обычно баланс-сервис сам создаёт их,
        но иногда полезно зафиксировать операцию явно.
        """
        data = {"type": tx_type, "amount": amount, "description": description}
        return await self._request("POST", "/api/v1/transactions", json=data)

    async def get_goals(self) -> List[Dict[str, Any]]:
        return await self._request("GET", "/api/v1/savings/goals")

    async def apply_interest(self, goal_id: int) -> Dict[str, Any]:
        """
        Начисление процентов по цели накоплений.
        """
        return await self._request("POST", f"/api/v1/savings/interest/{goal_id}")

    async def create_budget_plan(self, income: float, categories: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Планирование бюджета, как на сайте.
        """
        data = {"income": income, "categories": categories}
        return await self._request("POST", "/api/v1/budget/plan", json=data)

    async def create_goal(self, title: str, target_amount: float) -> Dict[str, Any]:
        data = {"title": title, "target_amount": target_amount}
        return await self._request("POST", "/api/v1/savings/goals", json=data)

    async def deposit_goal(self, goal_id: int, amount: float) -> Dict[str, Any]:
        # API ожидает Decimal, отправляем как строку для точности
        data = {"goal_id": goal_id, "amount": str(amount)}
        return await self._request("POST", "/api/v1/savings/deposit", json=data)

    async def get_daily_challenge(self) -> Dict[str, Any]:
        return await self._request("GET", "/api/v1/daily-challenges/today")

    # ---------- Education / Quizzes ----------

    async def get_quizzes(self) -> Any:
        return await self._request("GET", "/api/v1/quizzes")

    async def get_quiz_details(self, quiz_id: int) -> Dict[str, Any]:
        return await self._request("GET", f"/api/v1/quizzes/{quiz_id}")

    async def submit_quiz(self, quiz_id: int, answers: List[Dict[str, Any]]) -> Dict[str, Any]:
        # API ожидает quiz_id в submission
        data = {"quiz_id": quiz_id, "answers": answers}
        return await self._request("POST", f"/api/v1/quizzes/{quiz_id}/submit", json=data)


async def get_api_client_for_telegram_user(telegram_user_id: int) -> Optional[APIClient]:
    """
    Возвращает APIClient с токеном пользователя по его Telegram ID.
    Если пользователь не авторизован в боте — вернёт None.
    """
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(TelegramSession).where(TelegramSession.telegram_user_id == telegram_user_id)
        )
        tg_session: Optional[TelegramSession] = result.scalar_one_or_none()

        if not tg_session or not tg_session.access_token:
            return None

        # Обновляем last_activity
        tg_session.last_activity = tg_session.last_activity  # триггер onupdate
        await session.commit()

        return APIClient(access_token=tg_session.access_token)


async def save_tokens_for_telegram_user(
    telegram_user_id: int,
    user_id: int,
    access_token: str,
    refresh_token: Optional[str] = None,
) -> None:
    """
    Сохраняет (или обновляет) пару токенов для пользователя Telegram.
    """
    async with AsyncSessionLocal() as session:
        await _upsert_session(session, telegram_user_id, user_id, access_token, refresh_token)
        await session.commit()


async def _upsert_session(
    session: AsyncSession,
    telegram_user_id: int,
    user_id: int,
    access_token: str,
    refresh_token: Optional[str],
) -> None:
    result = await session.execute(
        select(TelegramSession).where(TelegramSession.telegram_user_id == telegram_user_id)
    )
    tg_session: Optional[TelegramSession] = result.scalar_one_or_none()

    if tg_session is None:
        tg_session = TelegramSession(
            telegram_user_id=telegram_user_id,
            user_id=user_id,
            access_token=access_token,
            refresh_token=refresh_token,
        )
        session.add(tg_session)
    else:
        tg_session.user_id = user_id
        tg_session.access_token = access_token
        tg_session.refresh_token = refresh_token


async def clear_session_for_telegram_user(telegram_user_id: int) -> None:
    """
    Сбрасывает токены для пользователя Telegram.
    Используется, когда backend вернул 401 (истёк или некорректный токен).
    """
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(TelegramSession).where(TelegramSession.telegram_user_id == telegram_user_id)
        )
        tg_session: Optional[TelegramSession] = result.scalar_one_or_none()
        if not tg_session:
            return
        tg_session.access_token = None
        tg_session.refresh_token = None
        await session.commit()


