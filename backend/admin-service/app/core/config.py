from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Service
    SERVICE_NAME: str = "admin-service"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    
    # Database
    DATABASE_URL: str = "postgresql://fintech_user:fintech_pass@postgres:5432/fintech_db"
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:8000"
    
    # Other services
    USER_SERVICE_URL: str = "http://user-service:8000"
    GAME_SERVICE_URL: str = "http://game-service:8000"
    PROGRESS_SERVICE_URL: str = "http://progress-service:8000"
    EDUCATION_SERVICE_URL: str = "http://education-service:8000"
    ANALYTICS_SERVICE_URL: str = "http://analytics-service:8000"
    
    # Admin
    ADMIN_SECRET_KEY: str = "admin-secret-key-change-in-production"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(',')]


settings = Settings()
