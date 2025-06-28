from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload
from typing import List, Optional
from ...models.agency import Agency
from ...schemas.agency import AgencyCreate, AgencyUpdate

async def create_agency(db: AsyncSession, agency: AgencyCreate) -> Agency:
    """Create a new agency."""
    db_agency = Agency(**agency.dict())
    db.add(db_agency)
    await db.commit()
    await db.refresh(db_agency)
    return db_agency

async def get_agency(db: AsyncSession, agency_id: int) -> Optional[Agency]:
    """Get an agency by ID."""
    result = await db.execute(select(Agency).where(Agency.id == agency_id))
    return result.scalar_one_or_none()

async def get_agency_by_name(db: AsyncSession, agency_name: str) -> Optional[Agency]:
    """Get an agency by name."""
    result = await db.execute(select(Agency).where(Agency.agency_name == agency_name))
    return result.scalar_one_or_none()

async def get_agencies(
    db: AsyncSession, 
    skip: int = 0, 
    limit: int = 100,
    search: Optional[str] = None
) -> List[Agency]:
    """Get all agencies with optional search and pagination."""
    query = select(Agency)
    
    if search:
        query = query.where(
            Agency.agency_name.ilike(f"%{search}%") |
            Agency.gst_number.ilike(f"%{search}%") |
            Agency.region_covered.ilike(f"%{search}%")
        )
    
    query = query.offset(skip).limit(limit).order_by(Agency.agency_name)
    result = await db.execute(query)
    return result.scalars().all()

async def update_agency(
    db: AsyncSession, 
    agency_id: int, 
    agency_update: AgencyUpdate
) -> Optional[Agency]:
    """Update an agency."""
    update_data = agency_update.dict(exclude_unset=True)
    if not update_data:
        return await get_agency(db, agency_id)
    
    await db.execute(
        update(Agency)
        .where(Agency.id == agency_id)
        .values(**update_data)
    )
    await db.commit()
    return await get_agency(db, agency_id)

async def delete_agency(db: AsyncSession, agency_id: int) -> bool:
    """Delete an agency."""
    result = await db.execute(delete(Agency).where(Agency.id == agency_id))
    await db.commit()
    return result.rowcount > 0

async def get_agency_names(db: AsyncSession) -> List[str]:
    """Get all agency names for dropdown."""
    result = await db.execute(select(Agency.agency_name).order_by(Agency.agency_name))
    return result.scalars().all() 