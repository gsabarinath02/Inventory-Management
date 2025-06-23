from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from datetime import datetime
from typing import Optional

from ... import schemas
from ...core import crud
from ...api import deps
from ...schemas.audit_log import AuditLogBulkDeleteRequest, AuditLogDeleteResponse

router = APIRouter()

@router.get("/", response_model=List[schemas.AuditLogOut])
async def read_audit_logs(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[int] = None,
    entity: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: schemas.User = Depends(deps.require_admin)
):
    """
    Retrieve audit logs. Admins only.
    """
    logs = await crud.audit_log.get_audit_logs(
        db=db, 
        skip=skip, 
        limit=limit,
        user_id=user_id,
        entity=entity,
        start_date=start_date,
        end_date=end_date
    )
    return logs 

@router.delete("/{log_id}", response_model=AuditLogDeleteResponse)
async def delete_audit_log(
    log_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: schemas.User = Depends(deps.require_admin)
):
    deleted = await crud.audit_log.delete_audit_log(db, log_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Audit log not found")
    return AuditLogDeleteResponse(deleted_count=1)

@router.post("/bulk-delete", response_model=AuditLogDeleteResponse)
async def bulk_delete_audit_logs(
    req: AuditLogBulkDeleteRequest,
    db: AsyncSession = Depends(deps.get_db),
    current_user: schemas.User = Depends(deps.require_admin)
):
    deleted_count = await crud.audit_log.bulk_delete_audit_logs(db, req.log_ids)
    return AuditLogDeleteResponse(deleted_count=deleted_count) 