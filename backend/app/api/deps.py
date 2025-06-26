from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from jose import jwt, JWTError
from datetime import datetime

from ..config import settings
from ..database import get_db
from ..core.crud.user import get_user_by_email
from ..models.user import User as UserModel
from ..schemas.user import User as UserSchema

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> UserModel:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str | None = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await get_user_by_email(db, email=email)
    if user is None:
        raise credentials_exception
    return user

def require_admin(current_user: UserModel = Depends(get_current_user)):
    """Dependency to require admin role."""
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admins only")
    return current_user

def require_manager_or_admin(current_user: UserModel = Depends(get_current_user)):
    """Dependency to require manager or admin role."""
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admins or managers only")
    return current_user

async def get_current_user_for_testing(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    """Temporary authentication bypass for testing - returns a mock admin user"""
    # Create a mock admin user for testing
    mock_user = UserSchema(
        id=1,
        email="admin@fashionstore.com",
        name="Admin User",
        role="admin",
        created_at=datetime.utcnow()
    )
    return mock_user

# Re-export the database dependency
__all__ = ["get_db", "get_current_user", "require_admin", "require_manager_or_admin"] 