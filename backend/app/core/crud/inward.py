from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from ...models.inward import InwardLog
from ...schemas.inward import InwardLogCreate, InwardLogUpdate, InwardLog as InwardLogSchema
from . import product_color_stock as crud_stock
from typing import Optional, List
from datetime import datetime

def sa_obj_to_dict(obj):
    try:
        data = {
            "id": obj.id,
            "product_id": obj.product_id,
            "color": obj.color,
            "colour_code": obj.colour_code,
            "sizes": obj.sizes,
            "date": obj.date,
            "category": obj.category,
            "stakeholder_name": obj.stakeholder_name,
            "operation": obj.operation
        }
        return data
    except Exception:
        return {"id": getattr(obj, 'id', None)}

async def get_inward_logs_by_product(db: AsyncSession, product_id: int, start_date: Optional[str] = None, end_date: Optional[str] = None, stakeholder: Optional[str] = None):
    query = select(InwardLog).filter(InwardLog.product_id == product_id)
    if start_date:
        query = query.filter(InwardLog.date >= datetime.strptime(start_date, '%Y-%m-%d').date())
    if end_date:
        query = query.filter(InwardLog.date <= datetime.strptime(end_date, '%Y-%m-%d').date())
    if stakeholder:
        query = query.filter(InwardLog.stakeholder_name.ilike(f'%{stakeholder}%'))
    result = await db.execute(query)
    logs = result.scalars().all()
    return [InwardLogSchema.model_validate(sa_obj_to_dict(log)) for log in logs]

async def get_last_inward_log_by_date_and_stakeholder(db: AsyncSession, product_id: int, date: str, stakeholder_name: str):
    """Get the last (most recent) inward log entry for a specific date and stakeholder"""
    query = select(InwardLog).filter(
        InwardLog.product_id == product_id,
        InwardLog.date == datetime.strptime(date, '%Y-%m-%d').date(),
        InwardLog.stakeholder_name.ilike(f'%{stakeholder_name}%')
    ).order_by(InwardLog.created_at.desc()).limit(1)
    
    result = await db.execute(query)
    log = result.scalar_one_or_none()
    if log:
        return [InwardLogSchema.model_validate(sa_obj_to_dict(log))]
    return []

async def create_inward_log(db: AsyncSession, inward_log: InwardLogCreate):
    db_inward_log = InwardLog(**inward_log.model_dump())
    db.add(db_inward_log)
    await db.commit()
    await db.refresh(db_inward_log)
    await crud_stock.update_stock_from_log(db, db_inward_log, "CREATE")
    # Convert to dict immediately after refresh
    log_dict = sa_obj_to_dict(db_inward_log)
    return InwardLogSchema.model_validate(log_dict)

async def create_inward_logs_bulk(db: AsyncSession, inward_logs: List[InwardLogCreate]):
    """Create multiple inward log entries in a single transaction"""
    created_logs = []
    for inward_log in inward_logs:
        db_inward_log = InwardLog(**inward_log.model_dump())
        db.add(db_inward_log)
        created_logs.append(db_inward_log)
    
    await db.commit()
    
    # Refresh all created logs and update stock
    for db_inward_log in created_logs:
        await db.refresh(db_inward_log)
        await crud_stock.update_stock_from_log(db, db_inward_log, "CREATE")
    
    return [InwardLogSchema.model_validate(sa_obj_to_dict(log)) for log in created_logs]

async def delete_inward_logs_bulk(db: AsyncSession, product_id: int, date: Optional[str] = None, stakeholder_name: Optional[str] = None):
    """Delete multiple inward log entries based on criteria"""
    # First, get the logs to be deleted for stock update
    query = select(InwardLog).filter(InwardLog.product_id == product_id)
    if date:
        query = query.filter(InwardLog.date == datetime.strptime(date, '%Y-%m-%d').date())
    if stakeholder_name:
        query = query.filter(InwardLog.stakeholder_name.ilike(f'%{stakeholder_name}%'))
    
    result = await db.execute(query)
    logs_to_delete = result.scalars().all()
    
    # Update stock for each log before deletion
    for log in logs_to_delete:
        await crud_stock.update_stock_from_log(db, log, "DELETE")
    
    # Delete the logs
    delete_query = delete(InwardLog).filter(InwardLog.product_id == product_id)
    if date:
        delete_query = delete_query.filter(InwardLog.date == datetime.strptime(date, '%Y-%m-%d').date())
    if stakeholder_name:
        delete_query = delete_query.filter(InwardLog.stakeholder_name.ilike(f'%{stakeholder_name}%'))
    
    result = await db.execute(delete_query)
    await db.commit()
    
    return len(logs_to_delete)

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

async def get_inward_log_by_id(db: AsyncSession, log_id: int):
    result = await db.execute(select(InwardLog).filter(InwardLog.id == log_id))
    return result.scalar_one_or_none()

async def get_all_inward_logs(db: AsyncSession):
    result = await db.execute(select(InwardLog))
    logs = result.scalars().all()
    return [InwardLogSchema.model_validate(sa_obj_to_dict(log)) for log in logs] 