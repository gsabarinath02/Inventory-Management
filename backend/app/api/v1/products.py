from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ...database import get_db
from ...schemas.product import Product, ProductOut, ProductUpdate, ProductCreate
from ...core.crud.product import create_product, get_products, get_product, update_product, delete_product
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_new_product_route(payload: ProductCreate, db: Session = Depends(get_db)):
    try:
        return create_product(db=db, product=payload)
    except Exception as e:
        logger.error(f"Error creating product: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[ProductOut])
def read_products_route(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    try:
        products = get_products(db, skip=skip, limit=limit)
        return products
    except Exception as e:
        logger.error(f"Error fetching products: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{product_id}", response_model=ProductOut)
def read_product_route(product_id: int, db: Session = Depends(get_db)):
    try:
        product = get_product(db, product_id=product_id)
        if product is None:
            raise HTTPException(status_code=404, detail="Product not found")
        return product
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching product {product_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{product_id}", response_model=ProductOut)
def update_existing_product_route(product_id: int, product: ProductUpdate, db: Session = Depends(get_db)):
    try:
        updated_product = update_product(db, product_id=product_id, product=product)
        if updated_product is None:
            raise HTTPException(status_code=404, detail="Product not found")
        return updated_product
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating product {product_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_product_route(product_id: int, db: Session = Depends(get_db)):
    try:
        success = delete_product(db, product_id=product_id)
        if not success:
            raise HTTPException(status_code=404, detail="Product not found")
        return {"message": "Product deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting product {product_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e)) 