import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models import SalesLog

@pytest_asyncio.fixture(scope="function", autouse=True)
async def setup_product(client: AsyncClient):
    """Creates a product that can be used by all tests in this module."""
    response = await client.post(
        "/api/products",
        json={"name": "Test Product for Sales", "sku": "SL001", "unit_price": 10.0, "sizes": ["S", "M"], "colors": ["Red", "Blue"]}
    )
    assert response.status_code == 201
    return response.json()

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
    assert log.size == "S"
    assert log.color == "Red"
    assert log.customer == "CustomerA"

@pytest.mark.asyncio
async def test_upload_sales_multiple_rows(client: AsyncClient, db_session: AsyncSession, setup_product):
    product_id = setup_product["id"]
    csv_text = """2025-06-21,RED,Red,3,15.0,S,Red,Sale,CustomerA
2025-06-21,BLUE,Blue,2,12.5,M,Blue,Sale,CustomerB"""
    
    response = await client.post("/api/sales", json={"product_id": product_id, "csv_text": csv_text})
    
    assert response.status_code == 200
    result = response.json()
    assert result["status"] == "success"
    assert result["rows_processed"] == 2
    assert len(result["errors"]) == 0

    logs = (await db_session.execute(select(SalesLog).where(SalesLog.product_id == product_id))).scalars().all()
    assert len(logs) == 2

@pytest.mark.asyncio
async def test_upload_sales_with_zero_price(client: AsyncClient, db_session: AsyncSession, setup_product):
    product_id = setup_product["id"]
    csv_text = "2025-06-21,RED,Red,1,0.00,S,Red,Sample,CustomerB"
    
    response = await client.post("/api/sales", json={"product_id": product_id, "csv_text": csv_text})
    
    assert response.status_code == 200
    result = response.json()
    assert result["status"] == "success"
    assert result["rows_processed"] == 1
    assert len(result["errors"]) == 0
    
    log = (await db_session.execute(select(SalesLog).filter_by(customer="CustomerB"))).scalar_one()
    assert log.unit_price == 0.0

@pytest.mark.asyncio
async def test_upload_sales_with_negative_price(client: AsyncClient, setup_product):
    product_id = setup_product["id"]
    csv_text = "2025-06-21,RED,Red,1,-10.00,S,Red,Sale,CustomerC"
    
    response = await client.post("/api/sales", json={"product_id": product_id, "csv_text": csv_text})
    
    assert response.status_code == 200
    result = response.json()
    assert result["rows_processed"] == 0
    assert any("Unit price must be >= 0" in err for err in result["errors"])

@pytest.mark.asyncio
async def test_upload_sales_with_zero_quantity(client: AsyncClient, setup_product):
    product_id = setup_product["id"]
    csv_text = "2025-06-21,RED,Red,0,15.0,S,Red,Sale,CustomerD"
    
    response = await client.post("/api/sales", json={"product_id": product_id, "csv_text": csv_text})
    
    assert response.status_code == 200
    result = response.json()
    assert result["rows_processed"] == 0
    assert any("Quantity must be > 0" in err for err in result["errors"])

@pytest.mark.asyncio
async def test_upload_sales_malformed_line(client: AsyncClient, setup_product):
    product_id = setup_product["id"]
    csv_text = "2025-06-21,RED,Red,3,15.0,S,Red,Sale\n2025-06-21,BLUE,Blue,2,12.5,M,Blue"  # Missing columns
    
    response = await client.post("/api/sales", json={"product_id": product_id, "csv_text": csv_text})
    
    assert response.status_code == 200
    result = response.json()
    assert result["rows_processed"] == 0
    assert len(result["errors"]) == 2
    assert all("Expected 9 columns" in err for err in result["errors"])

@pytest.mark.asyncio
async def test_upload_sales_invalid_product_id(client: AsyncClient):
    csv_text = "2025-06-21,RED,Red,3,15.0,S,Red,Sale,CustomerA"
    
    response = await client.post("/api/sales", json={"product_id": 99999, "csv_text": csv_text})
    
    assert response.status_code == 404
    assert "not found" in response.json()["detail"] 