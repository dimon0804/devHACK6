import logging
from typing import Any, Dict, Optional

from aiogram import F, Router
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import KeyboardButton, Message, ReplyKeyboardMarkup, ReplyKeyboardRemove
from httpx import HTTPStatusError

from app.handlers import antiscam as antiscam_handlers
from app.handlers import education as education_handlers
from app.handlers import finance as finance_handlers
from app.handlers import gamification as gamification_handlers
from app.services.api_client import APIClient, save_tokens_for_telegram_user

logger = logging.getLogger(__name__)

router = Router()


class Registration(StatesGroup):
    waiting_for_email = State()
    waiting_for_password = State()
    waiting_for_username = State()


class Login(StatesGroup):
    waiting_for_email = State()
    waiting_for_password = State()


def _main_menu_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="📊 Баланс"), KeyboardButton(text="➕ Пополнить")],
            [KeyboardButton(text="➖ Потратить"), KeyboardButton(text="🎯 Цели")],
            [KeyboardButton(text="📑 Бюджет")],
            [KeyboardButton(text="🧠 Квизы"), KeyboardButton(text="🔥 Daily")],
            [KeyboardButton(text="📈 Прогресс"), KeyboardButton(text="🏆 Достижения")],
            [KeyboardButton(text="🎖 Бейджи"), KeyboardButton(text="🛡 Антискам")],
            [KeyboardButton(text="📊 Неделя"), KeyboardButton(text="📅 Месяц")],
            [KeyboardButton(text="🏠 Главное меню")],
        ],
        resize_keyboard=True,
    )


def _parse_args(message: Message) -> list[str]:
    text = message.text or ""
    return text.split()


@router.message(Command("start"))
async def cmd_start(message: Message, state: FSMContext) -> None:
    await state.clear()
    await message.answer(
        "Привет! Я бот <b>FinTeen</b> 💰\n\n"
        "Помогу тебе прокачать финансовую грамотность: бюджет, цели, квизы и челленджи — всё как на платформе.\n\n"
        "👆 Используй кнопки ниже или команды /help.",
        reply_markup=_main_menu_keyboard(),
    )


@router.message(Command("help"))
async def cmd_help(message: Message) -> None:
    await message.answer(
        "Доступные команды:\n\n"
        "<b>Аккаунт</b>\n"
        "/register — регистрация (бот пошагово спросит данные)\n"
        "/login — вход (бот спросит email и пароль)\n"
        "/link — привязать существующий аккаунт\n"
        "/logout — выйти из аккаунта в боте\n\n"
        "<b>Финансы</b>\n"
        "/balance — баланс и уровень\n"
        "/transactions — последние транзакции\n"
        "/goals — цели накопления\n"
        "/goal_create &lt;название&gt; &lt;сумма&gt;\n"
        "/goal_deposit &lt;id&gt; &lt;сумма&gt;\n"
        "/budget — планирование бюджета\n"
        "<b>Обучение</b>\n"
        "/quiz — список квизов\n"
        "/quiz &lt;id&gt; — пройти квиз\n"
        "/lessons — мини-уроки\n"
        "/lesson &lt;ключ&gt; — конкретный урок (budget, savings, antiscam)\n"
        "/terms — список терминов\n"
        "/term &lt;слово&gt; — значение термина\n"
        "/tip — совет дня\n\n"
        "<b>Геймификация</b>\n"
        "/progress — твой прогресс\n"
        "/achievements — достижения\n"
        "/badges — бейджи\n"
        "/daily — ежедневное задание\n",
    )


