from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ...models.inward import InwardLog
from ...schemas.inward import InwardLogCreate, InwardLogUpdate
from . import product_color_stock as crud_stock

async def get_inward_logs_by_product(db: AsyncSession, product_id: int):
    result = await db.execute(select(InwardLog).filter(InwardLog.product_id == product_id))
    return result.scalars().all()

async def create_inward_log(db: AsyncSession, inward_log: InwardLogCreate):
    db_inward_log = InwardLog(**inward_log.model_dump())
    db.add(db_inward_log)
    await db.commit()
    await db.refresh(db_inward_log)
    
    await crud_stock.update_stock_from_log(db, db_inward_log, "CREATE")
    
    return db_inward_log

async def update_inward_log(db: AsyncSession, log_id: int, inward_log: InwardLogUpdate):
    result = await db.execute(select(InwardLog).filter(InwardLog.id == log_id))
    db_inward_log = result.scalar_one_or_none()

    if db_inward_log:
        await crud_stock.update_stock_from_log(db, db_inward_log, "DELETE")
        
        update_data = inward_log.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_inward_log, key, value)
            
        await db.flush()
        
        await crud_stock.update_stock_from_log(db, db_inward_log, "CREATE")
        
        await db.commit()
        await db.refresh(db_inward_log)
    return db_inward_log

async def delete_inward_log(db: AsyncSession, log_id: int):
    result = await db.execute(select(InwardLog).filter(InwardLog.id == log_id))
    db_inward_log = result.scalar_one_or_none()

    if db_inward_log:
        await crud_stock.update_stock_from_log(db, db_inward_log, "DELETE")
        await db.delete(db_inward_log)
        await db.commit()
    return db_inward_log 