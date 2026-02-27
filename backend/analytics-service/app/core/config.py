from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Service
    SERVICE_NAME: str = "analytics-service"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    
    # Database
    DATABASE_URL: str = "postgresql://fintech_user:fintech_pass@postgres:5432/fintech_db"
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:8000"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(',')]


settings = Settings()
