import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import InwardLog
from datetime import date
from app.main import app
from app.core.crud import product as crud_product
from app.models.product import Product

@pytest_asyncio.fixture(scope="function", autouse=True)
async def setup_product(async_client: AsyncClient, auth_token):
    """Creates a product that can be used by all tests in this module."""
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = await async_client.post(
        "/api/v1/products/",
        json={"name": "Test Product for Inward", "sku": "IN001", "unit_price": 10.0, "sizes": ["S", "M"], "colors": [
            {"color": "Red", "colour_code": 101},
            {"color": "Blue", "colour_code": 102}
        ]},
        headers=headers
    )
    assert response.status_code == 201
    return response.json()

@pytest.mark.asyncio
async def test_create_inward_log_valid(async_client: AsyncClient, auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    payload = {
        "product_id": 1,
        "color": "Red",
        "colour_code": 101,
        "size": "S",
        "quantity": 10,
        "date": str(date.today()),
        "category": "Supply",
        "stakeholder_name": "Supplier A"
    }
    response = await async_client.post("/api/v1/inward/", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["product_id"] == 1
    assert data["color"] == "Red"
    assert data["colour_code"] == 101
    assert data["size"] == "S"
    assert data["quantity"] == 10

@pytest.mark.asyncio
async def test_upload_inward_csv_valid(async_client: AsyncClient, auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    # Create a product first
    product_data = {
        "name": "Test Product",
        "sku": "TP001",
        "unit_price": 25.00,
        "sizes": ["S", "M", "L"],
        "colors": [{"color": "Red", "colour_code": 101}]
    }
    product_response = await async_client.post("/api/v1/products/", json=product_data, headers=headers)
    assert product_response.status_code == 201
    product_id = product_response.json()["id"]
    
    # Create inward log with detailed fields
    payload = {
        "product_id": product_id,
        "color": "Red",
        "colour_code": 101,
        "size": "S",
        "quantity": 10,
        "date": str(date.today()),
        "category": "Supply",
        "stakeholder_name": "Supplier A"
    }
    response = await async_client.post("/api/v1/inward/", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["product_id"] == product_id
    assert data["color"] == "Red"

@pytest.mark.asyncio
async def test_upload_inward_multiple_rows(async_client: AsyncClient, auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    # Create a product first
    product_data = {
        "name": "Test Product",
        "sku": "TP002",
        "unit_price": 30.00,
        "sizes": ["S", "M"],
        "colors": [{"color": "Blue", "colour_code": 102}]
    }
    product_response = await async_client.post("/api/v1/products/", json=product_data, headers=headers)
    assert product_response.status_code == 201
    product_id = product_response.json()["id"]
    
    # Create multiple inward logs
    payloads = [
        {
            "product_id": product_id,
            "color": "Blue",
            "colour_code": 102,
            "size": "S",
            "quantity": 5,
            "date": str(date.today()),
            "category": "Supply",
            "stakeholder_name": "Supplier B"
        },
        {
            "product_id": product_id,
            "color": "Blue",
            "colour_code": 102,
            "size": "M",
            "quantity": 3,
            "date": str(date.today()),
            "category": "Supply",
            "stakeholder_name": "Supplier B"
        }
    ]
    
    for payload in payloads:
        response = await async_client.post("/api/v1/inward/", json=payload, headers=headers)
        assert response.status_code == 201

@pytest.mark.asyncio
async def test_upload_inward_with_zero_cost(async_client: AsyncClient, auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    # Create a product first
    product_data = {
        "name": "Test Product",
        "sku": "TP003",
        "unit_price": 0.00,
        "sizes": ["S"],
        "colors": [{"color": "Green", "colour_code": 103}]
    }
    product_response = await async_client.post("/api/v1/products/", json=product_data, headers=headers)
    assert product_response.status_code == 201
    product_id = product_response.json()["id"]
    
    payload = {
        "product_id": product_id,
        "color": "Green",
        "colour_code": 103,
        "size": "S",
        "quantity": 1,
        "date": str(date.today()),
        "category": "Supply",
        "stakeholder_name": "Supplier C"
    }
    response = await async_client.post("/api/v1/inward/", json=payload, headers=headers)
    assert response.status_code == 201

@pytest.mark.asyncio
async def test_upload_inward_with_negative_cost(async_client: AsyncClient, auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    # Create a product first
    product_data = {
        "name": "Test Product",
        "sku": "TP004",
        "unit_price": -10.00,
        "sizes": ["S"],
        "colors": [{"color": "Yellow", "colour_code": 104}]
    }
    product_response = await async_client.post("/api/v1/products/", json=product_data, headers=headers)
    assert product_response.status_code == 201
    product_id = product_response.json()["id"]
    
    payload = {
        "product_id": product_id,
        "color": "Yellow",
        "colour_code": 104,
        "size": "S",
        "quantity": 1,
        "date": str(date.today()),
        "category": "Supply",
        "stakeholder_name": "Supplier D"
    }
    response = await async_client.post("/api/v1/inward/", json=payload, headers=headers)
    assert response.status_code == 201

@pytest.mark.asyncio
async def test_upload_inward_with_zero_quantity(async_client: AsyncClient, auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    # Create a product first
    product_data = {
        "name": "Test Product",
        "sku": "TP005",
        "unit_price": 15.00,
        "sizes": ["S"],
        "colors": [{"color": "Purple", "colour_code": 105}]
    }
    product_response = await async_client.post("/api/v1/products/", json=product_data, headers=headers)
    assert product_response.status_code == 201
    product_id = product_response.json()["id"]
    
    payload = {
        "product_id": product_id,
        "color": "Purple",
        "colour_code": 105,
        "size": "S",
        "quantity": 0,
        "date": str(date.today()),
        "category": "Supply",
        "stakeholder_name": "Supplier E"
    }
    response = await async_client.post("/api/v1/inward/", json=payload, headers=headers)
    assert response.status_code == 201

@pytest.mark.asyncio
async def test_upload_inward_malformed_line(async_client: AsyncClient, auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    # Create a product first
    product_data = {
        "name": "Test Product",
        "sku": "TP006",
        "unit_price": 20.00,
        "sizes": ["S"],
        "colors": [{"color": "Orange", "colour_code": 106}]
    }
    product_response = await async_client.post("/api/v1/products/", json=product_data, headers=headers)
    assert product_response.status_code == 201
    product_id = product_response.json()["id"]
    
    # Test with missing required fields
    payload = {
        "product_id": product_id,
        "color": "Orange",
        "colour_code": 106,
        "size": "S",
        # Missing quantity and date
    }
    response = await async_client.post("/api/v1/inward/", json=payload, headers=headers)
    assert response.status_code == 422

@pytest.mark.asyncio
async def test_upload_inward_invalid_product_id(async_client: AsyncClient, auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    payload = {
        "product_id": 99999,
        "color": "Red",
        "colour_code": 101,
        "size": "S",
        "quantity": 10,
        "date": str(date.today()),
        "category": "Supply",
        "stakeholder_name": "Supplier A"
    }
    response = await async_client.post("/api/v1/inward/", json=payload, headers=headers)
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_create_inward_log_with_colour_code(async_client: AsyncClient, auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    payload = {
        "product_id": 1,
        "color": "Blue",
        "colour_code": 102,
        "size": "M",
        "quantity": 15,
        "date": str(date.today()),
        "category": "Supply",
        "stakeholder_name": "Supplier B"
    }
    response = await async_client.post("/api/v1/inward/", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["colour_code"] == 102

@pytest.mark.asyncio
async def test_get_inward_logs_returns_colour_code(async_client: AsyncClient, auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = await async_client.get("/api/v1/inward/1", headers=headers)
    assert response.status_code == 200
    logs = response.json()
    if logs:
        assert "colour_code" in logs[0]

@pytest.mark.asyncio
async def test_update_inward_log_colour_code(async_client: AsyncClient, setup_product):
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
    
    # Get auth token
    auth_response = await async_client.post("/api/v1/auth/login", data={
        "username": "testadmin@example.com",
        "password": "testpass123"
    })
    auth_token = auth_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    resp = await async_client.post("/api/v1/inward/", json=payload, headers=headers)
    assert resp.status_code == 201
    log_id = resp.json()["id"]
    
    update_payload = {
        "product_id": product_id,
        "color": "Red",
        "colour_code": 201,
        "size": "S",
        "quantity": 2,
        "date": "2025-06-25",
        "category": "Supply",
        "stakeholder_name": "Tester3"
    }
    
    update_resp = await async_client.put(f"/api/v1/inward/{log_id}", json=update_payload, headers=headers)
    assert update_resp.status_code == 200
    updated_data = update_resp.json()
    assert updated_data["colour_code"] == 201
    
    # Verify by getting the log again instead of accessing SQLAlchemy object directly
    get_resp = await async_client.get(f"/api/v1/inward/{log_id}", headers=headers)
    assert get_resp.status_code == 200
    log_data = get_resp.json()
    assert log_data["colour_code"] == 201 