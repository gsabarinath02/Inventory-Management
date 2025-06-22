from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from ...schemas.sales import SalesLog, SalesLogCreate, SalesLogUpdate
from ...core.crud import sales as crud
from ...api import deps
from ...api.deps import get_current_user, require_manager_or_admin

router = APIRouter()

@router.get("/{product_id}", response_model=List[SalesLog])
async def read_sales_logs(
    product_id: int, 
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(get_current_user)
):
    return await crud.get_sales_logs_by_product(db, product_id=product_id)

@router.post("/", response_model=SalesLog)
async def create_sales_log_entry(
    sales_log: SalesLogCreate, 
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(require_manager_or_admin)
):
    return await crud.create_sales_log(db=db, sales_log=sales_log)

@router.put("/{log_id}", response_model=SalesLog)
async def update_sales_log_entry(
    log_id: int, 
    sales_log: SalesLogUpdate, 
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(require_manager_or_admin)
):
    db_log = await crud.update_sales_log(db=db, log_id=log_id, sales_log=sales_log)
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
    if db_log is None:
        raise HTTPException(status_code=404, detail="Sales log not found")
    return db_log 