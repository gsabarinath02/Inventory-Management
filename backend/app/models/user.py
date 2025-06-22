import enum
from sqlalchemy import Column, Integer, String, DateTime, Enum as SAEnum
from sqlalchemy.orm import relationship
from ..database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(SAEnum("admin", "manager", "viewer", name="user_role_enum"), nullable=False, default="viewer")
    created_at = Column(DateTime, default=datetime.utcnow) 