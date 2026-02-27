import logging
from typing import Any, Dict, List, Optional

from aiogram import F, Router
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import (
    CallbackQuery,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    Message,
)
from httpx import HTTPStatusError

from app.services.api_client import (
    APIClient,
    clear_session_for_telegram_user,
    get_api_client_for_telegram_user,
)

router = Router()
logger = logging.getLogger(__name__)


class QuizState(StatesGroup):
    answering = State()


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
            reply_markup=_main_menu_keyboard(),
        )
    return client


async def _ensure_client_for_callback(callback: CallbackQuery) -> Optional[APIClient]:
    """Проверка авторизации для callback-запросов."""
    if not callback.message:
        return None
    client = await get_api_client_for_telegram_user(callback.from_user.id)
    if client is None:
        await callback.answer("Ты ещё не авторизован. Войди через /login.", show_alert=True)
        await callback.message.answer(
            "Ты ещё не авторизован в боте.\n"
            "Сначала выполни <b>/login email пароль</b> или <b>/register</b>.",
            reply_markup=_main_menu_keyboard(),
        )
    return client


def _quiz_list_keyboard(quizzes: List[Dict[str, Any]]) -> InlineKeyboardMarkup:
    buttons: List[List[InlineKeyboardButton]] = []
    for q in quizzes:
        quiz_id = q.get("id")
        title = q.get("title")
        buttons.append(
            [
                InlineKeyboardButton(
                    text=f"#{quiz_id} {title} ({q.get('difficulty')})",
                    callback_data=f"quiz_start:{quiz_id}",
                )
            ]
        )
    return InlineKeyboardMarkup(inline_keyboard=buttons)


async def _send_quiz_question(
    chat_id: int,
    message: Message,
    quiz_id: int,
    question_index: int,
    questions: List[Dict[str, Any]],
) -> None:
    if question_index >= len(questions):
        return

    q = questions[question_index]
    q_id = q.get("id")
    text = q.get("question") or "Вопрос"
    options: List[str] = q.get("options") or []

    buttons: List[List[InlineKeyboardButton]] = []
    for idx, opt in enumerate(options):
        buttons.append(
            [
                InlineKeyboardButton(
                    text=opt,
                    callback_data=f"quiz_ans:{quiz_id}:{question_index}:{idx}:{q_id}",
                )
            ]
        )

    kb = InlineKeyboardMarkup(inline_keyboard=buttons)

    await message.answer(
        f"<b>Вопрос {question_index + 1}/{len(questions)}</b>\n\n{text}",
        reply_markup=kb,
    )


@router.message(Command("quiz"))
async def cmd_quiz(message: Message, state: FSMContext) -> None:
    """
    /quiz — список квизов с кнопками
    /quiz id — прохождение конкретного квиза
    """
    parts = (message.text or "").split()

    client = await _ensure_client(message)
    if client is None:
        return

    # /quiz id -> сразу запускаем прохождение (только если это команда, а не кнопка)
    if len(parts) == 2 and parts[0] == "/quiz":
        try:
            quiz_id = int(parts[1])
        except ValueError:
            await message.answer("id квиза должен быть числом, пример: <code>/quiz 1</code>")
            return

        try:
            quiz: Dict[str, Any] = await client.get_quiz_details(quiz_id=quiz_id)
        except HTTPStatusError as exc:
            logger.warning("Quiz details failed: %s", exc)
            await message.answer("Не удалось получить информацию о квизе.")
            return

        questions: List[Dict[str, Any]] = quiz.get("questions") or []
        if not questions:
            await message.answer("У этого квиза пока нет вопросов.")
            return

        await state.set_state(QuizState.answering)
        await state.update_data(
            quiz_id=quiz_id,
            questions=questions,
            answers=[],
        )

        await message.answer(
            f"<b>Квиз: {quiz.get('title')}</b>\n"
            f"Сложность: {quiz.get('difficulty')}\n"
            f"Награда: {quiz.get('xp_reward', 0)} XP\n\n"
            "Отвечай на вопросы, нажимая на кнопки с вариантами ответов.",
        )

        await _send_quiz_question(
            chat_id=message.chat.id,
            message=message,
            quiz_id=quiz_id,
            question_index=0,
            questions=questions,
        )
        return

    # Иначе — список квизов
    try:
        quizzes: List[Dict[str, Any]] = await client.get_quizzes()
    except HTTPStatusError as exc:
        status = exc.response.status_code if exc.response is not None else None
        logger.warning("Quizzes list failed: %s", exc)
        if status == 401:
            await clear_session_for_telegram_user(message.from_user.id)
            await message.answer("Сессия истекла. Войди через /login, чтобы видеть квизы.", reply_markup=_main_menu_keyboard())
        else:
            await message.answer("Не удалось получить список квизов.", reply_markup=_main_menu_keyboard())
        return

    if not quizzes:
        await message.answer("Квизы пока недоступны. Загляни позже!", reply_markup=_main_menu_keyboard())
        return

    # Сначала показываем список квизов текстом
    lines: List[str] = ["<b>📚 Доступные квизы:</b>", ""]
    for q in quizzes:
        lines.append(
            f"#{q.get('id')} — <b>{q.get('title')}</b>\n"
            f"   Сложность: {q.get('difficulty')}\n"
            f"   Награда: {q.get('xp_reward', 0)} XP\n",
        )

    await message.answer("\n".join(lines), reply_markup=_main_menu_keyboard())
    
    # Затем показываем сообщение с кнопками для выбора
    await message.answer(
        "👇 <b>Выбери квиз, который хочешь пройти:</b>",
        reply_markup=_quiz_list_keyboard(quizzes),
    )


