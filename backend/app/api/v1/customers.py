from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from ...database import get_db
from ...api.deps import require_admin
from ...core.crud.customer import (
    create_customer, get_customer, get_customers, update_customer, 
    delete_customer, get_customer_names, get_customer_by_store_name
)
from ...core.crud.audit_log import create_audit_log
from ...schemas.customer import Customer, CustomerCreate, CustomerUpdate
from ...schemas.audit_log import AuditLogCreate
import logging

router = APIRouter()

@router.post("/", response_model=Customer)
async def create_new_customer(
    customer: CustomerCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_admin)
):
    """Create a new customer (Admin only)."""
    try:
        # Check if store name already exists
        existing_customer = await get_customer_by_store_name(db, customer.store_name)
        if existing_customer:
            raise HTTPException(status_code=400, detail="Store name already exists")
        created_customer = await create_customer(db, customer)
        await create_audit_log(
            db,
            AuditLogCreate(
                user_id=current_user.id,
                username=current_user.email,
                action="CREATE",
                entity="Customer",
                entity_id=created_customer.id,
                field_changed="customer",
                new_value=f"Created customer: {created_customer.store_name}"
            )
        )
        return created_customer
    except Exception as e:
        print(f"[ERROR] Failed to create customer. Data: {customer.dict()} Error: {e}")
        raise

@router.get("/", response_model=List[Customer])
async def read_customers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_admin)
):
    """Get all customers with pagination and search (Admin only)."""
    customers = await get_customers(db, skip=skip, limit=limit, search=search)
    return customers

@router.get("/names", response_model=List[str])
async def read_customer_names(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_admin)
):
    """Get all customer store names for dropdown (Admin only)."""
    return await get_customer_names(db)

@router.get("/{customer_id}", response_model=Customer)
async def read_customer(
    customer_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_admin)
):
    """Get a specific customer by ID (Admin only)."""
    customer = await get_customer(db, customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.put("/{customer_id}", response_model=Customer)
async def update_existing_customer(
    customer_id: int,
    customer_update: CustomerUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_admin)
):
    """Update a customer (Admin only)."""
    try:
        # Check if customer exists
        existing_customer = await get_customer(db, customer_id)
        if existing_customer is None:
            raise HTTPException(status_code=404, detail="Customer not found")
        # If store name is being updated, check for duplicates
        if customer_update.store_name:
            duplicate_customer = await get_customer_by_store_name(db, customer_update.store_name)
            if duplicate_customer and duplicate_customer.id != customer_id:
                raise HTTPException(status_code=400, detail="Store name already exists")
        updated_customer = await update_customer(db, customer_id, customer_update)
        if updated_customer is None:
            raise HTTPException(status_code=404, detail="Customer not found")
        await create_audit_log(
            db,
            AuditLogCreate(
                user_id=current_user.id,
                username=current_user.email,
                action="UPDATE",
                entity="Customer",
                entity_id=customer_id,
                field_changed="customer",
                old_value=f"Old: {existing_customer.store_name}",
                new_value=f"Updated: {updated_customer.store_name}"
            )
        )
        return updated_customer
    except Exception as e:
        print(f"[ERROR] Failed to update customer. ID: {customer_id} Data: {customer_update.dict()} Error: {e}")
        raise

@router.delete("/{customer_id}")
async def delete_existing_customer(
    customer_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_admin)
):
    """Delete a customer (Admin only)."""
    try:
        # Check if customer exists
        existing_customer = await get_customer(db, customer_id)
        if existing_customer is None:
            raise HTTPException(status_code=404, detail="Customer not found")
        success = await delete_customer(db, customer_id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete customer")
        await create_audit_log(
            db,
            AuditLogCreate(
                user_id=current_user.id,
                username=current_user.email,
                action="DELETE",
                entity="Customer",
                entity_id=customer_id,
                field_changed="customer",
                old_value=f"Deleted customer: {existing_customer.store_name}",
                new_value=None
            )
        )
        return {"message": "Customer deleted successfully"}
    except Exception as e:
        print(f"[ERROR] Failed to delete customer. ID: {customer_id} Error: {e}")
        raise 