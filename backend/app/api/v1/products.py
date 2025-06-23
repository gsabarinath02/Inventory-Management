from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from sqlalchemy.exc import IntegrityError

from ...database import get_db
from ...api.deps import get_current_user, require_manager_or_admin, require_admin
from ...schemas.product import Product, ProductOut, ProductUpdate, ProductCreate
from ...core.crud.product import create_product, get_products, get_product, update_product, delete_product
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
async def create_new_product_route(
    payload: ProductCreate, 
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_manager_or_admin)
):
    try:
        return await create_product(db=db, product=payload)
    except IntegrityError as e:
        if "ix_products_sku" in str(e.orig) or "unique constraint" in str(e.orig):
            raise HTTPException(status_code=400, detail="SKU already exists.")
        logger.error(f"IntegrityError creating product: {e}")
        raise HTTPException(status_code=400, detail="Integrity error: " + str(e.orig))
    except Exception as e:
        logger.error(f"Error creating product: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[ProductOut])
async def read_products_route(
    skip: int = 0, 
    limit: int = 100, 
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        products = await get_products(db, skip=skip, limit=limit)
        return products
    except Exception as e:
        logger.error(f"Error fetching products: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{product_id}", response_model=ProductOut)
async def read_product_route(
    product_id: int, 
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        product = await get_product(db, product_id=product_id)
        if product is None:
            raise HTTPException(status_code=404, detail="Product not found")
        return product
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching product {product_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{product_id}", response_model=ProductOut)
async def update_existing_product_route(
    product_id: int, 
    product: ProductUpdate, 
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_manager_or_admin)
):
    try:
        updated_product = await update_product(db, product_id=product_id, product=product)
        if updated_product is None:
            raise HTTPException(status_code=404, detail="Product not found")
        return updated_product
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating product {product_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_product_route(
    product_id: int, 
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_admin)
):
    try:
        success = await delete_product(db, product_id=product_id)
        if not success:
            raise HTTPException(status_code=404, detail="Product not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting product {product_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e)) 