@router.callback_query(F.data.startswith("quiz_start:"))
async def quiz_start(callback: CallbackQuery, state: FSMContext) -> None:
    if not callback.message:
        await callback.answer("Ошибка: сообщение не найдено.", show_alert=True)
        return

    try:
        quiz_id = int(callback.data.split(":", 1)[1])
    except (ValueError, AttributeError):
        await callback.answer("Некорректный квиз.", show_alert=True)
        return

    # Проверяем авторизацию через специальную функцию для callback
    client = await _ensure_client_for_callback(callback)
    if client is None:
        return

    try:
        quiz: Dict[str, Any] = await client.get_quiz_details(quiz_id=quiz_id)
    except HTTPStatusError as exc:
        status = exc.response.status_code if exc.response is not None else None
        logger.warning("Quiz details failed: %s", exc)
        if status == 401:
            await clear_session_for_telegram_user(callback.from_user.id)
            await callback.answer("Сессия истекла. Войди через /login и запусти квиз снова.", show_alert=True)
            await callback.message.answer(
                "Сессия истекла. Войди через /login и запусти квиз снова.",
                reply_markup=_main_menu_keyboard(),
            )
        else:
            await callback.answer("Не удалось получить информацию о квизе.", show_alert=True)
            await callback.message.answer(
                "Не удалось получить информацию о квизе.",
                reply_markup=_main_menu_keyboard(),
            )
        return

    questions: List[Dict[str, Any]] = quiz.get("questions") or []
    if not questions:
        await callback.answer("У этого квиза пока нет вопросов.", show_alert=True)
        await callback.message.answer(
            "У этого квиза пока нет вопросов.",
            reply_markup=_main_menu_keyboard(),
        )
        return

    await state.set_state(QuizState.answering)
    await state.update_data(
        quiz_id=quiz_id,
        questions=questions,
        answers=[],
    )

    await callback.answer(f"Начинаем квиз: {quiz.get('title')}")

    await callback.message.answer(
        f"<b>Квиз: {quiz.get('title')}</b>\n"
        f"Сложность: {quiz.get('difficulty')}\n"
        f"Награда: {quiz.get('xp_reward', 0)} XP\n\n"
        "Отвечай на вопросы, нажимая на кнопки с вариантами ответов.",
        reply_markup=_main_menu_keyboard(),
    )

    await _send_quiz_question(
        chat_id=callback.message.chat.id,
        message=callback.message,
        quiz_id=quiz_id,
        question_index=0,
        questions=questions,
    )


