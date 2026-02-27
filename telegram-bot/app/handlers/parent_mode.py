from aiogram import Router
from aiogram.filters import Command
from aiogram.types import Message

router = Router()


@router.message(Command("parent"))
async def cmd_parent(message: Message) -> None:
    # Для MVP просто даём ссылку на веб-версию.
    await message.answer(
        "Родительский режим пока доступен только в веб-версии платформы 👨‍👩‍👧\n"
        "Здесь позже появится краткая статистика ребёнка и рекомендации.",
    )


@router.message(Command("parent_settings"))
async def cmd_parent_settings(message: Message) -> None:
    await message.answer(
        "Настройки уведомлений для родителей появятся позже.\n"
        "Сейчас все основные уведомления приходят самому пользователю.",
    )


