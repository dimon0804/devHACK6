import logging
from typing import Any, Dict, List, Optional

from aiogram import Router
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import Message, ReplyKeyboardRemove
from httpx import HTTPStatusError

from app.services.api_client import (
    APIClient,
    clear_session_for_telegram_user,
    get_api_client_for_telegram_user,
)

router = Router()
logger = logging.getLogger(__name__)


class TopUpState(StatesGroup):
    waiting_for_amount = State()


class SpendState(StatesGroup):
    waiting_for_amount = State()


class BudgetPlanState(StatesGroup):
    waiting_for_income = State()
    waiting_for_categories = State()


def _main_menu_keyboard():
    """
    Возвращает основное меню бота.
    Импортируем из auth-хендлера лениво, чтобы избежать циклического импорта.
    """
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


@router.message(Command("balance"))
async def cmd_balance(message: Message) -> None:
    client = await _ensure_client(message)
    if client is None:
        return

    try:
        profile: Dict[str, Any] = await client.get_user_profile()
        level_info: Dict[str, Any] = await client.get_level_info()
    except HTTPStatusError as exc:
        status = exc.response.status_code if exc.response is not None else None
        logger.warning("Balance request failed: %s", exc)
        if status == 401:
            await clear_session_for_telegram_user(message.from_user.id)
            await message.answer(
                "Сессия истекла или недействительна. "
                "Пожалуйста, войди заново через /login.",
            )
        else:
            await message.answer("Не удалось получить баланс. Попробуй позже.")
        return

    # Значения могут приходить строками/Decimal — аккуратно приводим типы
    raw_balance = profile.get("balance", 0)
    try:
        balance = float(raw_balance)
    except (TypeError, ValueError):
        balance = 0.0

    try:
        level = int(level_info.get("level", profile.get("level", 1) or 1))
    except (TypeError, ValueError):
        level = 1

    try:
        xp = int(level_info.get("xp", profile.get("xp", 0) or 0))
    except (TypeError, ValueError):
        xp = 0

    try:
        xp_to_next = int(level_info.get("xp_to_next_level", 0) or 0)
    except (TypeError, ValueError):
        xp_to_next = 0

    try:
        progress_percent = float(level_info.get("progress_percent", 0) or 0)
    except (TypeError, ValueError):
        progress_percent = 0.0

    bar_full = max(0, min(10, int(progress_percent // 10)))
    bar = "█" * bar_full + "░" * (10 - bar_full)

    await message.answer(
        f"<b>Твой баланс:</b> {balance:.2f} 💰\n"
        f"<b>Уровень:</b> {level}\n"
        f"<b>Опыт:</b> {xp} / {xp + xp_to_next} XP\n"
        f"<b>Прогресс до следующего уровня:</b> {progress_percent:.0f}%\n"
        f"{bar}",
        reply_markup=_main_menu_keyboard(),
    )


@router.message(Command("transactions"))
async def cmd_transactions(message: Message) -> None:
    client = await _ensure_client(message)
    if client is None:
        return

    try:
        data: Dict[str, Any] = await client.get_transactions(page=1, page_size=10)
    except HTTPStatusError as exc:
        status = exc.response.status_code if exc.response is not None else None
        logger.warning("Transactions request failed: %s", exc)
        if status == 401:
            await clear_session_for_telegram_user(message.from_user.id)
            await message.answer(
                "Сессия истекла или недействительна. "
                "Войди заново через /login, чтобы увидеть историю.",
                reply_markup=_main_menu_keyboard(),
            )
        else:
            await message.answer("Не удалось получить историю транзакций.", reply_markup=_main_menu_keyboard())
        return

    transactions: List[Dict[str, Any]] = data.get("transactions", [])
    if not transactions:
        await message.answer("У тебя пока нет транзакций.", reply_markup=_main_menu_keyboard())
        return

    lines: List[str] = ["<b>Последние транзакции:</b>"]
    for tx in transactions[:10]:
        t_type = tx.get("type", "unknown")
        raw_amount = tx.get("amount", 0)
        try:
            amount = float(raw_amount)
        except (TypeError, ValueError):
            amount = 0.0
        desc = tx.get("description") or ""
        created = tx.get("created_at", "")[:16].replace("T", " ")
        sign = "+" if t_type in ("income", "savings_deposit", "interest") else "-"
        lines.append(f"{created} — {sign}{amount:.2f} ({t_type}) {desc}")

    await message.answer("\n".join(lines), reply_markup=_main_menu_keyboard())


@router.message(Command("goals"))
async def cmd_goals(message: Message) -> None:
    client = await _ensure_client(message)
    if client is None:
        return

    try:
        goals: List[Dict[str, Any]] = await client.get_goals()
    except HTTPStatusError as exc:
        status = exc.response.status_code if exc.response is not None else None
        logger.warning("Goals request failed: %s", exc)
        if status == 401:
            await clear_session_for_telegram_user(message.from_user.id)
            await message.answer(
                "Сессия истекла или недействительна. "
                "Войди заново через /login, чтобы увидеть цели.",
            )
        else:
            await message.answer("Не удалось получить цели накопления.")
        return

    if not goals:
        await message.answer(
            "У тебя ещё нет целей накопления.\n"
            "Создай первую цель командой:\n"
            "<code>/goal_create велосипед 50000</code>",
            reply_markup=_main_menu_keyboard(),
        )
        return

    lines: List[str] = ["<b>Твои цели:</b>"]
    for g in goals:
        goal_id = g.get("id")
        title = g.get("title")
        raw_current = g.get("current_amount", 0)
        raw_target = g.get("target_amount", 0)
        try:
            current = float(raw_current)
        except (TypeError, ValueError):
            current = 0.0
        try:
            target = float(raw_target)
        except (TypeError, ValueError):
            target = 0.0
        percent = (current / target * 100) if target else 0
        completed = g.get("completed", False)
        status = "✅ Завершена" if completed else "⏳ В процессе"
        lines.append(f"#{goal_id} — {title}: {current:.2f}/{target:.2f} ({percent:.0f}%) — {status}")

    lines.append(
        "\nПополнить цель: <code>/goal_deposit id сумма</code>\n"
        "Начислить проценты: <code>/goal_interest id</code>"
    )

    await message.answer("\n".join(lines), reply_markup=_main_menu_keyboard())


@router.message(Command("goal_create"))
async def cmd_goal_create(message: Message) -> None:
    client = await _ensure_client(message)
    if client is None:
        return

    parts = (message.text or "").split(maxsplit=2)
    if len(parts) < 3:
        await message.answer(
            "Использование:\n"
            "<code>/goal_create название сумма</code>\n\n"
            "Пример:\n"
            "<code>/goal_create велосипед 50000</code>",
        )
        return

    _, title, amount_str = parts
    try:
        amount = float(amount_str)
    except ValueError:
        await message.answer("Сумма должна быть числом. Пример: <code>/goal_create велосипед 50000</code>")
        return

    try:
        goal = await client.create_goal(title=title, target_amount=amount)
    except HTTPStatusError as exc:
        status = exc.response.status_code if exc.response is not None else None
        logger.warning("Goal create failed: %s", exc)
        if status == 401:
            await clear_session_for_telegram_user(message.from_user.id)
            await message.answer(
                "Сессия истекла. Войди через /login и попробуй создать цель снова.",
            )
        else:
            await message.answer("Не удалось создать цель. Попробуй позже.")
        return

    raw_target = goal.get("target_amount", 0)
    try:
        target_amount = float(raw_target)
    except (TypeError, ValueError):
        target_amount = 0.0

    await message.answer(
        "Цель создана ✅\n"
        f"#{goal.get('id')} — <b>{goal.get('title')}</b>, цель: {target_amount:.2f}",
        reply_markup=_main_menu_keyboard(),
    )


@router.message(Command("goal_deposit"))
async def cmd_goal_deposit(message: Message) -> None:
    client = await _ensure_client(message)
    if client is None:
        return

    parts = (message.text or "").split()
    if len(parts) < 3:
        await message.answer(
            "Использование:\n"
            "<code>/goal_deposit id сумма</code>\n\n"
            "Пример:\n"
            "<code>/goal_deposit 1 1000</code>",
        )
        return

    _, goal_id_str, amount_str = parts[:3]

    try:
        goal_id = int(goal_id_str)
        amount = float(amount_str)
    except ValueError:
        await message.answer("id цели должен быть целым числом, а сумма — числом.")
        return

    try:
        # Эндпоинт /savings/deposit возвращает сам объект цели (GoalResponse)
        result = await client.deposit_goal(goal_id=goal_id, amount=amount)
    except HTTPStatusError as exc:
        status = exc.response.status_code if exc.response is not None else None
        error_detail = "Неизвестная ошибка"
        try:
            if exc.response is not None:
                error_body = exc.response.json()
                if isinstance(error_body, dict):
                    error_detail = error_body.get("detail", str(error_body))
        except Exception:
            pass
        
        logger.warning("Goal deposit failed: status=%s, detail=%s, goal_id=%s, amount=%s", 
                      status, error_detail, goal_id, amount)
        
        if status == 401:
            await clear_session_for_telegram_user(message.from_user.id)
            await message.answer(
                "Сессия истекла. Войди через /login и попробуй пополнить цель снова.",
                reply_markup=_main_menu_keyboard(),
            )
        elif status == 400:
            # Показываем детали ошибки от API
            await message.answer(
                f"Не удалось пополнить цель.\n\n"
                f"Причина: {error_detail}\n\n"
                f"Проверь:\n"
                f"• ID цели ({goal_id}) существует\n"
                f"• На балансе достаточно средств ({amount:.2f})",
                reply_markup=_main_menu_keyboard(),
            )
        else:
            await message.answer(
                f"Не удалось пополнить цель. Ошибка: {error_detail}",
                reply_markup=_main_menu_keyboard(),
            )
        return

    goal: Dict[str, Any] = result or {}
    raw_current = goal.get("current_amount", 0)
    try:
        current_amount = float(raw_current)
    except (TypeError, ValueError):
        current_amount = 0.0

    # Дополнительно запрашиваем профиль, чтобы показать актуальный баланс
    new_balance: Optional[float] = None
    try:
        profile = await client.get_user_profile()
        raw_balance = profile.get("balance")
        if raw_balance is not None:
            new_balance = float(raw_balance)
    except (HTTPStatusError, TypeError, ValueError):
        new_balance = None

    text = (
        f"Цель #{goal_id} пополнена на {amount:.2f} ✅\n"
        f"Текущий прогресс: {current_amount:.2f}\n"
    )
    if new_balance is not None:
        text += f"\nНовый баланс: {new_balance:.2f} 💰"

    await message.answer(text, reply_markup=_main_menu_keyboard())


@router.message(Command("goal_interest"))
async def cmd_goal_interest(message: Message) -> None:
    """
    Начисление процентов по цели: /goal_interest id
    """
    client = await _ensure_client(message)
    if client is None:
        return

    parts = (message.text or "").split()
    if len(parts) < 2:
        await message.answer(
            "Использование:\n"
            "<code>/goal_interest id</code>\n\n"
            "Пример:\n"
            "<code>/goal_interest 1</code>",
            reply_markup=_main_menu_keyboard(),
        )
        return

    _, goal_id_str = parts[:2]
    try:
        goal_id = int(goal_id_str)
    except ValueError:
        await message.answer("id цели должен быть целым числом.", reply_markup=_main_menu_keyboard())
        return

    try:
        result = await client.apply_interest(goal_id=goal_id)
    except HTTPStatusError as exc:
        logger.warning("Goal interest failed: %s", exc)
        await message.answer("Не удалось начислить проценты. Проверь id цели.", reply_markup=_main_menu_keyboard())
        return

    interest_amount = result.get("interest_amount", 0)
    new_amount = result.get("new_amount", 0)

    await message.answer(
        f"По цели #{goal_id} начислены проценты: <b>{float(interest_amount):.2f}</b> 💰\n"
        f"Новая сумма на цели: <b>{float(new_amount):.2f}</b>",
        reply_markup=_main_menu_keyboard(),
    )


@router.message(Command("budget"))
async def cmd_budget(message: Message, state: FSMContext) -> None:
    """
    Диалоговое планирование бюджета как на сайте.
    """
    client = await _ensure_client(message)
    if client is None:
        return

    await state.set_state(BudgetPlanState.waiting_for_income)
    await state.update_data(categories=[])
    await message.answer(
        "Планирование бюджета 📊\n\n"
        "1️⃣ Введи общий доход на период (например: <code>10000</code>).",
        reply_markup=ReplyKeyboardRemove(),
    )


@router.message(BudgetPlanState.waiting_for_income)
async def budget_income_step(message: Message, state: FSMContext) -> None:
    text = (message.text or "").replace(",", ".").strip()
    try:
        income = float(text)
    except ValueError:
        await message.answer("Доход должен быть числом. Пример: <code>12000</code>")
        return

    if income <= 0:
        await message.answer("Доход должен быть больше нуля 🙂")
        return

    await state.update_data(income=income, categories=[])
    await state.set_state(BudgetPlanState.waiting_for_categories)
    await message.answer(
        "Отлично! Теперь распределим доход по категориям.\n\n"
        "2️⃣ По очереди отправляй категории в формате:\n"
        "<code>Еда 3000</code>\n"
        "<code>Развлечения 2000</code>\n"
        "<code>Накопления 3000</code>\n\n"
        "Когда закончишь, напиши <b>готово</b>.",
    )


@router.message(BudgetPlanState.waiting_for_categories)
async def budget_categories_step(message: Message, state: FSMContext) -> None:
    text = (message.text or "").strip()
    lower = text.lower()

    if lower in {"готово", "готов", "done", "finish", "стоп"}:
        data = await state.get_data()
        income = data.get("income")
        categories: List[Dict[str, Any]] = data.get("categories") or []

        if not categories:
            await message.answer("Нужно добавить хотя бы одну категорию перед завершением.")
            return

        client = await _ensure_client(message)
        if client is None:
            await state.clear()
            return

        try:
            result = await client.create_budget_plan(income=income, categories=categories)
        except HTTPStatusError as exc:
            logger.warning("Budget plan failed: %s", exc)
            await message.answer(
                "Не удалось сохранить бюджет. Попробуй ещё раз позже.",
                reply_markup=_main_menu_keyboard(),
            )
            await state.clear()
            return

        xp_reward = result.get("xp_reward", 0)
        feedback = result.get("feedback") or "Планирование завершено."
        new_balance_raw = result.get("new_balance")
        try:
            new_balance = float(new_balance_raw) if new_balance_raw is not None else None
        except (TypeError, ValueError):
            new_balance = new_balance_raw

        lines = ["<b>Бюджет сохранён</b> ✅\n"]
        lines.append(f"Доход: <b>{income:.2f}</b>")
        lines.append("Категории:")
        for c in categories:
            lines.append(f"• {c.get('name')} — {c.get('amount'):.2f}")

        if xp_reward:
            lines.append(f"\n🏆 Получено опыта: <b>{xp_reward}</b> XP")
        if new_balance is not None:
            lines.append(f"Новый баланс: <b>{new_balance}</b> 💰")

        lines.append(f"\nКомментарий: {feedback}")

        await message.answer("\n".join(lines), reply_markup=_main_menu_keyboard())
        await state.clear()
        return

    # Добавление новой категории
    parts = text.rsplit(" ", 1)
    if len(parts) < 2:
        await message.answer(
            "Нужно указать категорию и сумму через пробел.\n"
            "Пример: <code>Еда 3000</code>",
        )
        return

    name, amount_str = parts[0].strip(), parts[1].replace(",", ".").strip()
    if not name:
        await message.answer("Название категории не может быть пустым 🙂")
        return

    try:
        amount = float(amount_str)
    except ValueError:
        await message.answer("Сумма должна быть числом. Пример: <code>Еда 3000</code>")
        return

    if amount <= 0:
        await message.answer("Сумма по категории должна быть больше нуля 🙂")
        return

    data = await state.get_data()
    categories: List[Dict[str, Any]] = data.get("categories") or []
    categories.append({"name": name, "amount": amount})
    await state.update_data(categories=categories)

    total_planned = sum(c["amount"] for c in categories)
    income = data.get("income", 0)

    await message.answer(
        f"Добавлена категория: <b>{name}</b> — {amount:.2f}\n"
        f"Всего распределено: {total_planned:.2f} из {income:.2f}\n"
        "Можешь добавить ещё категорию или написать <b>готово</b>.",
    )


@router.message(Command("topup"))
async def cmd_topup_start(message: Message, state: FSMContext) -> None:
    """
    Пополнение баланса: /topup или кнопка в будущем.
    """
    client = await _ensure_client(message)
    if client is None:
        return

    await state.set_state(TopUpState.waiting_for_amount)
    await message.answer(
        "Сколько ты хочешь <b>пополнить</b>? 💰\n\n"
        "Напиши сумму числом, например: <code>1500</code>",
        reply_markup=ReplyKeyboardRemove(),
    )


@router.message(TopUpState.waiting_for_amount)
async def cmd_topup_amount(message: Message, state: FSMContext) -> None:
    client = await _ensure_client(message)
    if client is None:
        await state.clear()
        return

    text = (message.text or "").replace(",", ".").strip()
    try:
        amount = float(text)
    except ValueError:
        await message.answer("Сумма должна быть числом. Попробуй ещё раз, например: <code>1500</code>")
        return

    if amount <= 0:
        await message.answer("Сумма должна быть больше нуля 🙂")
        return

    try:
        result = await client.change_balance(amount=amount)
        # не обязательно, но можем дополнительно записать транзакцию
        try:
            await client.add_transaction("income", amount, "Пополнение через бота")
        except HTTPStatusError:
            logger.warning("Failed to add income transaction after balance change")
    except HTTPStatusError as exc:
        status = exc.response.status_code if exc.response is not None else None
        logger.warning("Topup failed: %s", exc)
        if status == 401:
            await clear_session_for_telegram_user(message.from_user.id)
            await message.answer(
                "Сессия истекла. Войди через /login и повтори пополнение.",
                reply_markup=_main_menu_keyboard(),
            )
        else:
            await message.answer("Не удалось пополнить баланс. Попробуй позже.", reply_markup=_main_menu_keyboard())
        await state.clear()
        return

    # API возвращает UserResponse с полем balance (не new_balance)
    new_balance_raw = result.get("balance", result.get("new_balance", 0))
    try:
        new_balance = float(new_balance_raw)
    except (TypeError, ValueError):
        new_balance = 0.0

    await state.clear()
    await message.answer(
        f"Баланс пополнен на {amount:.2f} 💰\n"
        f"Новый баланс: <b>{new_balance:.2f}</b>",
        reply_markup=_main_menu_keyboard(),
    )


@router.message(Command("spend"))
async def cmd_spend_start(message: Message, state: FSMContext) -> None:
    """
    Списание (трата) с баланса.
    """
    client = await _ensure_client(message)
    if client is None:
        return

    await state.set_state(SpendState.waiting_for_amount)
    await message.answer(
        "Сколько ты хочешь <b>потратить</b>? 💸\n\n"
        "Напиши сумму числом, например: <code>500</code>",
        reply_markup=ReplyKeyboardRemove(),
    )


@router.message(SpendState.waiting_for_amount)
async def cmd_spend_amount(message: Message, state: FSMContext) -> None:
    client = await _ensure_client(message)
    if client is None:
        await state.clear()
        return

    text = (message.text or "").replace(",", ".").strip()
    try:
        amount = float(text)
    except ValueError:
        await message.answer("Сумма должна быть числом. Попробуй ещё раз, например: <code>500</code>")
        return

    if amount <= 0:
        await message.answer("Сумма должна быть больше нуля 🙂")
        return

    try:
        result = await client.change_balance(amount=-amount)
        try:
            await client.add_transaction("expense", amount, "Трата через бота")
        except HTTPStatusError:
            logger.warning("Failed to add expense transaction after balance change")
    except HTTPStatusError as exc:
        status = exc.response.status_code if exc.response is not None else None
        logger.warning("Spend failed: %s", exc)
        if status == 401:
            await clear_session_for_telegram_user(message.from_user.id)
            await message.answer(
                "Сессия истекла. Войди через /login и попробуй ещё раз.",
                reply_markup=_main_menu_keyboard(),
            )
        else:
            await message.answer(
                "Не удалось списать средства. Возможно, не хватает баланса.",
                reply_markup=_main_menu_keyboard(),
            )
        await state.clear()
        return

    # API возвращает UserResponse с полем balance (не new_balance)
    new_balance_raw = result.get("balance", result.get("new_balance", 0))
    try:
        new_balance = float(new_balance_raw)
    except (TypeError, ValueError):
        new_balance = 0.0

    await state.clear()
    await message.answer(
        f"Списано {amount:.2f} 💸\n"
        f"Новый баланс: <b>{new_balance:.2f}</b>",
        reply_markup=_main_menu_keyboard(),
    )


