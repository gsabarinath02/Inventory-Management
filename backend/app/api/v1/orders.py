from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import date
from ...database import get_db
from ...core.crud import orders as orders_crud
from ...schemas.orders import OrderCreate, OrderUpdate, OrderResponse, OrderBulkCreate, OrderBulkResponse
from ...core.crud.audit_log import create_audit_log
from ...schemas.audit_log import AuditLogCreate
from ...api.deps import get_current_user
from ...models.user import User
import json
from fastapi.responses import StreamingResponse
import io
from openpyxl import Workbook
from openpyxl.drawing.image import Image as XLImage
import os
from pydantic import BaseModel
from openpyxl.styles import Alignment, Font, PatternFill, Border, Side

router = APIRouter()

class OrderExportHeaders(BaseModel):
    party_name: str = ""
    destination: str = ""
    style: str = ""
    code: str = ""
    date: str = ""

@router.post("/orders/export-excel")
async def export_orders_excel(
    headers: OrderExportHeaders = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Export all orders as an Excel file with logo and custom headers"""
    orders = await orders_crud.get_all_orders(db, skip=0, limit=10000)

    wb = Workbook()
    ws = wb.active
    ws.title = "Orders"

    # Insert logo (A1, merged A1:B5)
    logo_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../Backstitch-logo.png'))
    if os.path.exists(logo_path):
        img = XLImage(logo_path)
        img.width = 120
        img.height = 120
        ws.add_image(img, 'A1')
    ws.merge_cells('A1:B5')

    # Merge and style header cells
    ws.merge_cells('C1:J1')
    ws['C1'] = 'Style'
    ws['C1'].font = Font(bold=True)
    ws['C1'].alignment = Alignment(horizontal='center', vertical='center')
    ws['C2'] = headers.style
    ws['C3'] = headers.code
    ws.merge_cells('C2:J2')
    ws.merge_cells('C3:J3')
    ws['C2'].alignment = Alignment(horizontal='left')
    ws['C3'].alignment = Alignment(horizontal='left')

    ws.merge_cells('K1:L1')
    ws['K1'] = 'Party Name'
    ws['K1'].font = Font(bold=True)
    ws['K1'].alignment = Alignment(horizontal='center', vertical='center')
    ws.merge_cells('K2:L2')
    ws['K2'] = headers.party_name
    ws['K2'].alignment = Alignment(horizontal='left')

    ws.merge_cells('K3:L3')
    ws['K3'] = 'Destination'
    ws['K3'].font = Font(bold=True)
    ws['K3'].alignment = Alignment(horizontal='center', vertical='center')
    ws.merge_cells('K4:L4')
    ws['K4'] = headers.destination
    ws['K4'].alignment = Alignment(horizontal='left')

    ws.merge_cells('C4:J4')
    ws['C4'] = 'Transport - With Pass'
    ws['C4'].alignment = Alignment(horizontal='center')
    ws.merge_cells('K5:L5')
    ws['K5'] = 'Date'
    ws['K5'].font = Font(bold=True)
    ws['K5'].alignment = Alignment(horizontal='center', vertical='center')
    ws.merge_cells('K6:L6')
    ws['K6'] = headers.date
    ws['K6'].alignment = Alignment(horizontal='left')

    # --- Table header ---
    size_columns = ['S', 'M', 'L', 'XL', 'XXL', '3XL', '4X', '5X']
    table_header = ["Color col", "Color"] + size_columns + ["Total"]
    ws.append(table_header)
    header_row = ws[7]
    for cell in header_row:
        cell.font = Font(bold=True)
        cell.alignment = Alignment(horizontal='center', vertical='center')
        cell.fill = PatternFill(start_color='FFD966', end_color='FFD966', fill_type='solid')
        cell.border = Border(left=Side(style='thin'), right=Side(style='thin'), top=Side(style='thin'), bottom=Side(style='thin'))

    # --- Table data ---
    row_num = 8
    for idx, order in enumerate(orders):
        sizes = order.sizes or {}
        row = [
            order.colour_code or '',
            order.color or '',
        ] + [sizes.get(size, 0) for size in size_columns] + [sum(sizes.get(size, 0) for size in size_columns)]
        ws.append(row)
        # Zebra striping
        fill = PatternFill(start_color='FFF2CC', end_color='FFF2CC', fill_type='solid') if idx % 2 == 0 else PatternFill(start_color='D9E1F2', end_color='D9E1F2', fill_type='solid')
        for col in range(1, len(row) + 1):
            cell = ws.cell(row=row_num, column=col)
            cell.fill = fill
            cell.border = Border(left=Side(style='thin'), right=Side(style='thin'), top=Side(style='thin'), bottom=Side(style='thin'))
        row_num += 1

    # Set column widths
    for col, width in zip('ABCDEFGHIJKL', [10, 18, 6, 6, 6, 6, 6, 6, 6, 6, 10, 10]):
        ws.column_dimensions[col].width = width

    # Enable autofilter
    ws.auto_filter.ref = f"A7:L{row_num-1}"

    # Save to bytes
    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=orders-log.xlsx"}
    )

@router.post("/products/{product_id}/orders", response_model=OrderResponse)
async def create_order(
    product_id: int,
    order: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new order for a product"""
    if order.product_id != product_id:
        raise HTTPException(status_code=400, detail="Product ID mismatch")
    
    db_order = await orders_crud.create_order(db, order)
    
    # Log the audit event
    await create_audit_log(
        db,
        AuditLogCreate(
            user_id=current_user.id,
            username=current_user.email,
            action="CREATE",
            entity="Order",
            entity_id=db_order.id,
            field_changed="order_number",
            new_value=str(db_order.order_number)
        )
    )
    
    return db_order

@router.get("/products/{product_id}/orders", response_model=List[OrderResponse])
async def get_orders(
    product_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    start_date: Optional[date] = Query(None, description="Start date for filtering (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="End date for filtering (YYYY-MM-DD)"),
    agency_name: Optional[str] = Query(None, description="Filter by agency name"),
    store_name: Optional[str] = Query(None, description="Filter by store name"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all orders for a product with optional filtering"""
    orders = await orders_crud.get_orders(
        db, 
        product_id, 
        skip=skip, 
        limit=limit,
        start_date=start_date,
        end_date=end_date,
        agency_name=agency_name,
        store_name=store_name
    )
    return orders

@router.get("/orders/", response_model=List[OrderResponse])
async def get_all_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all orders"""
    orders = await orders_crud.get_all_orders(db, skip=skip, limit=limit)
    return orders

@router.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific order by ID"""
    order = await orders_crud.get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.put("/orders/{order_id}", response_model=OrderResponse)
async def update_order(
    order_id: int,
    order: OrderUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing order"""
    db_order = await orders_crud.update_order(db, order_id, order)
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Log the audit event
    await create_audit_log(
        db,
        AuditLogCreate(
            user_id=current_user.id,
            username=current_user.email,
            action="UPDATE",
            entity="Order",
            entity_id=order_id
        )
    )
    
    return db_order

@router.delete("/orders/{order_id}")
async def delete_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an order"""
    success = await orders_crud.delete_order(db, order_id)
    if not success:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Log the audit event
    await create_audit_log(
        db,
        AuditLogCreate(
            user_id=current_user.id,
            username=current_user.email,
            action="DELETE",
            entity="Order",
            entity_id=order_id
        )
    )
    
    return {"message": "Order deleted successfully"}

@router.post("/products/{product_id}/orders/bulk", response_model=OrderBulkResponse)
async def create_orders_bulk(
    product_id: int,
    bulk_data: OrderBulkCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create multiple orders for a product"""
    # Validate that all orders have the correct product_id
    for order in bulk_data.orders:
        if order.product_id != product_id:
            raise HTTPException(status_code=400, detail="Product ID mismatch in bulk data")
    
    try:
        created_orders = await orders_crud.create_orders_bulk(db, bulk_data.orders)
        
        # Log the audit event
        await create_audit_log(
            db,
            AuditLogCreate(
                user_id=current_user.id,
                username=current_user.email,
                action="BULK_CREATE",
                entity="Order",
                entity_id=0,
                field_changed="count",
                new_value=str(len(created_orders))
            )
        )
        
        return OrderBulkResponse(rows_processed=len(created_orders))
    except Exception as e:
        return OrderBulkResponse(rows_processed=0, errors=[str(e)])

@router.delete("/products/{product_id}/orders/bulk")
async def delete_orders_bulk(
    product_id: int,
    date: date,
    agency_name: Optional[str] = None,
    store_name: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete orders for a specific date and optionally agency/store"""
    deleted_count = await orders_crud.delete_orders_bulk(db, date, agency_name, store_name)
    
    # Log the audit event
    await create_audit_log(
        db,
        AuditLogCreate(
            user_id=current_user.id,
            username=current_user.email,
            action="BULK_DELETE",
            entity="Order",
            entity_id=0,
            field_changed="count",
            old_value=str(deleted_count)
        )
    )
    
    return {"message": f"Deleted {deleted_count} orders successfully"} 