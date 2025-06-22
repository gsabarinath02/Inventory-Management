from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ...schemas.sales import SalesLog, SalesLogCreate, SalesLogUpdate
from ...core.crud import sales as crud
from ...api import deps

router = APIRouter()

@router.get("/{product_id}", response_model=List[SalesLog])
def read_sales_logs(product_id: int, db: Session = Depends(deps.get_db)):
    return crud.get_sales_logs_by_product(db, product_id=product_id)

@router.post("/", response_model=SalesLog)
def create_sales_log_entry(sales_log: SalesLogCreate, db: Session = Depends(deps.get_db)):
    return crud.create_sales_log(db=db, sales_log=sales_log)

@router.put("/{log_id}", response_model=SalesLog)
def update_sales_log_entry(log_id: int, sales_log: SalesLogUpdate, db: Session = Depends(deps.get_db)):
    db_log = crud.update_sales_log(db=db, log_id=log_id, sales_log=sales_log)
    if db_log is None:
        raise HTTPException(status_code=404, detail="Sales log not found")
    return db_log

@router.delete("/{log_id}", response_model=SalesLog)
def delete_sales_log_entry(log_id: int, db: Session = Depends(deps.get_db)):
    db_log = crud.delete_sales_log(db=db, log_id=log_id)
    if db_log is None:
        raise HTTPException(status_code=404, detail="Sales log not found")
    return db_log 