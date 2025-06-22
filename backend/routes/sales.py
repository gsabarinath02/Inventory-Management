from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.ext.asyncio import AsyncSession
import io
from datetime import date

from database import get_db
from schemas import SalesLogCreate, UploadResult
from crud import get_product, create_sales_log

router = APIRouter()

@router.post("/sales", response_model=UploadResult)
async def upload_sales(
    db: AsyncSession = Depends(get_db),
    product_id: int = Body(..., embed=True),
    csv_text: str = Body(..., embed=True)
):
    """
    Parses a CSV text to create multiple SalesLog entries.
    Format: Date,ColorCode,ColorName,Quantity,UnitPrice,Size,Color,Category,Stakeholder
    """
    if not await get_product(db, product_id):
        raise HTTPException(status_code=404, detail=f"Product with ID {product_id} not found.")

    errors = []
    logs_created_count = 0
    sio = io.StringIO(csv_text)

    for row_idx, line in enumerate(sio, start=1):
        if not line.strip():
            continue
        try:
            parts = [p.strip() for p in line.split(',')]
            if len(parts) != 9:
                errors.append(f"Row {row_idx}: Expected 9 columns, found {len(parts)}")
                continue

            log_date_str, _, color_name, qty_str, price_str, size, color, category, stakeholder = parts

            # Validate quantity and unit_price
            try:
                qty = int(qty_str)
                price = float(price_str)
            except Exception as e:
                errors.append(f"Row {row_idx}: Invalid quantity or price - {e}")
                continue
            if qty <= 0:
                errors.append(f"Row {row_idx}: Quantity must be > 0")
                continue
            if price < 0:
                errors.append(f"Row {row_idx}: Unit price must be >= 0")
                continue

            log_data = SalesLogCreate(
                product_id=product_id,
                quantity=qty,
                unit_price=price,
                size=size,
                color=color,
                color_name=color_name,
                category=category,
                customer=stakeholder,
                notes=f"Uploaded on {log_date_str}",
            )

            await create_sales_log(db, log_data)
            logs_created_count += 1

        except Exception as e:
            errors.append(f"Row {row_idx}: An unexpected error occurred - {e}")

    return UploadResult(status="success", rows_processed=logs_created_count, errors=errors) 