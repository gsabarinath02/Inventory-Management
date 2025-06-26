from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from ...schemas.inward import InwardLog, InwardLogCreate, InwardLogUpdate
from ...core.crud import inward as crud
from ...api import deps
from ...api.deps import get_current_user, require_manager_or_admin

router = APIRouter()

@router.get("/{product_id}", response_model=List[InwardLog])
async def read_inward_logs(
    product_id: int,
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    stakeholder: Optional[str] = Query(None),
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(get_current_user)
):
    return await crud.get_inward_logs_by_product(db, product_id=product_id, start_date=start_date, end_date=end_date, stakeholder=stakeholder)

@router.post("/", response_model=InwardLog)
async def create_inward_log_entry(
    inward_log: InwardLogCreate, 
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(require_manager_or_admin)
):
    return await crud.create_inward_log(db=db, inward_log=inward_log)

@router.put("/{log_id}", response_model=InwardLog)
async def update_inward_log_entry(
    log_id: int, 
    inward_log: InwardLogUpdate, 
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(require_manager_or_admin)
):
    db_log = await crud.update_inward_log(db=db, log_id=log_id, inward_log=inward_log)
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
    if db_log is None:
        raise HTTPException(status_code=404, detail="Inward log not found")
    return db_log 