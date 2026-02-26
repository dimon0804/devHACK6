from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    AUTH_SERVICE_URL: str = "http://auth-service:8000"
    USER_SERVICE_URL: str = "http://user-service:8000"
    GAME_SERVICE_URL: str = "http://game-service:8000"
    PROGRESS_SERVICE_URL: str = "http://progress-service:8000"
    EDUCATION_SERVICE_URL: str = "http://education-service:8000"
    REDIS_URL: str = "redis://redis:6379"
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]
    ENVIRONMENT: str = "development"
    REQUEST_TIMEOUT: float = 30.0

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
