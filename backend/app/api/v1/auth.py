from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from ...schemas.user import User, UserCreate, UserLogin
from ...schemas.token import Token
from ...core.crud.user import create_user, get_user_by_email, get_users, authenticate_user
from ...core.security import create_access_token, verify_password
from ...api.deps import get_db, require_admin, get_current_user
from ...config import settings
from datetime import timedelta
from ...core.crud.audit_log import create_audit_log
from ...schemas.audit_log import AuditLogCreate

router = APIRouter()

@router.post("/signup", response_model=User, status_code=status.HTTP_201_CREATED)
async def signup(user: UserCreate, db: AsyncSession = Depends(get_db), admin = Depends(require_admin)):
    db_user = await get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    created_user = await create_user(db=db, user=user)
    # Audit log for signup
    await create_audit_log(
        db,
        AuditLogCreate(
            user_id=created_user.id,
            username=created_user.email,
            action="SIGNUP",
            entity="User",
            entity_id=created_user.id,
            field_changed=None,
            old_value=None,
            new_value="User signed up"
        )
    )
    return created_user

@router.post("/login", response_model=Token)
async def login_for_access_token(login_data: UserLogin, db: AsyncSession = Depends(get_db)):
    print("--- Login attempt started ---")
    print(f"Attempting login for email: {login_data.email}")
    user = await get_user_by_email(db, email=login_data.email)
    print(f"User found in DB: {'Yes' if user else 'No'}")
    if not user:
        # Audit log for failed login
        await create_audit_log(
            db,
            AuditLogCreate(
                user_id=0,
                username=login_data.email,
                action="LOGIN_FAILED",
                entity="User",
                entity_id=0,
                field_changed=None,
                old_value=None,
                new_value="Login failed: user not found"
            )
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    password_verified = verify_password(login_data.password, user.password_hash)
    print(f"Password verification result: {password_verified}")
    if not password_verified:
        # Audit log for failed login
        await create_audit_log(
            db,
            AuditLogCreate(
                user_id=user.id,
                username=user.email,
                action="LOGIN_FAILED",
                entity="User",
                entity_id=user.id,
                field_changed=None,
                old_value=None,
                new_value="Login failed: incorrect password"
            )
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    print("User authenticated successfully. Creating access token...")
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role}
    )
    print("--- Access token created. Login successful. ---")
    # Audit log for successful login
    await create_audit_log(
        db,
        AuditLogCreate(
            user_id=user.id,
            username=user.email,
            action="LOGIN",
            entity="User",
            entity_id=user.id,
            field_changed=None,
            old_value=None,
            new_value="User logged in"
        )
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user 