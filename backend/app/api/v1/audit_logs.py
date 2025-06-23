from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from datetime import datetime
from typing import Optional

from ... import schemas
from ...core import crud
from ...api import deps

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