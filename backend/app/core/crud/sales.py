from sqlalchemy.orm import Session
from ...models.sales import SalesLog
from ...schemas.sales import SalesLogCreate, SalesLogUpdate
from . import product_color_stock as crud_stock

def get_sales_logs_by_product(db: Session, product_id: int):
    return db.query(SalesLog).filter(SalesLog.product_id == product_id).all()

def create_sales_log(db: Session, sales_log: SalesLogCreate):
    db_sales_log = SalesLog(**sales_log.dict())
    db.add(db_sales_log)
    db.commit()
    db.refresh(db_sales_log)
    
    crud_stock.update_stock_from_log(db, db_sales_log, "CREATE")
    
    return db_sales_log

def update_sales_log(db: Session, log_id: int, sales_log: SalesLogUpdate):
    db_sales_log = db.query(SalesLog).filter(SalesLog.id == log_id).first()
    if db_sales_log:
        crud_stock.update_stock_from_log(db, db_sales_log, "DELETE")
        
        update_data = sales_log.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_sales_log, key, value)
        
        db.flush()
        
        crud_stock.update_stock_from_log(db, db_sales_log, "CREATE")

        db.commit()
        db.refresh(db_sales_log)
    return db_sales_log

def delete_sales_log(db: Session, log_id: int):
    db_sales_log = db.query(SalesLog).filter(SalesLog.id == log_id).first()
    if db_sales_log:
        crud_stock.update_stock_from_log(db, db_sales_log, "DELETE")
        db.delete(db_sales_log)
        db.commit()
    return db_sales_log 