@router.message(Command("register"))
async def cmd_register(message: Message, state: FSMContext) -> None:
    """
    Регистрация: бот пошагово спрашивает email, пароль и имя пользователя.
    Если команда вызвана с аргументами — остаётся быстрый режим: /register email пароль username
    """
    parts = _parse_args(message)
    if len(parts) >= 4:
        # Быстрый режим, как раньше
        _, email, password, username = parts[:4]
        api = APIClient()
        try:
            data: Dict[str, Any] = await api.register(email=email, username=username, password=password)
        except HTTPStatusError as exc:
            logger.warning("Register failed (fast mode): %s", exc)
            status = exc.response.status_code if exc.response is not None else None
            detail: str = ""
            try:
                body = exc.response.json() if exc.response is not None else {}
                if isinstance(body, dict):
                    detail = str(body.get("detail") or "")
            except Exception:
                detail = ""

            if status == 422:
                text = (
                    "Не удалось зарегистрироваться 😔\n\n"
                    "Проверь, что:\n"
                    "• email в формате name@example.com\n"
                    "• пароль не короче 8 символов\n"
                    "• никнейм без пробелов\n"
                )
            elif status == 400 and detail == "Email already registered":
                text = (
                    "Этот email уже зарегистрирован 🔐\n"
                    "Попробуй войти через /login или используй другой email."
                )
            elif status == 400 and detail == "Username already taken":
                text = "Такой ник уже занят. Попробуй другой 🙂"
            else:
                text = (
                    "Не удалось зарегистрироваться 😔\n"
                    "Проверь данные и попробуй ещё раз."
                )

            await message.answer(text)
            return

        user = data.get("user") or {}

        await save_tokens_for_telegram_user(
            telegram_user_id=message.from_user.id,
            user_id=user.get("id"),
            access_token=data.get("access_token", ""),
            refresh_token=data.get("refresh_token"),
        )

        await message.answer(
            "Готово! 🎉\n"
            f"Ты зарегистрирован как <b>{user.get('username') or user.get('email')}</b>.\n\n"
            "Теперь доступны команды /balance, /goals, /quiz, /daily.",
            reply_markup=_main_menu_keyboard(),
        )
        return

    # Пошаговый режим
    await state.set_state(Registration.waiting_for_email)
    await message.answer(
        "Давай зарегистрируемся 👇\n\n"
        "1️⃣ Введи свой email (мы его не показываем другим).",
        reply_markup=ReplyKeyboardRemove(),
    )


@router.message(Registration.waiting_for_email)
async def process_reg_email(message: Message, state: FSMContext) -> None:
    email = (message.text or "").strip()
    if "@" not in email or "." not in email:
        await message.answer("Это не похоже на email. Попробуй ещё раз 🙂")
        return

    await state.update_data(email=email)
    await state.set_state(Registration.waiting_for_password)
    await message.answer(
        "2️⃣ Теперь придумай пароль (минимум 8 символов). "
        "Напиши его сюда.",
    )


@router.message(Registration.waiting_for_password)
async def process_reg_password(message: Message, state: FSMContext) -> None:
    password = (message.text or "").strip()
    if len(password) < 8:
        await message.answer("Пароль должен быть не короче 8 символов. Попробуй ещё раз 💪")
        return

    await state.update_data(password=password)
    await state.set_state(Registration.waiting_for_username)
    await message.answer(
        "3️⃣ И напоследок — выбери себе никнейм (username), "
        "который будет видно в системе.",
    )


