import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.sales import SalesLog
from datetime import date
from app.main import app
from app.core.crud import product as crud_product
from app.models.product import Product

@pytest_asyncio.fixture(scope="function")
async def setup_product(async_client: AsyncClient, auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = await async_client.post(
        "/api/products",
        json={"name": "Test Product for Sales", "sku": "SL001", "unit_price": 10.0, "sizes": ["S", "M"], "colors": ["Red", "Blue"]},
        headers=headers
    )
    assert response.status_code == 201
    return response.json()

@pytest.mark.asyncio
async def test_create_sales_log_valid(async_client: AsyncClient, auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    payload = {
        "product_id": 1,
        "color": "Red",
        "colour_code": 101,
        "size": "S",
        "quantity": 5,
        "date": str(date.today()),
        "agency_name": "AgencyA",
        "store_name": "StoreA"
    }
    response = await async_client.post("/api/v1/sales/", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["product_id"] == 1
    assert data["color"] == "Red"
    assert data["colour_code"] == 101
    assert data["size"] == "S"
    assert data["quantity"] == 5

@pytest.mark.asyncio
async def test_upload_sales_csv_valid(async_client: AsyncClient, auth_token):
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
    
    # Create sales log with detailed fields
    payload = {
        "product_id": product_id,
        "color": "Red",
        "colour_code": 101,
        "size": "S",
        "quantity": 3,
        "date": str(date.today()),
        "agency_name": "AgencyA",
        "store_name": "StoreA"
    }
    response = await async_client.post("/api/v1/sales/", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["product_id"] == product_id
    assert data["color"] == "Red"

@pytest.mark.asyncio
async def test_upload_sales_multiple_rows(async_client: AsyncClient, auth_token):
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
    
    # Create multiple sales logs
    payloads = [
        {
            "product_id": product_id,
            "color": "Blue",
            "colour_code": 102,
            "size": "S",
            "quantity": 2,
            "date": str(date.today()),
            "agency_name": "AgencyB",
            "store_name": "StoreB"
        },
        {
            "product_id": product_id,
            "color": "Blue",
            "colour_code": 102,
            "size": "M",
            "quantity": 1,
            "date": str(date.today()),
            "agency_name": "AgencyB",
            "store_name": "StoreB"
        }
    ]
    
    for payload in payloads:
        response = await async_client.post("/api/v1/sales/", json=payload, headers=headers)
        assert response.status_code == 201

@pytest.mark.asyncio
async def test_upload_sales_with_zero_price(async_client: AsyncClient, auth_token):
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
        "agency_name": "AgencyC",
        "store_name": "StoreC"
    }
    response = await async_client.post("/api/v1/sales/", json=payload, headers=headers)
    assert response.status_code == 201

@pytest.mark.asyncio
async def test_upload_sales_with_negative_price(async_client: AsyncClient, auth_token):
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
        "agency_name": "AgencyD",
        "store_name": "StoreD"
    }
    response = await async_client.post("/api/v1/sales/", json=payload, headers=headers)
    assert response.status_code == 201

@pytest.mark.asyncio
async def test_upload_sales_with_zero_quantity(async_client: AsyncClient, auth_token):
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
        "agency_name": "AgencyE",
        "store_name": "StoreE"
    }
    response = await async_client.post("/api/v1/sales/", json=payload, headers=headers)
    assert response.status_code == 201

@pytest.mark.asyncio
async def test_upload_sales_malformed_line(async_client: AsyncClient, auth_token):
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
    response = await async_client.post("/api/v1/sales/", json=payload, headers=headers)
    assert response.status_code == 422

@pytest.mark.asyncio
async def test_upload_sales_invalid_product_id(async_client: AsyncClient, auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    payload = {
        "product_id": 99999,
        "color": "Red",
        "colour_code": 101,
        "size": "S",
        "quantity": 3,
        "date": str(date.today()),
        "agency_name": "AgencyA",
        "store_name": "StoreA"
    }
    response = await async_client.post("/api/v1/sales/", json=payload, headers=headers)
    assert response.status_code == 404 