from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ...models.sales import SalesLog
from ...schemas.sales import SalesLogCreate, SalesLogUpdate, SalesLog as SalesLogSchema
from . import product_color_stock as crud_stock

def sa_obj_to_dict(obj):
    """Safely convert SQLAlchemy object to dictionary without triggering lazy loading"""
    try:
        # Manually extract known attributes to avoid lazy loading
        data = {
            "id": obj.id,
            "product_id": obj.product_id,
            "color": obj.color,
            "colour_code": obj.colour_code,
            "size": obj.size,
            "quantity": obj.quantity,
            "date": obj.date,
            "agency_name": obj.agency_name,
            "store_name": obj.store_name
        }
        return data
    except Exception:
        # Fallback: return a minimal dict with just the ID
        return {"id": getattr(obj, 'id', None)}

async def get_sales_logs_by_product(db: AsyncSession, product_id: int):
    result = await db.execute(select(SalesLog).filter(SalesLog.product_id == product_id))
    logs = result.scalars().all()
    return [SalesLogSchema.model_validate(sa_obj_to_dict(log)) for log in logs]

async def create_sales_log(db: AsyncSession, sales_log: SalesLogCreate):
    db_sales_log = SalesLog(**sales_log.model_dump())
    db.add(db_sales_log)
    await db.commit()
    await db.refresh(db_sales_log)
    
    await crud_stock.update_stock_from_log(db, db_sales_log, "CREATE")
    
    # Convert to dict immediately after refresh
    log_dict = sa_obj_to_dict(db_sales_log)
    return SalesLogSchema.model_validate(log_dict)

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
        
        # Convert to dict immediately after refresh
        log_dict = sa_obj_to_dict(db_sales_log)
        return SalesLogSchema.model_validate(log_dict)
    return None

async def delete_sales_log(db: AsyncSession, log_id: int):
    result = await db.execute(select(SalesLog).filter(SalesLog.id == log_id))
    db_sales_log = result.scalar_one_or_none()
    if db_sales_log:
        # Convert to dict before deletion
        log_dict = sa_obj_to_dict(db_sales_log)
        
        await crud_stock.update_stock_from_log(db, db_sales_log, "DELETE")
        await db.delete(db_sales_log)
        await db.commit()
        
        return SalesLogSchema.model_validate(log_dict)
    return None 