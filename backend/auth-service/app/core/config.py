from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    DATABASE_URL: str
    REDIS_URL: str = "redis://localhost:6379"
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
