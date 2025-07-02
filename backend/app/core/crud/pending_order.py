from app.models.pending_order import PendingOrder
from app.schemas.pending_order import PendingOrderCreate, PendingOrderUpdate
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from datetime import date, datetime
from app.core.crud.sales import create_sales_log
from app.schemas.sales import SalesLogCreate
from app.models.orders import Order
from app.models.sales import SalesLog
import logging
from app.core.crud.audit_log import create_audit_log
from app.schemas.audit_log import AuditLogCreate

async def create_pending_order(db: AsyncSession, pending_order: PendingOrderCreate, order_number: int, financial_year: str) -> PendingOrder:
    db_pending_order = PendingOrder(
        order_number=order_number,
        financial_year=financial_year,
        **pending_order.model_dump()
    )
    db.add(db_pending_order)
    await db.commit()
    await db.refresh(db_pending_order)
    return db_pending_order

async def update_pending_order(db: AsyncSession, pending_order_id: int, pending_order: PendingOrderUpdate) -> Optional[PendingOrder]:
    result = await db.execute(select(PendingOrder).filter(PendingOrder.id == pending_order_id))
    db_pending_order = result.scalar_one_or_none()
    if db_pending_order:
        update_data = pending_order.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_pending_order, field, value)
        await db.commit()
        await db.refresh(db_pending_order)
    return db_pending_order

async def delete_pending_order(db: AsyncSession, pending_order_id: int) -> bool:
    result = await db.execute(select(PendingOrder).filter(PendingOrder.id == pending_order_id))
    db_pending_order = result.scalar_one_or_none()
    if db_pending_order:
        await db.delete(db_pending_order)
        await db.commit()
        return True
    return False

async def get_pending_orders(db: AsyncSession, product_id: int, skip: int = 0, limit: int = 100) -> List[PendingOrder]:
    result = await db.execute(
        select(PendingOrder).filter(PendingOrder.product_id == product_id).offset(skip).limit(limit)
    )
    return result.scalars().all()

async def get_pending_order_by_id(db: AsyncSession, pending_order_id: int) -> Optional[PendingOrder]:
    result = await db.execute(select(PendingOrder).filter(PendingOrder.id == pending_order_id))
    return result.scalar_one_or_none()

async def deliver_pending_order(db: AsyncSession, pending_order: PendingOrder, delivered_sizes: dict, delivery_date: str):
    # Calculate remaining sizes
    original_sizes = pending_order.sizes or {}
    delivered = {k: min(delivered_sizes.get(k, 0), original_sizes.get(k, 0)) for k in original_sizes}
    remaining = {k: original_sizes.get(k, 0) - delivered.get(k, 0) for k in original_sizes}
    # Remove zero or negative sizes
    delivered = {k: v for k, v in delivered.items() if v > 0}
    remaining = {k: v for k, v in remaining.items() if v > 0}
    # Create sales log for delivered part
    if delivered:
        sales_log = SalesLogCreate(
            product_id=pending_order.product_id,
            color=pending_order.color,
            colour_code=pending_order.colour_code,
            sizes=delivered,
            date=datetime.strptime(delivery_date, "%Y-%m-%d").date(),
            agency_name=pending_order.agency_name,
            store_name=pending_order.store_name,
            operation="Sale",
            order_number=pending_order.order_number
        )
        await create_sales_log(db, sales_log)
    # After delivery, recalculate pending from order and all sales logs
    # Fetch the order
    result = await db.execute(select(Order).filter(Order.order_number == pending_order.order_number, Order.product_id == pending_order.product_id))
    db_order = result.scalar_one_or_none()
    if db_order:
        order_sizes = db_order.sizes or {}
        # Sum all delivered for this order
        sales_logs = await db.execute(select(SalesLog).filter(SalesLog.order_number == db_order.order_number, SalesLog.product_id == db_order.product_id))
        sales_logs = sales_logs.scalars().all()
        delivered_total = {}
        for log in sales_logs:
            for size, qty in (log.sizes or {}).items():
                delivered_total[size] = delivered_total.get(size, 0) + qty
        new_pending = {}
        for size, order_qty in order_sizes.items():
            delivered_qty = delivered_total.get(size, 0)
            pending_qty = order_qty - delivered_qty
            if pending_qty > 0:
                new_pending[size] = pending_qty
        logger = logging.getLogger("pending-order-invariant")
        logger.info(f"[INVARIANT-DEBUG] Order #{db_order.order_number} sizes: {order_sizes}")
        logger.info(f"[INVARIANT-DEBUG] Delivered totals: {delivered_total}")
        logger.info(f"[INVARIANT-DEBUG] New pending: {new_pending}")
        # --- AUDIT LOG for delivery ---
        await create_audit_log(
            db,
            AuditLogCreate(
                user_id=None,  # You can pass user info if available
                username="system",
                action="DELIVER_PENDING_ORDER",
                entity="PendingOrder",
                entity_id=pending_order.id,
                field_changed=None,
                old_value=str(original_sizes),
                new_value=str(delivered),
            )
        )
        # ---
        if not new_pending:
            await db.delete(pending_order)
            await db.commit()
            return {"status": "delivered", "action": "removed"}
        else:
            pending_order.sizes = new_pending
            await db.commit()
            await db.refresh(pending_order)
            return {"status": "partially_delivered", "remaining": new_pending}
    else:
        # If order not found, fallback to old logic
        # --- AUDIT LOG for delivery ---
        await create_audit_log(
            db,
            AuditLogCreate(
                user_id=None,
                username="system",
                action="DELIVER_PENDING_ORDER",
                entity="PendingOrder",
                entity_id=pending_order.id,
                field_changed=None,
                old_value=str(original_sizes),
                new_value=str(delivered),
            )
        )
        # ---
        if not remaining:
            await db.delete(pending_order)
            await db.commit()
            return {"status": "delivered", "action": "removed"}
        else:
            pending_order.sizes = remaining
            await db.commit()
            await db.refresh(pending_order)
            return {"status": "partially_delivered", "remaining": remaining}

async def get_all_pending_orders(db: AsyncSession):
    result = await db.execute(select(PendingOrder))
    orders = result.scalars().all()
    return orders 