import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Inventory Management System"
    
    # Database URL
    DB_USER: str = os.getenv("DB_USER", "postgres")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "password")
    DB_HOST: str = os.getenv("DB_HOST", "localhost")  # Default to localhost for host scripts
    DB_PORT: str = os.getenv("DB_PORT", "5432")
    DB_NAME: str = os.getenv("DB_NAME", "inventory_db")

    DATABASE_URL: str = f"postgresql+asyncpg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    
    SECRET_KEY: str = os.environ.get("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ALGORITHM: str = "HS256"

    # Admin user credentials for initial setup
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "admin@example.com")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "admin123")

    DEBUG: bool = os.environ.get("DEBUG", "False").lower() in ("true", "1", "t")

    ACTIVITY_LOG_RETENTION_DAYS: int = int(os.getenv("ACTIVITY_LOG_RETENTION_DAYS", 60))

    class Config:
        case_sensitive = True

settings = Settings()
print(f"[DEBUG] Using DATABASE_URL: {settings.DATABASE_URL}") 