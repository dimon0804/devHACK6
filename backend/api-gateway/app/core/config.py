from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    AUTH_SERVICE_URL: str = "http://auth-service:8000"
    USER_SERVICE_URL: str = "http://user-service:8000"
    GAME_SERVICE_URL: str = "http://game-service:8000"
    PROGRESS_SERVICE_URL: str = "http://progress-service:8000"
    EDUCATION_SERVICE_URL: str = "http://education-service:8000"
    ADMIN_SERVICE_URL: str = "http://admin-service:8000"
    ANALYTICS_SERVICE_URL: str = "http://analytics-service:8000"
    REDIS_URL: str = "redis://redis:6379"
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:8000"
    ENVIRONMENT: str = "development"
    REQUEST_TIMEOUT: float = 30.0

    class Config:
        env_file = ".env"
        case_sensitive = True

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS_ORIGINS string into a list"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(',')]


settings = Settings()