@router.message(Registration.waiting_for_username)
async def process_reg_username(message: Message, state: FSMContext) -> None:
    username = (message.text or "").strip()
    if not username or " " in username:
        await message.answer("Ник не должен быть пустым и без пробелов. Попробуй ещё 🙂")
        return

    data = await state.get_data()
    email = data["email"]
    password = data["password"]

    api = APIClient()

    try:
        result: Dict[str, Any] = await api.register(email=email, username=username, password=password)
    except HTTPStatusError as exc:
        logger.warning("Register failed (dialog mode): %s", exc)
        status = exc.response.status_code if exc.response is not None else None
        detail: str = ""
        try:
            body = exc.response.json() if exc.response is not None else {}
            if isinstance(body, dict):
                detail = str(body.get("detail") or "")
        except Exception:
            detail = ""

        if status == 422:
            text = (
                "Не удалось зарегистрироваться 😔\n\n"
                "Проверь, что:\n"
                "• email в формате name@example.com\n"
                "• пароль не короче 8 символов\n"
                "• никнейм без пробелов\n\n"
                "Попробуй ещё раз с командой /register."
            )
        elif status == 400 and detail == "Email already registered":
            text = (
                "Этот email уже зарегистрирован 🔐\n"
                "Попробуй войти через /login или используй другой email."
            )
        elif status == 400 and detail == "Username already taken":
            text = "Такой ник уже занят. Попробуй другой 🙂"
        else:
            text = (
                "Не удалось зарегистрироваться 😔\n"
                "Проверь введённые данные и попробуй ещё раз с командой /register."
            )

        await message.answer(text, reply_markup=_main_menu_keyboard())
        await state.clear()
        return

    user = result.get("user") or {}

    await save_tokens_for_telegram_user(
        telegram_user_id=message.from_user.id,
        user_id=user.get("id"),
        access_token=result.get("access_token", ""),
        refresh_token=result.get("refresh_token"),
    )

    await state.clear()
    await message.answer(
        "Готово! 🎉\n"
        f"Ты зарегистрирован как <b>{user.get('username') or user.get('email')}</b>.\n\n"
        "Теперь можно смотреть баланс, цели и проходить квизы прямо здесь.\n"
        "Выбери, с чего начнём 👇",
        reply_markup=_main_menu_keyboard(),
    )


@router.message(Command("login"))
async def cmd_login(message: Message, state: FSMContext) -> None:
    """
    Вход в существующий аккаунт: пошагово спрашиваем email и пароль.
    Если переданы аргументы, используем быстрый режим: /login email пароль
    """
    parts = _parse_args(message)
    if len(parts) >= 3:
        _, email, password = parts[:3]
        api = APIClient()
        try:
            data: Dict[str, Any] = await api.login(email=email, password=password)
        except HTTPStatusError as exc:
            status = exc.response.status_code if exc.response is not None else None
            if status in (400, 401):
                await message.answer("Неверный email или пароль 😔")
            else:
                logger.exception("Login failed (fast mode): %s", exc)
                await message.answer("Произошла ошибка при входе. Попробуй позже.")
            return

        user = data.get("user") or {}

        await save_tokens_for_telegram_user(
            telegram_user_id=message.from_user.id,
            user_id=user.get("id"),
            access_token=data.get("access_token", ""),
            refresh_token=data.get("refresh_token"),
        )

        await state.clear()
        await message.answer(
            "Успешный вход ✅\n"
            f"Привет, <b>{user.get('username') or user.get('email')}</b>!\n\n"
            "Теперь ты можешь использовать команды /balance, /goals, /quiz, /daily.",
            reply_markup=_main_menu_keyboard(),
        )
        return

    await state.set_state(Login.waiting_for_email)
    await message.answer(
        "Вход в аккаунт 🔐\n\n"
        "1️⃣ Введи email, который ты использовал на платформе.",
        reply_markup=ReplyKeyboardRemove(),
    )


@router.message(Login.waiting_for_email)
async def process_login_email(message: Message, state: FSMContext) -> None:
    email = (message.text or "").strip()
    if "@" not in email or "." not in email:
        await message.answer("Это не похоже на email. Попробуй ещё раз 🙂")
        return

    await state.update_data(email=email)
    await state.set_state(Login.waiting_for_password)
    await message.answer("2️⃣ Теперь введи пароль от аккаунта.")


@router.message(Login.waiting_for_password)
async def process_login_password(message: Message, state: FSMContext) -> None:
    password = (message.text or "").strip()
    if not password:
        await message.answer("Пароль не может быть пустым. Попробуй ещё раз 🙂")
        return

    data = await state.get_data()
    email = data["email"]

    api = APIClient()

    try:
        result: Dict[str, Any] = await api.login(email=email, password=password)
    except HTTPStatusError as exc:
        status = exc.response.status_code if exc.response is not None else None
        if status in (400, 401):
            await message.answer("Неверный email или пароль 😔")
        else:
            logger.exception("Login failed (dialog mode): %s", exc)
            await message.answer("Произошла ошибка при входе. Попробуй позже.")
        await state.clear()
        return

    user = result.get("user") or {}

    await save_tokens_for_telegram_user(
        telegram_user_id=message.from_user.id,
        user_id=user.get("id"),
        access_token=result.get("access_token", ""),
        refresh_token=result.get("refresh_token"),
    )

    await state.clear()
    await message.answer(
        "Успешный вход ✅\n"
        f"Привет, <b>{user.get('username') or user.get('email')}</b>!\n\n"
        "Теперь ты можешь использовать команды /balance, /goals, /quiz, /daily.\n"
        "Выбери действие на клавиатуре ниже 👇",
        reply_markup=_main_menu_keyboard(),
    )


