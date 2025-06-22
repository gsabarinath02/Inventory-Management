from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ...schemas.inward import InwardLog, InwardLogCreate, InwardLogUpdate
from ...core.crud import inward as crud
from ...api import deps

router = APIRouter()

@router.get("/{product_id}", response_model=List[InwardLog])
def read_inward_logs(product_id: int, db: Session = Depends(deps.get_db)):
    return crud.get_inward_logs_by_product(db, product_id=product_id)

@router.post("/", response_model=InwardLog)
def create_inward_log_entry(inward_log: InwardLogCreate, db: Session = Depends(deps.get_db)):
    return crud.create_inward_log(db=db, inward_log=inward_log)

@router.put("/{log_id}", response_model=InwardLog)
def update_inward_log_entry(log_id: int, inward_log: InwardLogUpdate, db: Session = Depends(deps.get_db)):
    db_log = crud.update_inward_log(db=db, log_id=log_id, inward_log=inward_log)
    if db_log is None:
        raise HTTPException(status_code=404, detail="Inward log not found")
    return db_log

@router.delete("/{log_id}", response_model=InwardLog)
def delete_inward_log_entry(log_id: int, db: Session = Depends(deps.get_db)):
    db_log = crud.delete_inward_log(db=db, log_id=log_id)
    if db_log is None:
        raise HTTPException(status_code=404, detail="Inward log not found")
    return db_log 