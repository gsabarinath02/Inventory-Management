from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ...models.inward import InwardLog
from ...schemas.inward import InwardLogCreate, InwardLogUpdate, InwardLog as InwardLogSchema
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
            "category": obj.category,
            "stakeholder_name": obj.stakeholder_name
        }
        return data
    except Exception:
        # Fallback: return a minimal dict with just the ID
        return {"id": getattr(obj, 'id', None)}

async def get_inward_logs_by_product(db: AsyncSession, product_id: int):
    result = await db.execute(select(InwardLog).filter(InwardLog.product_id == product_id))
    logs = result.scalars().all()
    return [InwardLogSchema.model_validate(sa_obj_to_dict(log)) for log in logs]

async def create_inward_log(db: AsyncSession, inward_log: InwardLogCreate):
    db_inward_log = InwardLog(**inward_log.model_dump())
    db.add(db_inward_log)
    await db.commit()
    await db.refresh(db_inward_log)
    
    await crud_stock.update_stock_from_log(db, db_inward_log, "CREATE")
    
    # Convert to dict immediately after refresh
    log_dict = sa_obj_to_dict(db_inward_log)
    return InwardLogSchema.model_validate(log_dict)

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
        
        # Convert to dict immediately after refresh
        log_dict = sa_obj_to_dict(db_inward_log)
        return InwardLogSchema.model_validate(log_dict)
    return None

async def delete_inward_log(db: AsyncSession, log_id: int):
    result = await db.execute(select(InwardLog).filter(InwardLog.id == log_id))
    db_inward_log = result.scalar_one_or_none()

    if db_inward_log:
        # Convert to dict before deletion
        log_dict = sa_obj_to_dict(db_inward_log)
        
        await crud_stock.update_stock_from_log(db, db_inward_log, "DELETE")
        await db.delete(db_inward_log)
        await db.commit()
        
        return InwardLogSchema.model_validate(log_dict)
    return None 