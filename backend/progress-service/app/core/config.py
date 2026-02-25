from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    DATABASE_URL: str
    REDIS_URL: str = "redis://localhost:6379"
    USER_SERVICE_URL: str = "http://user-service:8000"
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
