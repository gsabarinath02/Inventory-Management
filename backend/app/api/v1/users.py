from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from ...database import get_db
from ...api.deps import require_admin, get_current_user
from ...schemas.user import User, UserCreate, UserUpdate
from ...core.crud.user import create_user, get_users, get_user, update_user, delete_user
from ...core.crud.audit_log import create_audit_log
from ...schemas.audit_log import AuditLogCreate
from ...core.logging_context import current_user_var
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_new_user_route(
    user: UserCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create a new user (admin only)"""
    # Set user context for audit logging
    current_user_var.set(current_user)
    
    try:
        created_user = await create_user(db=db, user=user)
        await create_audit_log(
            db,
            AuditLogCreate(
                user_id=current_user.id,
                username=current_user.email,
                action="CREATE",
                entity="User",
                entity_id=created_user.id,
                field_changed="user",
                new_value=f"Created user: {created_user.email}"
            )
        )
        return created_user
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[User])
async def read_users_route(
    skip: int = 0, 
    limit: int = 100, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get all users (admin only)"""
    try:
        users = await get_users(db, skip=skip, limit=limit)
        return users
    except Exception as e:
        logger.error(f"Error fetching users: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{user_id}", response_model=User)
async def read_user_route(
    user_id: int, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get a specific user by ID (admin only)"""
    try:
        user = await get_user(db, user_id=user_id)
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{user_id}", response_model=User)
async def update_existing_user_route(
    user_id: int, 
    user: UserUpdate, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update an existing user (admin only)"""
    # Set user context for audit logging
    current_user_var.set(current_user)
    
    try:
        old_user = await get_user(db, user_id=user_id)
        updated_user = await update_user(db, user_id=user_id, user_update=user)
        if updated_user is None:
            raise HTTPException(status_code=404, detail="User not found")
        
        await create_audit_log(
            db,
            AuditLogCreate(
                user_id=current_user.id,
                username=current_user.email,
                action="UPDATE",
                entity="User",
                entity_id=user_id,
                field_changed="user",
                old_value=f"Updated user: {old_user.email if old_user else 'Unknown'}",
                new_value=f"Updated user: {updated_user.email}"
            )
        )
        return updated_user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_user_route(
    user_id: int, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete an existing user (admin only)"""
    # Set user context for audit logging
    current_user_var.set(current_user)
    
    try:
        user_to_delete = await get_user(db, user_id=user_id)
        if user_to_delete is None:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Prevent admin from deleting themselves
        if user_to_delete.id == current_user.id:
            raise HTTPException(status_code=400, detail="Cannot delete your own account")
        
        success = await delete_user(db, user_id=user_id)
        if not success:
            raise HTTPException(status_code=404, detail="User not found")
        
        await create_audit_log(
            db,
            AuditLogCreate(
                user_id=current_user.id,
                username=current_user.email,
                action="DELETE",
                entity="User",
                entity_id=user_id,
                field_changed="user",
                old_value=f"Deleted user: {user_to_delete.email}",
                new_value=None
            )
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e)) 