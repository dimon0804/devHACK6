from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)

# Отключаем проверку ForeignKey на уровне SQLAlchemy для целей
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_conn, connection_record):
    # Для PostgreSQL это не нужно, но оставляем для совместимости
    pass
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
