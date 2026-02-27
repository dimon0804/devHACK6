import asyncio
import logging
import os

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode

from app.handlers import antiscam, auth, education, finance, gamification, parent_mode
from app.services.database import init_db


async def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )

    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        raise RuntimeError("TELEGRAM_BOT_TOKEN is not set")

    await init_db()

    bot = Bot(token=token, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    dp = Dispatcher()

    # Регистрируем все роутеры
    dp.include_router(auth.router)
    dp.include_router(finance.router)
    dp.include_router(education.router)
    dp.include_router(gamification.router)
    dp.include_router(parent_mode.router)
    dp.include_router(antiscam.router)

    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())


