from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import logging
from app.api.deps import get_db
from app.core.crud.product import get_product
from app.core.crud.inward import get_inward_logs_by_product
from app.core.crud.sales import get_sales_logs_by_product
from app.schemas.stock import StockMatrix, DetailedStockData, StockMovement

router = APIRouter()

@router.get(
    "/{product_id}", 
    response_model=StockMatrix,
    summary="Get stock matrix for a product",
    description="Calculates and returns the current stock levels for each color/size variant of a product."
)
def get_stock_matrix(
    product_id: int,
    db: Session = Depends(get_db)
):
    try:
        product = get_product(db, product_id=product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        # Defensive check for colors and sizes
        if not product.colors or not product.sizes:
            return {}

        inward_logs = get_inward_logs_by_product(db, product_id=product_id)
        sales_logs = get_sales_logs_by_product(db, product_id=product_id)

        stock_matrix = {color: {size: 0 for size in product.sizes} for color in product.colors}

        for log in inward_logs:
            if log.color in stock_matrix and log.size in stock_matrix[log.color]:
                if log.category == 'Supply':
                    stock_matrix[log.color][log.size] += log.quantity
                elif log.category == 'Return':
                    stock_matrix[log.color][log.size] -= log.quantity

        for log in sales_logs:
            if log.color in stock_matrix and log.size in stock_matrix[log.color]:
                stock_matrix[log.color][log.size] -= log.quantity
        
        # Calculate totals for each color
        for color, sizes in stock_matrix.items():
            total = sum(sizes.values())
            stock_matrix[color]['total'] = total

        return stock_matrix
    except Exception as e:
        logging.error(f"Error calculating stock matrix for product {product_id}: {e}")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@router.get(
    "/{product_id}/detailed", 
    response_model=DetailedStockData,
    summary="Get detailed stock information for a product",
    description="Returns detailed information about the stock levels of a product."
)
def get_detailed_stock(
    product_id: int,
    db: Session = Depends(get_db)
):
    product = get_product(db, product_id=product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    inward_logs = get_inward_logs_by_product(db, product_id=product_id)
    sales_logs = get_sales_logs_by_product(db, product_id=product_id)

    return {
        "product": product,
        "inward_logs": inward_logs,
        "sales_logs": sales_logs,
    } 