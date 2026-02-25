from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# Use connect_args to disable foreign key validation at connection level
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    # PostgreSQL doesn't need special handling, but we ensure metadata doesn't validate FKs
    connect_args={}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
