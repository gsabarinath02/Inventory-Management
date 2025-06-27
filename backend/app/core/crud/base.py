from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List, Optional
from app.models import Product, InwardLog, SalesLog
from schemas import ProductCreate, ProductUpdate, InwardLogCreate, SalesLogCreate, StockInfo
from sqlalchemy.exc import IntegrityError

# Product CRUD operations
async def create_product(db: AsyncSession, product: ProductCreate) -> Product:
    db_product = Product(**product.model_dump())
    db.add(db_product)
    await db.commit()
    await db.refresh(db_product)
    return db_product

async def get_products(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Product]:
    result = await db.execute(select(Product).offset(skip).limit(limit))
    products = result.scalars().all()
    
    # Manually process colors and sizes to ensure they are lists of strings
    for p in products:
        if p.colors and isinstance(p.colors, list) and p.colors and isinstance(p.colors[0], dict):
            p.colors = [c.get("name") for c in p.colors if c.get("name")]
        if p.sizes and isinstance(p.sizes, list) and p.sizes and isinstance(p.sizes[0], dict):
            p.sizes = [s.get("name") for s in p.sizes if s.get("name")]
            
    return products

async def get_product(db: AsyncSession, product_id: int) -> Optional[Product]:
    result = await db.execute(select(Product).where(Product.id == product_id))
    return result.scalar_one_or_none()

async def update_product(db: AsyncSession, product_id: int, product: ProductUpdate) -> Optional[Product]:
    db_product = await get_product(db, product_id)
    if not db_product:
        return None
    
    update_data = product.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_product, field, value)
    
    await db.commit()
    await db.refresh(db_product)
    return db_product

async def delete_product(db: AsyncSession, product_id: int) -> bool:
    db_product = await get_product(db, product_id)
    if not db_product:
        return False
    
    await db.delete(db_product)
    await db.commit()
    return True

# Inward Log CRUD operations
async def create_inward_log(db: AsyncSession, inward_log: InwardLogCreate) -> InwardLog:
    db_inward_log = InwardLog(**inward_log.model_dump())
    db.add(db_inward_log)
    await db.commit()
    await db.refresh(db_inward_log)
    return db_inward_log

async def get_inward_logs(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[InwardLog]:
    result = await db.execute(
        select(InwardLog)
        .options(selectinload(InwardLog.product))
        .offset(skip)
        .limit(limit)
        .order_by(InwardLog.created_at.desc())
    )
    return result.scalars().all()

# Sales Log CRUD operations
async def create_sales_log(db: AsyncSession, sales_log: SalesLogCreate) -> SalesLog:
    db_sales_log = SalesLog(**sales_log.model_dump())
    db.add(db_sales_log)
    await db.commit()
    await db.refresh(db_sales_log)
    return db_sales_log

async def get_sales_logs(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[SalesLog]:
    result = await db.execute(
        select(SalesLog)
        .options(selectinload(SalesLog.product))
        .offset(skip)
        .limit(limit)
        .order_by(SalesLog.created_at.desc())
    )
    return result.scalars().all()

# Stock operations
async def get_stock_info(db: AsyncSession, product_id: int) -> Optional[StockInfo]:
    # Get product
    product = await get_product(db, product_id)
    if not product:
        return None

    # Fetch all inward and sales logs for this product
    inward_logs = await db.execute(select(InwardLog).where(InwardLog.product_id == product_id))
    inward_logs = inward_logs.scalars().all()
    sales_logs = await db.execute(select(SalesLog).where(SalesLog.product_id == product_id))
    sales_logs = sales_logs.scalars().all()

    # Aggregate per-size and total
    size_keys = set()
    for log in inward_logs + sales_logs:
        if hasattr(log, 'sizes') and isinstance(log.sizes, dict):
            size_keys.update(log.sizes.keys())
    size_keys = sorted(size_keys)

    inward_by_size = {size: 0 for size in size_keys}
    sales_by_size = {size: 0 for size in size_keys}

    for log in inward_logs:
        if hasattr(log, 'sizes') and isinstance(log.sizes, dict):
            for size, qty in log.sizes.items():
                inward_by_size[size] = inward_by_size.get(size, 0) + qty

    for log in sales_logs:
        if hasattr(log, 'sizes') and isinstance(log.sizes, dict):
            for size, qty in log.sizes.items():
                sales_by_size[size] = sales_by_size.get(size, 0) + qty

    stock_by_size = {size: inward_by_size.get(size, 0) - sales_by_size.get(size, 0) for size in size_keys}
    total_inward = sum(inward_by_size.values())
    total_sales = sum(sales_by_size.values())
    current_stock = sum(stock_by_size.values())

    # If StockInfo expects per-size breakdown, add it here; otherwise, just totals
    return StockInfo(
        product=product,
        total_inward=total_inward,
        total_sales=total_sales,
        current_stock=current_stock,
        stock_by_size=stock_by_size if hasattr(StockInfo, 'stock_by_size') else None
    ) 