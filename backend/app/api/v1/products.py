from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from sqlalchemy.exc import IntegrityError
import json

from ...database import get_db
from ...api.deps import require_admin, get_current_user
from ...schemas.product import Product, ProductOut, ProductUpdate, ProductCreate
from ...schemas.user import User
from ...core.crud.product import create_product, get_products, get_product, update_product, delete_product
from ...core.crud.audit_log import create_audit_log
from ...schemas.audit_log import AuditLogCreate
from ...core.logging_context import current_user_var
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
async def create_new_product_route(
    payload: ProductCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logger.debug(f"Received payload for product creation: {payload}")
    try:
        # Set user context for audit logging
        current_user_var.set(current_user)
        
        product = await create_product(db=db, product=payload)
        await create_audit_log(
            db,
            AuditLogCreate(
                user_id=current_user.id,
                username=current_user.email,
                action="PRODUCT_CREATE",
                entity="Product",
                entity_id=product.id,
                field_changed=None,
                old_value=None,
                new_value=json.dumps(ProductOut.model_validate(product).model_dump(), default=str)
            )
        )
        return ProductOut.model_validate(product)
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
    db: AsyncSession = Depends(get_db)
):
    try:
        products = await get_products(db, skip=skip, limit=limit)
        return [ProductOut.model_validate(p) for p in products]
    except Exception as e:
        logger.error(f"Error fetching products: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{product_id}", response_model=ProductOut)
async def read_product_route(
    product_id: int, 
    db: AsyncSession = Depends(get_db)
):
    try:
        product = await get_product(db, product_id=product_id)
        if product is None:
            raise HTTPException(status_code=404, detail="Product not found")
        return ProductOut.model_validate(product)
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
    current_user: User = Depends(get_current_user)
):
    try:
        # Set user context for audit logging
        current_user_var.set(current_user)
        
        old_product = await get_product(db, product_id=product_id)
        updated_product = await update_product(db, product_id=product_id, product=product)
        if updated_product is None:
            raise HTTPException(status_code=404, detail="Product not found")
        await create_audit_log(
            db,
            AuditLogCreate(
                user_id=current_user.id,
                username=current_user.email,
                action="PRODUCT_UPDATE",
                entity="Product",
                entity_id=product_id,
                field_changed=None,
                old_value=json.dumps(ProductOut.model_validate(old_product).model_dump(), default=str) if old_product else None,
                new_value=json.dumps(ProductOut.model_validate(updated_product).model_dump(), default=str)
            )
        )
        return ProductOut.model_validate(updated_product)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating product {product_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_product_route(
    product_id: int, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    try:
        # Set user context for audit logging
        current_user_var.set(current_user)
        
        product = await get_product(db, product_id=product_id)
        success = await delete_product(db, product_id=product_id)
        if not success:
            raise HTTPException(status_code=404, detail="Product not found")
        # Defensive: Only log if product is a valid instance and serialization works
        old_value = json.dumps(ProductOut.model_validate(product).model_dump(), default=str)
        try:
            await create_audit_log(
                db,
                AuditLogCreate(
                    user_id=current_user.id,
                    username=current_user.email,
                    action="PRODUCT_DELETE",
                    entity="Product",
                    entity_id=product_id,
                    field_changed=None,
                    old_value=old_value,
                    new_value=None
                )
            )
        except Exception as e:
            logger.error(f"Audit log creation failed for product {product_id}: {e}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting product {product_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e)) 