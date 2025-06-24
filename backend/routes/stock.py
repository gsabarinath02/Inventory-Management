from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Dict, List

from database import get_db
from app.models import Product, InwardLog, SalesLog
from crud import get_product
from schemas import InwardLog as InwardLogSchema, SalesLog as SalesLogSchema

router = APIRouter()

@router.get("/stock/{product_id}")
async def get_stock(product_id: int, db: AsyncSession = Depends(get_db)):
    """
    Get stock matrix for a product grouped by color and then by size.
    Returns: { [color: string]: { [size: string]: number } }
    """
    product = await get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    try:
        # Get all inward logs for the product
        inward_result = await db.execute(
            select(InwardLog.color, InwardLog.size, func.sum(InwardLog.quantity))
            .where(InwardLog.product_id == product_id)
            .group_by(InwardLog.color, InwardLog.size)
        )
        inward_data = inward_result.all()
        
        # Get all sales logs for the product
        sales_result = await db.execute(
            select(SalesLog.color, SalesLog.size, func.sum(SalesLog.quantity))
            .where(SalesLog.product_id == product_id)
            .group_by(SalesLog.color, SalesLog.size)
        )
        sales_data = sales_result.all()
        
        # Process into a nested dictionary for stock calculation
        inward_dict: Dict[str, Dict[str, int]] = {}
        sales_dict: Dict[str, Dict[str, int]] = {}
        
        for color, size, quantity in inward_data:
            color_key = color or "N/A"
            size_key = size or "N/A"
            if color_key not in inward_dict:
                inward_dict[color_key] = {}
            inward_dict[color_key][size_key] = quantity

        for color, size, quantity in sales_data:
            color_key = color or "N/A"
            size_key = size or "N/A"
            if color_key not in sales_dict:
                sales_dict[color_key] = {}
            sales_dict[color_key][size_key] = quantity
        
        # Calculate stock matrix: { [color: string]: { [size: string]: number, "total": int } }
        stock_matrix: Dict[str, Dict[str, int]] = {}
        
        # Get all unique color-size combinations
        all_combinations = set()
        for color in inward_dict:
            for size in inward_dict[color]:
                all_combinations.add((color, size))
        for color in sales_dict:
            for size in sales_dict[color]:
                all_combinations.add((color, size))
        
        for color, size in all_combinations:
            inward_qty = inward_dict.get(color, {}).get(size, 0)
            sales_qty = sales_dict.get(color, {}).get(size, 0)
            stock = inward_qty - sales_qty
            
            if color not in stock_matrix:
                stock_matrix[color] = {}
            stock_matrix[color][size] = stock
            
        # Add total for each color row
        for color in stock_matrix:
            total = sum([v for k, v in stock_matrix[color].items() if k != "total"])
            stock_matrix[color]["total"] = total
        
        return stock_matrix
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating stock matrix: {str(e)}")

@router.get("/stock/{product_id}/detailed")
async def get_detailed_stock(product_id: int, db: AsyncSession = Depends(get_db)):
    """
    Get detailed stock information including agency, party name, color codes, and categories.
    Returns detailed inward and sales logs with all fields.
    """
    product = await get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    try:
        # Get all inward logs for the product
        inward_result = await db.execute(
            select(InwardLog)
            .where(InwardLog.product_id == product_id)
            .order_by(InwardLog.created_at.desc())
        )
        inward_logs = inward_result.scalars().all()
        
        # Get all sales logs for the product
        sales_result = await db.execute(
            select(SalesLog)
            .where(SalesLog.product_id == product_id)
            .order_by(SalesLog.created_at.desc())
        )
        sales_logs = sales_result.scalars().all()
        
        # Convert to schemas
        inward_data = [InwardLogSchema.model_validate(log) for log in inward_logs]
        sales_data = [SalesLogSchema.model_validate(log) for log in sales_logs]
        
        return {
            "product": product,
            "inward_logs": inward_data,
            "sales_logs": sales_data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching detailed stock: {str(e)}") 