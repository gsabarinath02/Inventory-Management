from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.ext.asyncio import AsyncSession
import io
from datetime import date
import logging

from database import get_db
from schemas import InwardLogCreate, UploadResult
from crud import get_product, create_inward_log

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/inward", response_model=UploadResult)
async def upload_inward(
    db: AsyncSession = Depends(get_db),
    product_id: int = Body(..., embed=True),
    csv_text: str = Body(..., embed=True)
):
    """
    Parses a CSV text to create multiple InwardLog entries.
    New format: Date,ColorCode,ColorName,Quantity,UnitCost,Size,Color,Category,Supplier
    """
    logger.info(f"Received inward upload for product_id: {product_id}")
    logger.info(f"CSV text received:\n{csv_text}")

    if not await get_product(db, product_id):
        raise HTTPException(status_code=404, detail=f"Product with ID {product_id} not found.")

    errors = []
    logs_created_count = 0
    sio = io.StringIO(csv_text)

    for row_idx, line in enumerate(sio, start=1):
        logger.info(f"Processing line {row_idx}: '{line.strip()}'")
        if not line.strip():
            continue
        try:
            parts = [p.strip() for p in line.split(',')]
            logger.info(f"Line {row_idx} split into {len(parts)} parts.")
            if len(parts) != 9:
                errors.append(f"Row {row_idx}: Expected 9 columns, found {len(parts)}")
                logger.warning(f"Row {row_idx}: Expected 9 columns, found {len(parts)}. Line: '{line.strip()}'")
                continue

            log_date_str, _, color_name, qty_str, cost_str, size, color, category, supplier = parts
            
            # Validate quantity and unit_cost
            try:
                qty = int(qty_str)
                cost = float(cost_str)
            except Exception as e:
                errors.append(f"Row {row_idx}: Invalid quantity or cost - {e}")
                continue
            if qty <= 0:
                errors.append(f"Row {row_idx}: Quantity must be > 0")
                continue
            if cost < 0:
                errors.append(f"Row {row_idx}: Unit cost must be >= 0")
                continue

            log_data = InwardLogCreate(
                product_id=product_id,
                quantity=qty,
                unit_cost=cost,
                size=size,
                color=color, # Using the second color field as the primary one
                color_name=color_name,
                category=category,
                supplier=supplier,
                notes=f"Uploaded on {log_date_str}",
            )
            
            await create_inward_log(db, log_data)
            logs_created_count += 1
            
        except Exception as e:
            errors.append(f"Row {row_idx}: An unexpected error occurred - {e}")
            logger.error(f"Row {row_idx}: Exception - {e}", exc_info=True)
            
    logger.info(f"Finished processing inward upload. Logs created: {logs_created_count}, Errors: {len(errors)}")
    return UploadResult(status="success", rows_processed=logs_created_count, errors=errors) 