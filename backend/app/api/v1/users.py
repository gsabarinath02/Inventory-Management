from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from ...schemas.user import User, UserUpdate
from ...core.crud.user import get_users, get_user, update_user, delete_user
from ...api.deps import get_db, require_admin

router = APIRouter()

@router.get("/", response_model=List[User])
async def read_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    admin = Depends(require_admin)
):
    users = await get_users(db, skip=skip, limit=limit)
    return users

@router.get("/{user_id}", response_model=User)
async def read_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin = Depends(require_admin)
):
    user = await get_user(db, user_id=user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/{user_id}", response_model=User)
async def update_user_endpoint(
    user_id: int,
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db),
    admin = Depends(require_admin)
):
    user = await update_user(db=db, user_id=user_id, user_update=user_in)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.delete("/{user_id}", response_model=User)
async def delete_user_endpoint(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin = Depends(require_admin)
):
    user = await get_user(db, user_id=user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    await delete_user(db=db, user_id=user_id)
    return user 