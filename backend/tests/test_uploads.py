# This file is kept for backward compatibility but tests have been moved to:
# - test_inward.py for inward upload tests
# - test_sales.py for sales upload tests

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models import InwardLog, SalesLog

@pytest_asyncio.fixture(scope="function", autouse=True)
async def setup_product(client: AsyncClient):
    """Creates a product that can be used by all tests in this module."""
    response = await client.post(
        "/api/products",
        json={"name": "Test Product for Uploads", "sku": "UP001", "unit_price": 10.0, "sizes": ["S"], "colors": ["Red"]}
    )
    assert response.status_code == 201
    return response.json()

# Legacy tests - kept for backward compatibility
@pytest.mark.asyncio
async def test_upload_inward_csv_valid(client: AsyncClient, db_session: AsyncSession, setup_product):
    product_id = setup_product["id"]
    csv_text = "2025-06-21,RED,Red,10,5.50,S,Red,Supply,SupplierA"
    
    response = await client.post("/api/inward", json={"product_id": product_id, "csv_text": csv_text})
    
    assert response.status_code == 200
    result = response.json()
    assert result["status"] == "success"
    assert result["rows_processed"] == 1
    assert len(result["errors"]) == 0

    log = (await db_session.execute(select(InwardLog).where(InwardLog.product_id == product_id))).scalar_one()
    assert log.quantity == 10
    assert log.unit_cost == 5.50

@pytest.mark.asyncio
async def test_upload_sales_csv_valid(client: AsyncClient, db_session: AsyncSession, setup_product):
    product_id = setup_product["id"]
    csv_text = "2025-06-21,RED,Red,3,15.0,S,Red,Sale,CustomerA"
    
    response = await client.post("/api/sales", json={"product_id": product_id, "csv_text": csv_text})
    
    assert response.status_code == 200
    result = response.json()
    assert result["status"] == "success"
    assert result["rows_processed"] == 1
    assert len(result["errors"]) == 0

    log = (await db_session.execute(select(SalesLog).where(SalesLog.product_id == product_id))).scalar_one()
    assert log.quantity == 3
    assert log.unit_price == 15.0 