@router.callback_query(F.data.startswith("quiz_ans:"))
async def quiz_answer(callback: CallbackQuery, state: FSMContext) -> None:
    if not callback.message:
        return

    parts = (callback.data or "").split(":")
    if len(parts) != 5:
        await callback.answer("Некорректный ответ.", show_alert=True)
        return

    _, quiz_id_str, q_index_str, opt_index_str, q_id_str = parts

    try:
        quiz_id = int(quiz_id_str)
        question_index = int(q_index_str)
        option_index = int(opt_index_str)
        question_id = int(q_id_str)
    except ValueError:
        await callback.answer("Некорректные данные ответа.", show_alert=True)
        return

    data = await state.get_data()
    state_quiz_id = data.get("quiz_id")
    questions: List[Dict[str, Any]] = data.get("questions") or []
    answers: List[Dict[str, Any]] = data.get("answers") or []

    if state_quiz_id != quiz_id or question_index >= len(questions):
        await callback.answer("Сессия квиза устарела. Попробуй /quiz снова.", show_alert=True)
        await state.clear()
        return

    question = questions[question_index]
    options: List[str] = question.get("options") or []
    if option_index >= len(options):
        await callback.answer("Некорректный вариант ответа.", show_alert=True)
        return

    selected_answer = options[option_index]
    # API ожидает индекс ответа (int), а не текст
    answers.append({"question_id": question_id, "answer": option_index})

    await state.update_data(answers=answers)

    # Редактируем сообщение с вопросом, показывая только выбранный ответ
    question_text = question.get("question") or "Вопрос"
    try:
        await callback.message.edit_text(
            f"<b>Вопрос {question_index + 1}/{len(questions)}</b>\n\n{question_text}\n\n"
            f"✅ <b>Твой ответ:</b> {selected_answer}",
            reply_markup=None,  # Убираем все кнопки
        )
    except Exception as e:
        logger.warning("Failed to edit message: %s", e)
        # Если не удалось отредактировать, просто показываем следующий вопрос

    await callback.answer("Ответ принят ✅")

    next_index = question_index + 1

    if next_index < len(questions):
        # Показываем следующий вопрос
        await _send_quiz_question(
            chat_id=callback.message.chat.id,
            message=callback.message,
            quiz_id=quiz_id,
            question_index=next_index,
            questions=questions,
        )
        return

    # Все ответы собраны — последний вопрос уже отредактирован выше
    # Отправляем на проверку
    client = await _ensure_client_for_callback(callback)
    if client is None:
        await state.clear()
        return

    try:
        result = await client.submit_quiz(quiz_id=quiz_id, answers=answers)
    except HTTPStatusError as exc:
        status = exc.response.status_code if exc.response is not None else None
        logger.warning("Quiz submit failed: %s", exc)
        if status == 401:
            await clear_session_for_telegram_user(callback.from_user.id)
            await callback.answer("Сессия истекла. Войди через /login и повтори квиз.", show_alert=True)
            await callback.message.answer(
                "Сессия истекла. Войди через /login и повтори квиз.",
                reply_markup=_main_menu_keyboard(),
            )
        else:
            await callback.answer("Не удалось отправить ответы. Попробуй пройти квиз позже.", show_alert=True)
            await callback.message.answer(
                "Не удалось отправить ответы. Попробуй пройти квиз позже.",
                reply_markup=_main_menu_keyboard(),
            )
        await state.clear()
        return

    score = result.get("score", 0)
    xp_earned = result.get("xp_earned", 0)
    correct_answers = result.get("correct_answers", 0)
    total_questions = result.get("total_questions", 0)
    completed = result.get("completed", False)
    feedback = result.get("feedback", "")
    badge_earned = result.get("badge_earned")  # строка с названием бейджа

    lines: List[str] = [
        "<b>Результат квиза</b> ✅",
        f"Правильных ответов: <b>{correct_answers}/{total_questions}</b>",
        f"Очки: <b>{score}%</b>",
    ]
    if xp_earned:
        lines.append(f"Получено опыта: <b>{xp_earned}</b> XP")
    
    if completed:
        lines.append("\n✅ <b>Квиз пройден!</b>")
    else:
        lines.append("\n⏳ <b>Квиз не пройден</b> (нужно 70% или больше)")
    
    if feedback:
        lines.append(f"\n{feedback}")
    
    if badge_earned:
        lines.append(f"\n🏅 <b>Получен бейдж:</b> {badge_earned}")

    await callback.message.answer("\n".join(lines), reply_markup=_main_menu_keyboard())
    await state.clear()
    await callback.answer("Квиз завершён ✅")


