"""
Configuration module for SEYEYA backend
"""
from pydantic_settings import BaseSettings
from pydantic import model_validator
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://seyeya_user:seyeya_password@localhost:5432/seyeya_db"
    DATABASE_SYNC_URL: str = "postgresql://seyeya_user:seyeya_password@localhost:5432/seyeya_db"
    
    # JWT
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"
    
    # Email
    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SEND_FROM_EMAIL: str = "noreply@seyeyacourts.com"
    
    # API
    API_VERSION: str = "v1"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    
    @model_validator(mode="after")
    def validate_database_urls(self) -> 'Settings':
        from urllib.parse import urlparse, parse_qsl, urlencode, urlunparse

        # 1. Clean sync URL (psycopg2)
        sync_url = self.DATABASE_SYNC_URL
        if sync_url.startswith("postgres://"):
            sync_url = sync_url.replace("postgres://", "postgresql://", 1)
        
        parsed_sync = urlparse(sync_url)
        sync_params = dict(parse_qsl(parsed_sync.query))
        
        # Ensure sslmode=require if Neon
        if "neon.tech" in parsed_sync.netloc and "sslmode" not in sync_params:
            sync_params["sslmode"] = "require"
            
        new_sync_query = urlencode(sync_params)
        parsed_sync = parsed_sync._replace(query=new_sync_query)
        self.DATABASE_SYNC_URL = urlunparse(parsed_sync)

        # 2. Clean async URL (asyncpg)
        async_url = self.DATABASE_URL
        if async_url.startswith("postgres://"):
            async_url = async_url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif async_url.startswith("postgresql://"):
            async_url = async_url.replace("postgresql://", "postgresql+asyncpg://", 1)
            
        parsed_async = urlparse(async_url)
        async_params = dict(parse_qsl(parsed_async.query))
        
        # Remove channel_binding (asyncpg does not recognize this parameter)
        if "channel_binding" in async_params:
            async_params.pop("channel_binding")
            
        # Convert sslmode to ssl
        if "sslmode" in async_params:
            async_params["ssl"] = async_params.pop("sslmode")
        elif "neon.tech" in parsed_async.netloc and "ssl" not in async_params:
            async_params["ssl"] = "require"
            
        new_async_query = urlencode(async_params)
        parsed_async = parsed_async._replace(query=new_async_query)
        self.DATABASE_URL = urlunparse(parsed_async)
        
        return self
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


settings = Settings()
