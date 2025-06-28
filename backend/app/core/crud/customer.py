from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload
from typing import List, Optional
from ...models.customer import Customer
from ...schemas.customer import CustomerCreate, CustomerUpdate

async def create_customer(db: AsyncSession, customer: CustomerCreate) -> Customer:
    """Create a new customer."""
    db_customer = Customer(**customer.dict())
    db.add(db_customer)
    await db.commit()
    await db.refresh(db_customer)
    return db_customer

async def get_customer(db: AsyncSession, customer_id: int) -> Optional[Customer]:
    """Get a customer by ID."""
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    return result.scalar_one_or_none()

async def get_customer_by_store_name(db: AsyncSession, store_name: str) -> Optional[Customer]:
    """Get a customer by store name."""
    result = await db.execute(select(Customer).where(Customer.store_name == store_name))
    return result.scalar_one_or_none()

async def get_customers(
    db: AsyncSession, 
    skip: int = 0, 
    limit: int = 100,
    search: Optional[str] = None
) -> List[Customer]:
    """Get all customers with optional search and pagination."""
    query = select(Customer)
    
    if search:
        query = query.where(
            Customer.store_name.ilike(f"%{search}%") |
            Customer.referrer.ilike(f"%{search}%") |
            Customer.gst_number.ilike(f"%{search}%")
        )
    
    query = query.offset(skip).limit(limit).order_by(Customer.store_name)
    result = await db.execute(query)
    return result.scalars().all()

async def update_customer(
    db: AsyncSession, 
    customer_id: int, 
    customer_update: CustomerUpdate
) -> Optional[Customer]:
    """Update a customer."""
    update_data = customer_update.dict(exclude_unset=True)
    if not update_data:
        return await get_customer(db, customer_id)
    
    await db.execute(
        update(Customer)
        .where(Customer.id == customer_id)
        .values(**update_data)
    )
    await db.commit()
    return await get_customer(db, customer_id)

async def delete_customer(db: AsyncSession, customer_id: int) -> bool:
    """Delete a customer."""
    result = await db.execute(delete(Customer).where(Customer.id == customer_id))
    await db.commit()
    return result.rowcount > 0

async def get_customer_names(db: AsyncSession) -> List[str]:
    """Get all customer store names for dropdown."""
    result = await db.execute(select(Customer.store_name).order_by(Customer.store_name))
    return result.scalars().all() 