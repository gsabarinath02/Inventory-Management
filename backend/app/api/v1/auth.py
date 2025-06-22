from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from ...schemas.user import User, UserCreate, UserLogin
from ...schemas.token import Token
from ...core.crud.user import create_user, get_user_by_email, get_users, authenticate_user
from ...core.security import create_access_token, verify_password
from ...api.deps import get_db, require_admin, get_current_user
from ...config import settings
from datetime import timedelta

router = APIRouter()

@router.post("/signup", response_model=User, status_code=status.HTTP_201_CREATED)
async def signup(user: UserCreate, db: AsyncSession = Depends(get_db), admin = Depends(require_admin)):
    db_user = await get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return await create_user(db=db, user=user)

@router.post("/login", response_model=Token)
async def login_for_access_token(login_data: UserLogin, db: AsyncSession = Depends(get_db)):
    print("--- Login attempt started ---")
    print(f"Attempting login for email: {login_data.email}")
    
    user = await get_user_by_email(db, email=login_data.email)
    print(f"User found in DB: {'Yes' if user else 'No'}")

    if not user:
        print("--- Login failed: User not found ---")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    password_verified = verify_password(login_data.password, user.password_hash)
    print(f"Password verification result: {password_verified}")

    if not password_verified:
        print("--- Login failed: Incorrect password ---")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    print("User authenticated successfully. Creating access token...")
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role}
    )
    print("--- Access token created. Login successful. ---")
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user 