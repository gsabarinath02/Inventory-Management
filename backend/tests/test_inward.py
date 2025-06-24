import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import InwardLog

@pytest_asyncio.fixture(scope="function", autouse=True)
async def setup_product(async_client: AsyncClient):
    """Creates a product that can be used by all tests in this module."""
    response = await async_client.post(
        "/api/v1/products/",
        json={"name": "Test Product for Inward", "sku": "IN001", "unit_price": 10.0, "sizes": ["S", "M"], "colors": [{"color": "Red", "colour_code": 101}, {"color": "Blue", "colour_code": 102}]}
    )
    assert response.status_code == 201
    return response.json()

@pytest.mark.asyncio
async def test_upload_inward_csv_valid(async_client: AsyncClient, db_session: AsyncSession, setup_product):
    product_id = setup_product["id"]
    csv_text = "2025-06-21,RED,Red,10,5.50,S,Red,Supply,SupplierA"
    
    response = await async_client.post("/api/inward", json={"product_id": product_id, "csv_text": csv_text})
    
    assert response.status_code == 200
    result = response.json()
    assert result["status"] == "success"
    assert result["rows_processed"] == 1
    assert len(result["errors"]) == 0

    log = (await db_session.execute(select(InwardLog).where(InwardLog.product_id == product_id))).scalar_one()
    assert log.quantity == 10
    assert log.unit_cost == 5.50
    assert log.size == "S"
    assert log.color == "Red"
    assert log.supplier == "SupplierA"

@pytest.mark.asyncio
async def test_upload_inward_multiple_rows(async_client: AsyncClient, db_session: AsyncSession, setup_product):
    product_id = setup_product["id"]
    csv_text = """2025-06-21,RED,Red,10,5.50,S,Red,Supply,SupplierA
2025-06-21,BLUE,Blue,5,7.25,M,Blue,Supply,SupplierB"""
    
    response = await async_client.post("/api/inward", json={"product_id": product_id, "csv_text": csv_text})
    
    assert response.status_code == 200
    result = response.json()
    assert result["status"] == "success"
    assert result["rows_processed"] == 2
    assert len(result["errors"]) == 0

    logs = (await db_session.execute(select(InwardLog).where(InwardLog.product_id == product_id))).scalars().all()
    assert len(logs) == 2

@pytest.mark.asyncio
async def test_upload_inward_with_zero_cost(async_client: AsyncClient, db_session: AsyncSession, setup_product):
    product_id = setup_product["id"]
    csv_text = "2025-06-21,RED,Red,1,0.00,S,Red,Sample,SupplierB"
    
    response = await async_client.post("/api/inward", json={"product_id": product_id, "csv_text": csv_text})
    
    assert response.status_code == 200
    result = response.json()
    assert result["status"] == "success"
    assert result["rows_processed"] == 1
    assert len(result["errors"]) == 0
    
    log = (await db_session.execute(select(InwardLog).filter_by(supplier="SupplierB"))).scalar_one()
    assert log.unit_cost == 0.0

@pytest.mark.asyncio
async def test_upload_inward_with_negative_cost(async_client: AsyncClient, setup_product):
    product_id = setup_product["id"]
    csv_text = "2025-06-21,RED,Red,1,-10.00,S,Red,Supply,SupplierC"
    
    response = await async_client.post("/api/inward", json={"product_id": product_id, "csv_text": csv_text})
    
    assert response.status_code == 200
    result = response.json()
    assert result["rows_processed"] == 0
    assert any("Unit cost must be >= 0" in err for err in result["errors"])

@pytest.mark.asyncio
async def test_upload_inward_with_zero_quantity(async_client: AsyncClient, setup_product):
    product_id = setup_product["id"]
    csv_text = "2025-06-21,RED,Red,0,5.50,S,Red,Supply,SupplierD"
    
    response = await async_client.post("/api/inward", json={"product_id": product_id, "csv_text": csv_text})
    
    assert response.status_code == 200
    result = response.json()
    assert result["rows_processed"] == 0
    assert any("Quantity must be > 0" in err for err in result["errors"])

@pytest.mark.asyncio
async def test_upload_inward_malformed_line(async_client: AsyncClient, setup_product):
    product_id = setup_product["id"]
    csv_text = "2025-06-21,RED,Red,10,5.50,S,Red,Supply\n2025-06-21,BLUE,Blue,5,7.25,M,Blue"  # Missing columns
    
    response = await async_client.post("/api/inward", json={"product_id": product_id, "csv_text": csv_text})
    
    assert response.status_code == 200
    result = response.json()
    assert result["rows_processed"] == 0
    assert len(result["errors"]) == 2
    assert all("Expected 9 columns" in err for err in result["errors"])

@pytest.mark.asyncio
async def test_upload_inward_invalid_product_id(async_client: AsyncClient):
    csv_text = "2025-06-21,RED,Red,10,5.50,S,Red,Supply,SupplierA"
    
    response = await async_client.post("/api/inward", json={"product_id": 99999, "csv_text": csv_text})
    
    assert response.status_code == 404
    assert "not found" in response.json()["detail"]

@pytest.mark.asyncio
async def test_create_inward_log_with_colour_code(async_client: AsyncClient, db_session: AsyncSession, setup_product):
    product_id = setup_product["id"]
    payload = {
        "product_id": product_id,
        "color": "Red",
        "colour_code": 101,
        "size": "S",
        "quantity": 5,
        "date": "2025-06-25",
        "category": "Supply",
        "stakeholder_name": "Tester"
    }
    response = await async_client.post("/api/v1/inward/", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["colour_code"] == 101
    assert data["color"] == "Red"
    log = (await db_session.execute(select(InwardLog).where(InwardLog.product_id == product_id))).scalar_one()
    assert log.colour_code == 101
    assert log.color == "Red"

@pytest.mark.asyncio
async def test_get_inward_logs_returns_colour_code(async_client: AsyncClient, db_session: AsyncSession, setup_product):
    product_id = setup_product["id"]
    payload = {
        "product_id": product_id,
        "color": "Blue",
        "colour_code": 102,
        "size": "M",
        "quantity": 3,
        "date": "2025-06-25",
        "category": "Supply",
        "stakeholder_name": "Tester2"
    }
    await async_client.post("/api/v1/inward/", json=payload)
    response = await async_client.get(f"/api/v1/inward/{product_id}")
    assert response.status_code == 200
    logs = response.json()
    assert any(log["colour_code"] == 102 and log["color"] == "Blue" for log in logs)

@pytest.mark.asyncio
async def test_update_inward_log_colour_code(async_client: AsyncClient, db_session: AsyncSession, setup_product):
    product_id = setup_product["id"]
    payload = {
        "product_id": product_id,
        "color": "Red",
        "colour_code": 101,
        "size": "S",
        "quantity": 2,
        "date": "2025-06-25",
        "category": "Supply",
        "stakeholder_name": "Tester3"
    }
    resp = await async_client.post("/api/v1/inward/", json=payload)
    log_id = resp.json()["id"]
    update_payload = {**payload, "colour_code": 999, "color": "Red"}
    response = await async_client.put(f"/api/v1/inward/{log_id}", json=update_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["colour_code"] == 999
    log = (await db_session.execute(select(InwardLog).where(InwardLog.id == log_id))).scalar_one()
    assert log.colour_code == 999 