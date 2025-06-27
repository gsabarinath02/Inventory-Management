from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from ...schemas.inward import InwardLog, InwardLogCreate, InwardLogUpdate
from ...core.crud import inward as crud
from ...api import deps
from ...api.deps import get_current_user, require_manager_or_admin
from ...core.crud.audit_log import create_audit_log
from ...schemas.audit_log import AuditLogCreate
import json
from ...core.crud.inward import sa_obj_to_dict, get_inward_log_by_id

router = APIRouter()

@router.get("/{product_id}", response_model=List[InwardLog])
async def read_inward_logs(
    product_id: int,
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    stakeholder: Optional[str] = Query(None),
    date: Optional[str] = Query(None),
    stakeholder_name: Optional[str] = Query(None),
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(get_current_user)
):
    # If single date and stakeholder_name are provided, get the last matching entry
    if date and stakeholder_name:
        return await crud.get_last_inward_log_by_date_and_stakeholder(db, product_id=product_id, date=date, stakeholder_name=stakeholder_name)
    
    return await crud.get_inward_logs_by_product(db, product_id=product_id, start_date=start_date, end_date=end_date, stakeholder=stakeholder)

@router.post("/", response_model=InwardLog)
async def create_inward_log_entry(
    inward_log: InwardLogCreate, 
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(require_manager_or_admin)
):
    db_log = await crud.create_inward_log(db=db, inward_log=inward_log)
    await create_audit_log(
        db,
        AuditLogCreate(
            user_id=current_user.id,
            username=current_user.email,
            action="INWARD_CREATE",
            entity="InwardLog",
            entity_id=db_log.id,
            field_changed=None,
            old_value=None,
            new_value=json.dumps(sa_obj_to_dict(db_log), default=str)
        )
    )
    return db_log

@router.post("/bulk-create", response_model=List[InwardLog])
async def create_inward_logs_bulk(
    inward_logs: List[InwardLogCreate], 
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(require_manager_or_admin)
):
    result = await crud.create_inward_logs_bulk(db=db, inward_logs=inward_logs)
    # Audit log for bulk inward log create
    await create_audit_log(
        db,
        AuditLogCreate(
            user_id=current_user.id,
            username=current_user.email,
            action="INWARD_BULK_CREATE",
            entity="InwardLog",
            entity_id=0,
            field_changed=None,
            old_value=None,
            new_value=f"Bulk inward logs created: {len(inward_logs)} entries"
        )
    )
    return result

@router.delete("/bulk-delete")
async def delete_inward_logs_bulk(
    product_id: int,
    date: Optional[str] = Query(None),
    stakeholder_name: Optional[str] = Query(None),
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(require_manager_or_admin)
):
    deleted_count = await crud.delete_inward_logs_bulk(db=db, product_id=product_id, date=date, stakeholder_name=stakeholder_name)
    # Audit log for bulk inward log delete
    await create_audit_log(
        db,
        AuditLogCreate(
            user_id=current_user.id,
            username=current_user.email,
            action="INWARD_BULK_DELETE",
            entity="InwardLog",
            entity_id=0,
            field_changed=None,
            old_value=None,
            new_value=f"Bulk inward logs deleted: {deleted_count} entries for product {product_id}"
        )
    )
    return {"message": f"Deleted {deleted_count} inward log entries"}

@router.put("/{log_id}", response_model=InwardLog)
async def update_inward_log_entry(
    log_id: int, 
    inward_log: InwardLogUpdate, 
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(require_manager_or_admin)
):
    # Get old log for audit
    old_log = await crud.get_inward_log_by_id(db, log_id)
    db_log = await crud.update_inward_log(db=db, log_id=log_id, inward_log=inward_log)
    await create_audit_log(
        db,
        AuditLogCreate(
            user_id=current_user.id,
            username=current_user.email,
            action="INWARD_UPDATE",
            entity="InwardLog",
            entity_id=log_id,
            field_changed=None,
            old_value=json.dumps(sa_obj_to_dict(old_log) if old_log else None, default=str),
            new_value=json.dumps(sa_obj_to_dict(db_log), default=str)
        )
    )
    if db_log is None:
        raise HTTPException(status_code=404, detail="Inward log not found")
    return db_log

@router.delete("/{log_id}", response_model=InwardLog)
async def delete_inward_log_entry(
    log_id: int, 
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(require_manager_or_admin)
):
    db_log = await crud.delete_inward_log(db=db, log_id=log_id)
    await create_audit_log(
        db,
        AuditLogCreate(
            user_id=current_user.id,
            username=current_user.email,
            action="INWARD_DELETE",
            entity="InwardLog",
            entity_id=log_id,
            field_changed=None,
            old_value=json.dumps(sa_obj_to_dict(db_log), default=str) if db_log else None,
            new_value=None
        )
    )
    if db_log is None:
        raise HTTPException(status_code=404, detail="Inward log not found")
    return db_log 