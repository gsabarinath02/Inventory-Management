from sqlalchemy.orm import Session
from ..database import SessionLocal

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Re-export the database dependency
__all__ = ["get_db"] 