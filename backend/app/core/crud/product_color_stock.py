import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.product_color_stock import ProductColorStock
from app.schemas.product_color_stock import ProductColorStockCreate, ProductColorStockUpdate
from app.models.inward import InwardLog, InwardCategory
from app.models.sales import SalesLog

class CRUDProductColorStock:
    async def get_by_product_id(self, db: AsyncSession, *, product_id: int) -> list[ProductColorStock]:
        statement = select(ProductColorStock).where(ProductColorStock.product_id == product_id)
        return (await db.execute(statement)).scalars().all()

    async def get_by_product_and_color(self, db: AsyncSession, *, product_id: int, color: str, colour_code: int | None = None) -> ProductColorStock | None:
        statement = select(ProductColorStock).where(ProductColorStock.product_id == product_id, ProductColorStock.color == color)
        if colour_code is not None:
            statement = statement.where(ProductColorStock.colour_code == colour_code)
        return (await db.execute(statement)).scalar_one_or_none()

    async def create_or_update(self, db: AsyncSession, *, product_id: int, color: str, quantity_change: int, colour_code: int | None = None) -> ProductColorStock:
        # Lock to prevent race conditions
        async with asyncio.Lock():
            # Check if a record already exists
            existing_stock = await self.get_by_product_and_color(db, product_id=product_id, color=color, colour_code=colour_code)

            if existing_stock:
                # Update the stock
                existing_stock.total_stock += quantity_change
                db.add(existing_stock)
                await db.commit()
                await db.refresh(existing_stock)
                return existing_stock
            else:
                # Create a new record
                new_stock = ProductColorStock(
                    product_id=product_id,
                    color=color,
                    total_stock=quantity_change,
                    colour_code=colour_code
                )
                db.add(new_stock)
                await db.commit()
                await db.refresh(new_stock)
                return new_stock

async def get_stock_by_product_and_color(db: AsyncSession, product_id: int, color: str, colour_code: int | None = None):
    statement = select(ProductColorStock).filter_by(product_id=product_id, color=color)
    if colour_code is not None:
        statement = statement.filter(ProductColorStock.colour_code == colour_code)
    result = await db.execute(statement)
    return result.scalar_one_or_none()

async def update_stock_from_log(db: AsyncSession, log: InwardLog | SalesLog, operation: str, colour_code: int | None = None):
    """
    Updates the total stock for a given product and color based on an inward or sales log.
    
    :param db: The database session.
    :param log: The InwardLog or SalesLog instance.
    :param operation: 'CREATE' or 'DELETE'.
    """
    quantity_change = 0
    
    if isinstance(log, InwardLog):
        if log.category == InwardCategory.SUPPLY:
            quantity_change = log.quantity
        else: # RETURN
            quantity_change = -log.quantity
    elif isinstance(log, SalesLog):
        quantity_change = -log.quantity

    if operation == 'DELETE':
        quantity_change = -quantity_change

    stock_entry = await get_stock_by_product_and_color(db, log.product_id, log.color, colour_code)
    
    if stock_entry:
        stock_entry.total_stock += quantity_change
    else:
        stock_entry = ProductColorStock(
            product_id=log.product_id,
            color=log.color,
            total_stock=quantity_change,
            colour_code=colour_code
        )
        db.add(stock_entry)
        
    await db.commit()

# Alias for clarity from old code
crud_product_color_stock = {
    "create_or_update": update_stock_from_log
} 