from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select
from typing import List, Optional
from datetime import date
from ...models.orders import Order
from ...schemas.orders import OrderCreate, OrderUpdate
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from app.models.sales import SalesLog
from collections import defaultdict
import logging

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
    try:
        await db.commit()
        await db.refresh(db_order)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Order number must be unique for the financial year.")
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
    order = result.scalar_one_or_none()
    if not order:
        return None
    order_dict = order.__dict__.copy()
    order_dict['fully_delivered'] = await is_fully_delivered(db, order)
    return order

async def update_order(db: AsyncSession, order_id: int, order: OrderUpdate) -> Optional[Order]:
    """Update an existing order, including order_number"""
    result = await db.execute(select(Order).filter(Order.id == order_id))
    db_order = result.scalar_one_or_none()
    if db_order:
        update_data = order.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_order, field, value)
        try:
            await db.commit()
            await db.refresh(db_order)
        except IntegrityError:
            await db.rollback()
            raise HTTPException(status_code=400, detail="Order number must be unique for the financial year.")
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
    """Create multiple orders with automatic order number generation, ensuring unique order numbers per financial year."""
    logger = logging.getLogger("orders-bulk")
    created_orders = []
    # 1. Group orders by financial year
    fy_to_orders = defaultdict(list)
    for order_data in orders:
        financial_year = get_financial_year(order_data.date)
        fy_to_orders[financial_year].append(order_data)
    # 2. For each financial year, get the current max order number
    fy_to_next_order_number = {}
    for fy, orders_in_fy in fy_to_orders.items():
        result = await db.execute(select(func.max(Order.order_number)).filter(Order.financial_year == fy))
        max_order = result.scalar() or 0
        fy_to_next_order_number[fy] = max_order + 1
        logger.info(f"[BULK] Starting order number for FY {fy}: {fy_to_next_order_number[fy]}")
    # 3. Assign incrementing order numbers and create orders
    batch_order_numbers = set()
    for order_data in orders:
        financial_year = get_financial_year(order_data.date)
        # Ensure uniqueness within the batch
        while True:
            order_number = fy_to_next_order_number[financial_year]
            key = (financial_year, order_number)
            if key not in batch_order_numbers:
                batch_order_numbers.add(key)
                break
            fy_to_next_order_number[financial_year] += 1
        db_order = Order(
            order_number=order_number,
            financial_year=financial_year,
            **order_data.model_dump()
        )
        db.add(db_order)
        created_orders.append(db_order)
        fy_to_next_order_number[financial_year] += 1
        logger.info(f"[BULK] Assigned order_number={order_number} for FY={financial_year}")
    try:
        await db.commit()
        for order in created_orders:
            await db.refresh(order)
    except IntegrityError as e:
        await db.rollback()
        logger.error(f"[BULK] IntegrityError: {e}")
        raise HTTPException(status_code=400, detail="Order number must be unique for the financial year.")
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

async def is_fully_delivered(db: AsyncSession, order: Order) -> bool:
    delivered_logs = await db.execute(select(SalesLog).filter(SalesLog.order_number == order.order_number, SalesLog.product_id == order.product_id))
    delivered_logs = delivered_logs.scalars().all()
    delivered_total = {}
    for log in delivered_logs:
        for size, qty in (log.sizes or {}).items():
            delivered_total[size] = delivered_total.get(size, 0) + qty
    return all((delivered_total.get(size, 0) >= order.sizes.get(size, 0) for size in order.sizes or {})) 