import os
import json
from typing import List
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+psycopg2://postgres:password@postgres:5432/inventory_db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    ALLOWED_HOSTS: List[str] = json.loads(os.getenv("ALLOWED_HOSTS", '["*"]'))

settings = Settings() 