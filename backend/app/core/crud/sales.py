from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ...models.sales import SalesLog
from ...schemas.sales import SalesLogCreate, SalesLogUpdate
from . import product_color_stock as crud_stock

async def get_sales_logs_by_product(db: AsyncSession, product_id: int):
    result = await db.execute(select(SalesLog).filter(SalesLog.product_id == product_id))
    return result.scalars().all()

async def create_sales_log(db: AsyncSession, sales_log: SalesLogCreate):
    db_sales_log = SalesLog(**sales_log.model_dump())
    db.add(db_sales_log)
    await db.commit()
    await db.refresh(db_sales_log)
    
    await crud_stock.update_stock_from_log(db, db_sales_log, "CREATE")
    
    return db_sales_log

async def update_sales_log(db: AsyncSession, log_id: int, sales_log: SalesLogUpdate):
    result = await db.execute(select(SalesLog).filter(SalesLog.id == log_id))
    db_sales_log = result.scalar_one_or_none()
    if db_sales_log:
        await crud_stock.update_stock_from_log(db, db_sales_log, "DELETE")
        
        update_data = sales_log.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_sales_log, key, value)
        
        await db.flush()
        
        await crud_stock.update_stock_from_log(db, db_sales_log, "CREATE")

        await db.commit()
        await db.refresh(db_sales_log)
    return db_sales_log

async def delete_sales_log(db: AsyncSession, log_id: int):
    result = await db.execute(select(SalesLog).filter(SalesLog.id == log_id))
    db_sales_log = result.scalar_one_or_none()
    if db_sales_log:
        await crud_stock.update_stock_from_log(db, db_sales_log, "DELETE")
        await db.delete(db_sales_log)
        await db.commit()
    return db_sales_log 