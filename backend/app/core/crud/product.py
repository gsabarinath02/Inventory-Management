from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from ...models.product import Product
from ...schemas.product import ProductCreate, ProductUpdate

async def create_product(db: AsyncSession, product: ProductCreate) -> Product:
    db_product = Product(**product.model_dump())
    db.add(db_product)
    await db.commit()
    await db.refresh(db_product)
    return db_product

async def get_products(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Product]:
    result = await db.execute(select(Product).offset(skip).limit(limit))
    products = result.scalars().all()
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