@router.message(Command("link"))
async def cmd_link(message: Message, state: FSMContext) -> None:
    """
    Привязка существующего аккаунта = тот же /login.
    """
    await cmd_login(message, state)


@router.message(Command("logout"))
async def cmd_logout(message: Message, state: FSMContext) -> None:
    """
    Простой logout: токены в БД обнуляются.
    """
    from sqlalchemy import select
    from app.services.database import AsyncSessionLocal
    from app.models import TelegramSession

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(TelegramSession).where(TelegramSession.telegram_user_id == message.from_user.id)
        )
        tg_session: Optional[TelegramSession] = result.scalar_one_or_none()
        if not tg_session:
            await message.answer("Ты ещё не вошёл в аккаунт.")
            return

        tg_session.access_token = None
        tg_session.refresh_token = None
        await session.commit()

    await state.clear()
    await message.answer(
        "Ты вышел из аккаунта в боте. До встречи! 👋",
        reply_markup=_main_menu_keyboard(),
    )


# -------- Кнопки главного меню --------


@router.message(F.text == "📊 Баланс")
async def menu_balance(message: Message) -> None:
    await finance_handlers.cmd_balance(message)


@router.message(F.text == "🎯 Цели")
async def menu_goals(message: Message) -> None:
    await finance_handlers.cmd_goals(message)


@router.message(F.text == "📑 Бюджет")
async def menu_budget(message: Message, state: FSMContext) -> None:
    await finance_handlers.cmd_budget(message, state)


@router.message(F.text == "➕ Пополнить")
async def menu_topup(message: Message, state: FSMContext) -> None:
    await finance_handlers.cmd_topup_start(message, state)


@router.message(F.text == "➖ Потратить")
async def menu_spend(message: Message, state: FSMContext) -> None:
    await finance_handlers.cmd_spend_start(message, state)


@router.message(F.text == "🧠 Квизы")
async def menu_quizzes(message: Message, state: FSMContext) -> None:
    await education_handlers.cmd_quiz(message, state)


@router.message(F.text == "🔥 Daily")
async def menu_daily(message: Message) -> None:
    await gamification_handlers.cmd_daily(message)


@router.message(F.text == "📈 Прогресс")
async def menu_progress(message: Message) -> None:
    await gamification_handlers.cmd_progress(message)


@router.message(F.text == "🏆 Достижения")
async def menu_achievements(message: Message) -> None:
    await gamification_handlers.cmd_achievements(message)


@router.message(F.text == "🎖 Бейджи")
async def menu_badges(message: Message) -> None:
    await gamification_handlers.cmd_badges(message)


@router.message(F.text == "🛡 Антискам")
async def menu_antiscam(message: Message) -> None:
    await antiscam_handlers.cmd_antiscam(message)


@router.message(F.text == "📊 Неделя")
async def menu_week(message: Message) -> None:
    await gamification_handlers.cmd_week_stats(message)


@router.message(F.text == "📅 Месяц")
async def menu_month(message: Message) -> None:
    await gamification_handlers.cmd_month_stats(message)


@router.message(F.text == "🏠 Главное меню")
async def menu_home(message: Message, state: FSMContext) -> None:
    """Обработчик кнопки 'Главное меню' - возвращает главное меню и очищает состояние"""
    await state.clear()
    await message.answer(
        "🏠 <b>Главное меню</b>\n\n"
        "Выбери действие из меню ниже 👇",
        reply_markup=_main_menu_keyboard(),
    )


