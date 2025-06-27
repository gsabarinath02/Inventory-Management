from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from ...schemas.sales import SalesLog, SalesLogCreate, SalesLogUpdate
from ...core.crud import sales as crud
from ...api import deps
from ...api.deps import get_current_user, require_manager_or_admin
from ...core.crud.audit_log import create_audit_log
from ...schemas.audit_log import AuditLogCreate
from ...core.crud.sales import sa_obj_to_dict, get_sales_log_by_id
import json

router = APIRouter()

@router.get("/{product_id}", response_model=List[SalesLog])
async def read_sales_logs(
    product_id: int,
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    agency_name: Optional[str] = Query(None),
    store_name: Optional[str] = Query(None),
    date: Optional[str] = Query(None),
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(get_current_user)
):
    # If single date and store_name are provided, get the last matching entry
    if date and store_name:
        return await crud.get_last_sales_log_by_date_and_store(db, product_id=product_id, date=date, store_name=store_name)
    
    return await crud.get_sales_logs_by_product(db, product_id=product_id, start_date=start_date, end_date=end_date, agency_name=agency_name, store_name=store_name)

@router.post("/", response_model=SalesLog)
async def create_sales_log_entry(
    sales_log: SalesLogCreate, 
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(require_manager_or_admin)
):
    db_log = await crud.create_sales_log(db=db, sales_log=sales_log)
    await create_audit_log(
        db,
        AuditLogCreate(
            user_id=current_user.id,
            username=current_user.email,
            action="SALES_CREATE",
            entity="SalesLog",
            entity_id=db_log.id,
            field_changed=None,
            old_value=None,
            new_value=json.dumps(crud.sa_obj_to_dict(db_log))
        )
    )
    return db_log

@router.post("/bulk-create", response_model=List[SalesLog])
async def create_sales_logs_bulk(
    sales_logs: List[SalesLogCreate], 
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(require_manager_or_admin)
):
    result = await crud.create_sales_logs_bulk(db=db, sales_logs=sales_logs)
    # Audit log for bulk sales log create
    await create_audit_log(
        db,
        AuditLogCreate(
            user_id=current_user.id,
            username=current_user.email,
            action="SALES_BULK_CREATE",
            entity="SalesLog",
            entity_id=0,
            field_changed=None,
            old_value=None,
            new_value=f"Bulk sales logs created: {len(sales_logs)} entries"
        )
    )
    return result

@router.delete("/bulk-delete")
async def delete_sales_logs_bulk(
    product_id: int,
    date: Optional[str] = Query(None),
    store_name: Optional[str] = Query(None),
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(require_manager_or_admin)
):
    deleted_count = await crud.delete_sales_logs_bulk(db=db, product_id=product_id, date=date, store_name=store_name)
    # Audit log for bulk sales log delete
    await create_audit_log(
        db,
        AuditLogCreate(
            user_id=current_user.id,
            username=current_user.email,
            action="SALES_BULK_DELETE",
            entity="SalesLog",
            entity_id=0,
            field_changed=None,
            old_value=None,
            new_value=f"Bulk sales logs deleted: {deleted_count} entries for product {product_id}"
        )
    )
    return {"message": f"Deleted {deleted_count} sales log entries"}

@router.put("/{log_id}", response_model=SalesLog)
async def update_sales_log_entry(
    log_id: int, 
    sales_log: SalesLogUpdate, 
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(require_manager_or_admin)
):
    # Get old log for audit
    old_log = await crud.get_sales_log_by_id(db, log_id)
    db_log = await crud.update_sales_log(db=db, log_id=log_id, sales_log=sales_log)
    await create_audit_log(
        db,
        AuditLogCreate(
            user_id=current_user.id,
            username=current_user.email,
            action="SALES_UPDATE",
            entity="SalesLog",
            entity_id=log_id,
            field_changed=None,
            old_value=json.dumps(crud.sa_obj_to_dict(old_log) if old_log else None),
            new_value=json.dumps(crud.sa_obj_to_dict(db_log))
        )
    )
    if db_log is None:
        raise HTTPException(status_code=404, detail="Sales log not found")
    return db_log

@router.delete("/{log_id}", response_model=SalesLog)
async def delete_sales_log_entry(
    log_id: int, 
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(require_manager_or_admin)
):
    db_log = await crud.delete_sales_log(db=db, log_id=log_id)
    await create_audit_log(
        db,
        AuditLogCreate(
            user_id=current_user.id,
            username=current_user.email,
            action="SALES_DELETE",
            entity="SalesLog",
            entity_id=log_id,
            field_changed=None,
            old_value=json.dumps(crud.sa_obj_to_dict(db_log)) if db_log else None,
            new_value=None
        )
    )
    if db_log is None:
        raise HTTPException(status_code=404, detail="Sales log not found")
    return db_log 