LESSONS: Dict[str, str] = {
    "budget": (
        "<b>Мини-урок: Что такое бюджет?</b>\n\n"
        "Бюджет — это план твоих доходов и расходов на период.\n"
        "1) Запиши, сколько денег ты получаешь.\n"
        "2) Реши, сколько пойдёт на обязательные траты, а сколько — на цели и развлечения.\n"
        "3) Всегда оставляй место для накоплений (10–20% от дохода)."
    ),
    "savings": (
        "<b>Мини-урок: Накопления</b>\n\n"
        "Накопления — это деньги, которые ты откладываешь на будущее.\n"
        "Лучше всего копить регулярно и автоматически, сразу после получения дохода.\n"
        "Цель: сначала отложить “подушку безопасности”, потом — на крупные покупки."
    ),
    "antiscam": (
        "<b>Мини-урок: Антискам</b>\n\n"
        "Мошенники часто обещают быстрые и лёгкие деньги без риска.\n"
        "Не верь предложениям “гарантированного дохода” и никогда не сообщай коды из SMS.\n"
        "Если сомневаешься — всегда советуйся с родителями или учителем."
    ),
}

TERMS: Dict[str, str] = {
    "бюджет": "Бюджет — это план твоих доходов и расходов на определённый период.",
    "доход": "Доход — это все деньги, которые ты получаешь: карманные, подработки, подарки.",
    "расход": "Расход — это все деньги, которые ты тратишь: покупки, развлечения, подписки.",
    "накопления": "Накопления — деньги, которые ты откладываешь на будущее или цель.",
    "инфляция": "Инфляция — это когда со временем на те же деньги можно купить меньше товаров.",
}


@router.message(Command("lessons"))
async def cmd_lessons(message: Message) -> None:
    await message.answer(
        "<b>Мини-уроки</b> 📚\n\n"
        "Доступные темы:\n"
        "• /lesson budget — Что такое бюджет\n"
        "• /lesson savings — Накопления\n"
        "• /lesson antiscam — Антискам\n",
    )


@router.message(Command("lesson"))
async def cmd_lesson(message: Message) -> None:
    parts = (message.text or "").split()
    if len(parts) < 2:
        await message.answer(
            "Использование:\n"
            "<code>/lesson budget</code> — урок про бюджет\n"
            "<code>/lesson savings</code> — урок про накопления\n"
            "<code>/lesson antiscam</code> — урок про безопасность",
        )
        return

    key = parts[1].lower()
    lesson = LESSONS.get(key)
    if not lesson:
        await message.answer("Такой темы урока нет. Посмотри доступные темы через /lessons.")
        return

    await message.answer(lesson)


@router.message(Command("terms"))
async def cmd_terms(message: Message) -> None:
    lines = ["<b>Словарь терминов</b> 📖"]
    for term in TERMS.keys():
        lines.append(f"• /term {term}")
    await message.answer("\n".join(lines))


@router.message(Command("term"))
async def cmd_term(message: Message) -> None:
    parts = (message.text or "").split(maxsplit=1)
    if len(parts) < 2:
        await message.answer(
            "Использование:\n"
            "<code>/term бюджет</code>\n"
            "<code>/term накопления</code>",
        )
        return

    key = parts[1].strip().lower()
    desc = TERMS.get(key)
    if not desc:
        await message.answer("Такого термина пока нет в словаре. Попробуй другой.")
        return

    await message.answer(f"<b>{key.capitalize()}</b>\n\n{desc}")


@router.message(Command("tip"))
async def cmd_tip(message: Message) -> None:
    await message.answer(
        "💡 <b>Финансовый совет дня</b>\n\n"
        "Всегда откладывай хотя бы 10–20% от любого дохода.\n"
        "Даже небольшие суммы со временем превращаются в серьёзный капитал.",
    )


