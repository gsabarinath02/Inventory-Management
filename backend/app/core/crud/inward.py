from sqlalchemy.orm import Session
from ...models.inward import InwardLog
from ...schemas.inward import InwardLogCreate, InwardLogUpdate
from . import product_color_stock as crud_stock

def get_inward_logs_by_product(db: Session, product_id: int):
    return db.query(InwardLog).filter(InwardLog.product_id == product_id).all()

def create_inward_log(db: Session, inward_log: InwardLogCreate):
    db_inward_log = InwardLog(**inward_log.dict())
    db.add(db_inward_log)
    db.commit()
    db.refresh(db_inward_log)
    
    crud_stock.update_stock_from_log(db, db_inward_log, "CREATE")
    
    return db_inward_log

def update_inward_log(db: Session, log_id: int, inward_log: InwardLogUpdate):
    db_inward_log = db.query(InwardLog).filter(InwardLog.id == log_id).first()
    if db_inward_log:
        crud_stock.update_stock_from_log(db, db_inward_log, "DELETE")
        
        update_data = inward_log.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_inward_log, key, value)
            
        db.flush()
        
        crud_stock.update_stock_from_log(db, db_inward_log, "CREATE")
        
        db.commit()
        db.refresh(db_inward_log)
    return db_inward_log

def delete_inward_log(db: Session, log_id: int):
    db_inward_log = db.query(InwardLog).filter(InwardLog.id == log_id).first()
    if db_inward_log:
        crud_stock.update_stock_from_log(db, db_inward_log, "DELETE")
        db.delete(db_inward_log)
        db.commit()
    return db_inward_log 