from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select
from typing import List, Optional
from datetime import date
from ...models.orders import Order
from ...schemas.orders import OrderCreate, OrderUpdate

def get_financial_year(order_date: date) -> str:
    """Get financial year in format YYYY-YY from date"""
    year = order_date.year
    if order_date.month >= 4:  # Financial year starts from April
        return f"{year}-{str(year + 1)[-2:]}"
    else:
        return f"{year-1}-{str(year)[-2:]}"

async def get_next_order_number(db: AsyncSession, financial_year: str) -> int:
    """Get the next order number for the given financial year"""
    result = await db.execute(
        select(func.max(Order.order_number)).filter(Order.financial_year == financial_year)
    )
    max_order = result.scalar()
    return (max_order or 0) + 1

async def create_order(db: AsyncSession, order: OrderCreate) -> Order:
    """Create a new order with automatic order number generation"""
    financial_year = get_financial_year(order.date)
    order_number = await get_next_order_number(db, financial_year)
    
    db_order = Order(
        order_number=order_number,
        financial_year=financial_year,
        **order.model_dump()
    )
    db.add(db_order)
    await db.commit()
    await db.refresh(db_order)
    return db_order

async def get_all_orders(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Order]:
    """Get all orders with pagination"""
    result = await db.execute(
        select(Order).offset(skip).limit(limit).order_by(Order.created_at.desc())
    )
    return result.scalars().all()

async def get_orders(
    db: AsyncSession, 
    product_id: int, 
    skip: int = 0, 
    limit: int = 100,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    agency_name: Optional[str] = None,
    store_name: Optional[str] = None
) -> List[Order]:
    """Get orders for a specific product with optional filtering"""
    query = select(Order).filter(Order.product_id == product_id)
    
    # Apply date range filter
    if start_date:
        query = query.filter(Order.date >= start_date)
    if end_date:
        query = query.filter(Order.date <= end_date)
    
    # Apply agency filter
    if agency_name:
        query = query.filter(Order.agency_name == agency_name)
    
    # Apply store filter
    if store_name:
        query = query.filter(Order.store_name == store_name)
    
    result = await db.execute(
        query.offset(skip).limit(limit).order_by(Order.date.desc(), Order.created_at.desc())
    )
    return result.scalars().all()

async def get_order(db: AsyncSession, order_id: int) -> Optional[Order]:
    """Get a specific order by ID"""
    result = await db.execute(select(Order).filter(Order.id == order_id))
    return result.scalar_one_or_none()

async def update_order(db: AsyncSession, order_id: int, order: OrderUpdate) -> Optional[Order]:
    """Update an existing order"""
    result = await db.execute(select(Order).filter(Order.id == order_id))
    db_order = result.scalar_one_or_none()
    if db_order:
        update_data = order.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_order, field, value)
        await db.commit()
        await db.refresh(db_order)
    return db_order

async def delete_order(db: AsyncSession, order_id: int) -> bool:
    """Delete an order"""
    result = await db.execute(select(Order).filter(Order.id == order_id))
    db_order = result.scalar_one_or_none()
    if db_order:
        await db.delete(db_order)
        await db.commit()
        return True
    return False

async def create_orders_bulk(db: AsyncSession, orders: List[OrderCreate]) -> List[Order]:
    """Create multiple orders with automatic order number generation"""
    created_orders = []
    
    for order_data in orders:
        financial_year = get_financial_year(order_data.date)
        order_number = await get_next_order_number(db, financial_year)
        
        db_order = Order(
            order_number=order_number,
            financial_year=financial_year,
            **order_data.model_dump()
        )
        db.add(db_order)
        created_orders.append(db_order)
    
    await db.commit()
    for order in created_orders:
        await db.refresh(order)
    
    return created_orders

async def delete_orders_bulk(db: AsyncSession, date: date, agency_name: Optional[str] = None, store_name: Optional[str] = None) -> int:
    """Delete orders for a specific date and optionally agency/store"""
    query = select(Order).filter(Order.date == date)
    
    if agency_name:
        query = query.filter(Order.agency_name == agency_name)
    if store_name:
        query = query.filter(Order.store_name == store_name)
    
    result = await db.execute(query)
    orders_to_delete = result.scalars().all()
    deleted_count = len(orders_to_delete)
    
    for order in orders_to_delete:
        await db.delete(order)
    
    await db.commit()
    return deleted_count 