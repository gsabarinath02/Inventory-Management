from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List, Optional
from ...models.product import Product
from ...schemas.product import ProductCreate, ProductUpdate

def create_product(db: Session, product: ProductCreate) -> Product:
    db_product = Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def get_products(db: Session, skip: int = 0, limit: int = 100) -> List[Product]:
    result = db.execute(select(Product).offset(skip).limit(limit))
    products = result.scalars().all()
    
    # Manually process colors and sizes to ensure they are lists of strings
    for p in products:
        if p.colors and isinstance(p.colors, list) and p.colors and isinstance(p.colors[0], dict):
            p.colors = [c.get("name") for c in p.colors if c.get("name")]
        if p.sizes and isinstance(p.sizes, list) and p.sizes and isinstance(p.sizes[0], dict):
            p.sizes = [s.get("name") for s in p.sizes if s.get("name")]
            
    return products

def get_product(db: Session, product_id: int) -> Optional[Product]:
    result = db.execute(select(Product).where(Product.id == product_id))
    return result.scalar_one_or_none()

def update_product(db: Session, product_id: int, product: ProductUpdate) -> Optional[Product]:
    db_product = get_product(db, product_id)
    if not db_product:
        return None
    
    update_data = product.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_product, field, value)
    
    db.commit()
    db.refresh(db_product)
    return db_product

def delete_product(db: Session, product_id: int) -> bool:
    db_product = get_product(db, product_id)
    if not db_product:
        return False
    
    db.delete(db_product)
    db.commit()
    return True 