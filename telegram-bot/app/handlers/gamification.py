import logging
from typing import Any, Dict, Optional

from aiogram import Router
from aiogram.filters import Command
from aiogram.types import Message
from httpx import HTTPStatusError

from app.services.api_client import (
    APIClient,
    clear_session_for_telegram_user,
    get_api_client_for_telegram_user,
)

router = Router()
logger = logging.getLogger(__name__)


def _main_menu_keyboard():
    """Возвращает основное меню бота. Импортируем из auth-хендлера лениво."""
    from app.handlers.auth import _main_menu_keyboard as auth_main_menu
    return auth_main_menu()


async def _ensure_client(message: Message) -> Optional[APIClient]:
    client = await get_api_client_for_telegram_user(message.from_user.id)
    if client is None:
        await message.answer(
            "Ты ещё не авторизован в боте.\n"
            "Сначала выполни <b>/login email пароль</b> или <b>/register</b>.",
        )
    return client


@router.message(Command("progress", "stats"))
async def cmd_progress(message: Message) -> None:
    client = await _ensure_client(message)
    if client is None:
        return

    try:
        profile: Dict[str, Any] = await client.get_user_profile()
        level_info: Dict[str, Any] = await client.get_level_info()
    except HTTPStatusError as exc:
        status = exc.response.status_code if exc.response is not None else None
        logger.warning("Progress request failed: %s", exc)
        if status == 401:
            await clear_session_for_telegram_user(message.from_user.id)
            await message.answer("Сессия истекла. Войди через /login, чтобы увидеть прогресс.", reply_markup=_main_menu_keyboard())
        else:
            await message.answer("Не удалось получить прогресс.", reply_markup=_main_menu_keyboard())
        return

    level = level_info.get("level", profile.get("level", 1))
    xp = level_info.get("xp", profile.get("xp", 0))
    xp_to_next = level_info.get("xp_to_next_level", 0)
    progress_percent = level_info.get("progress_percent", 0)

    bar_full = int(progress_percent // 10)
    bar = "█" * bar_full + "░" * (10 - bar_full)

    await message.answer(
        "<b>Твой прогресс</b> 🎮\n\n"
        f"Уровень: <b>{level}</b>\n"
        f"Опыт: <b>{xp}</b> (+ ещё {xp_to_next} XP до следующего уровня)\n"
        f"Прогресс: {progress_percent:.0f}%\n"
        f"{bar}\n\n"
        "Продолжай проходить квизы, выполнять задания и создавать цели, "
        "чтобы прокачивать свой финансовый уровень 💪",
        reply_markup=_main_menu_keyboard(),
    )


@router.message(Command("achievements"))
async def cmd_achievements(message: Message) -> None:
    client = await _ensure_client(message)
    if client is None:
        return

    try:
        data: Dict[str, Any] = await client._request("GET", "/api/v1/achievements/my")
    except HTTPStatusError as exc:
        status = exc.response.status_code if exc.response is not None else None
        logger.warning("Achievements request failed: %s", exc)
        if status == 401:
            await clear_session_for_telegram_user(message.from_user.id)
            await message.answer("Сессия истекла. Войди через /login, чтобы увидеть достижения.", reply_markup=_main_menu_keyboard())
        else:
            await message.answer("Не удалось получить список достижений.", reply_markup=_main_menu_keyboard())
        return

    achievements = data or []
    if not achievements:
        await message.answer("У тебя пока нет достижений. Всё впереди! 🎯", reply_markup=_main_menu_keyboard())
        return

    lines = ["<b>Твои достижения:</b>"]
    for a in achievements:
        icon = a.get("icon", "🎯")
        title = a.get("title")
        desc = a.get("description", "")
        unlocked = (a.get("unlocked_at") or "")[:10]
        lines.append(f"{icon} <b>{title}</b> — {desc} (дата: {unlocked})")

    await message.answer("\n".join(lines), reply_markup=_main_menu_keyboard())


@router.message(Command("badges"))
async def cmd_badges(message: Message) -> None:
    client = await _ensure_client(message)
    if client is None:
        return

    try:
        data: Dict[str, Any] = await client._request("GET", "/api/v1/badges/my")
    except HTTPStatusError as exc:
        status = exc.response.status_code if exc.response is not None else None
        logger.warning("Badges request failed: %s", exc)
        if status == 401:
            await clear_session_for_telegram_user(message.from_user.id)
            await message.answer("Сессия истекла. Войди через /login, чтобы увидеть бейджи.", reply_markup=_main_menu_keyboard())
        else:
            await message.answer("Не удалось получить список бейджей.", reply_markup=_main_menu_keyboard())
        return

    badges = data or []
    if not badges:
        await message.answer("У тебя пока нет бейджей. Начни с первого бюджета или квиза! 💰", reply_markup=_main_menu_keyboard())
        return

    lines = ["<b>Твои бейджи:</b>"]
    for b in badges:
        icon = b.get("icon", "🏅")
        title = b.get("title")
        desc = b.get("description", "")
        unlocked = (b.get("unlocked_at") or "")[:10]
        lines.append(f"{icon} <b>{title}</b> — {desc} (дата: {unlocked})")

    await message.answer("\n".join(lines), reply_markup=_main_menu_keyboard())


@router.message(Command("daily", "challenge"))
async def cmd_daily(message: Message) -> None:
    client = await _ensure_client(message)
    if client is None:
        return

    try:
        data: Dict[str, Any] = await client.get_daily_challenge()
    except HTTPStatusError as exc:
        status = exc.response.status_code if exc.response is not None else None
        logger.warning("Daily challenge request failed: %s", exc)
        if status == 401:
            await clear_session_for_telegram_user(message.from_user.id)
            await message.answer("Сессия истекла. Войди через /login, чтобы увидеть челлендж.", reply_markup=_main_menu_keyboard())
        else:
            await message.answer("Не удалось получить ежедневное задание.", reply_markup=_main_menu_keyboard())
        return

    challenge = data.get("challenge") or {}
    progress = data.get("user_progress") or {}

    completed_at = progress.get("completed_at")
    status = "✅ Выполнено!" if completed_at else "⏳ Можно выполнить сегодня."

    await message.answer(
        "<b>Ежедневный челлендж</b> 🔥\n\n"
        f"{challenge.get('title')}\n\n"
        f"{challenge.get('description')}\n\n"
        f"Награда: {challenge.get('xp_reward', 0)} XP\n"
        f"Статус: {status}",
        reply_markup=_main_menu_keyboard(),
    )


def _split_transactions_by_type(transactions: list[dict[str, Any]]) -> tuple[float, float]:
    income_total = 0.0
    expense_total = 0.0
    for tx in transactions:
        t_type = (tx.get("type") or "").lower()
        raw_amount = tx.get("amount", 0)
        try:
            amount = float(raw_amount)
        except (TypeError, ValueError):
            amount = 0.0

        if t_type in ("income", "interest"):
            income_total += amount
        elif t_type in ("expense", "savings_deposit", "goal_completed"):
            expense_total += amount
    return income_total, expense_total


async def _get_recent_transactions(
    message: Message,
    days: int,
) -> Optional[list[dict[str, Any]]]:
    client = await _ensure_client(message)
    if client is None:
        return None

    try:
        data: Dict[str, Any] = await client.get_transactions(page=1, page_size=100)
    except HTTPStatusError as exc:
        status = exc.response.status_code if exc.response is not None else None
        logger.warning("Stats transactions request failed: %s", exc)
        if status == 401:
            await clear_session_for_telegram_user(message.from_user.id)
            await message.answer("Сессия истекла. Войди через /login, чтобы увидеть статистику.", reply_markup=_main_menu_keyboard())
        else:
            await message.answer("Не удалось получить историю транзакций для статистики.", reply_markup=_main_menu_keyboard())
        return None

    from datetime import datetime, timedelta, timezone

    items = data.get("transactions", []) or []
    if not items:
        return []

    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    result: list[dict[str, Any]] = []
    for tx in items:
        created_at = tx.get("created_at")
        if not created_at:
            continue
        try:
            dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        except ValueError:
            continue
        # приводим к одному типу (UTC-aware)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        if dt >= cutoff:
            result.append(tx)

    return result


@router.message(Command("week", "stats_week"))
async def cmd_week_stats(message: Message) -> None:
    """
    Статистика за 7 дней: доходы, расходы, количество операций.
    """
    txs = await _get_recent_transactions(message, days=7)
    if txs is None:
        return
    if not txs:
        await message.answer("За последние 7 дней у тебя не было операций.", reply_markup=_main_menu_keyboard())
        return

    income_total, expense_total = _split_transactions_by_type(txs)

    await message.answer(
        "<b>Статистика за 7 дней</b> 📊\n\n"
        f"Операций всего: <b>{len(txs)}</b>\n"
        f"Доходы: <b>{income_total:.2f}</b>\n"
        f"Расходы и переводы в цели: <b>{expense_total:.2f}</b>\n",
        reply_markup=_main_menu_keyboard(),
    )


@router.message(Command("month", "stats_month"))
async def cmd_month_stats(message: Message) -> None:
    """
    Статистика за 30 дней: доходы, расходы, количество операций.
    """
    txs = await _get_recent_transactions(message, days=30)
    if txs is None:
        return
    if not txs:
        await message.answer("За последние 30 дней у тебя не было операций.", reply_markup=_main_menu_keyboard())
        return

    income_total, expense_total = _split_transactions_by_type(txs)

    await message.answer(
        "<b>Статистика за 30 дней</b> 📊\n\n"
        f"Операций всего: <b>{len(txs)}</b>\n"
        f"Доходы: <b>{income_total:.2f}</b>\n"
        f"Расходы и переводы в цели: <b>{expense_total:.2f}</b>\n",
        reply_markup=_main_menu_keyboard(),
    )


