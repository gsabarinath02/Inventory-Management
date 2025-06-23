from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime
from typing import List, Optional

from ...models.audit_log import AuditLog
from ...schemas.audit_log import AuditLogCreate

async def create_audit_log(db: AsyncSession, log_entry: AuditLogCreate) -> AuditLog:
    db_log = AuditLog(**log_entry.model_dump())
    db.add(db_log)
    await db.commit()
    await db.refresh(db_log)
    return db_log

async def get_audit_logs(
    db: AsyncSession, 
    skip: int = 0, 
    limit: int = 100,
    user_id: Optional[int] = None,
    entity: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> List[AuditLog]:
    query = select(AuditLog).order_by(AuditLog.timestamp.desc())

    if user_id is not None:
        query = query.filter(AuditLog.user_id == user_id)
    if entity:
        query = query.filter(AuditLog.entity == entity)
    if start_date:
        query = query.filter(AuditLog.timestamp >= start_date)
    if end_date:
        query = query.filter(AuditLog.timestamp <= end_date)
    
    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    return result.scalars().all() 