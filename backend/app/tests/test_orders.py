import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
import pytest
from httpx import AsyncClient
from app.models.orders import Order
from app.models.pending_order import PendingOrder
from sqlalchemy.ext.asyncio import AsyncSession

@pytest.mark.asyncio
async def test_update_order_mirrors_pending_order(async_client: AsyncClient, db_session: AsyncSession):
    # Create an order and pending order
    order = Order(product_id=1, date='2025-07-01', order_number=123, financial_year='2025-2026')
    db_session.add(order)
    await db_session.commit()
    await db_session.refresh(order)
    pending_order = PendingOrder(product_id=1, date='2025-07-01', order_number=123, financial_year='2025-2026')
    db_session.add(pending_order)
    await db_session.commit()
    await db_session.refresh(pending_order)

    # Update the order
    response = await async_client.put(f"/api/v1/orders/{order.id}", json={"date": "2025-07-02"})
    assert response.status_code == 200
    await db_session.refresh(pending_order)
    assert str(pending_order.date) == "2025-07-02"

@pytest.mark.asyncio
async def test_delete_order_mirrors_pending_order(async_client: AsyncClient, db_session: AsyncSession):
    # Create an order and pending order
    order = Order(product_id=1, date='2025-07-01', order_number=124, financial_year='2025-2026')
    db_session.add(order)
    await db_session.commit()
    await db_session.refresh(order)
    pending_order = PendingOrder(product_id=1, date='2025-07-01', order_number=124, financial_year='2025-2026')
    db_session.add(pending_order)
    await db_session.commit()
    await db_session.refresh(pending_order)

    # Delete the order
    response = await async_client.delete(f"/api/v1/orders/{order.id}")
    assert response.status_code == 200
    result = await db_session.execute(
        "SELECT * FROM pending_orders WHERE order_number = :order_number AND financial_year = :financial_year",
        {"order_number": 124, "financial_year": "2025-2026"}
    )
    assert result.first() is None 