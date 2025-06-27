import pytest
from httpx import AsyncClient
from datetime import date

@pytest.mark.asyncio
async def test_create_and_list_products(async_client: AsyncClient, auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    # Create a product
    response = await async_client.post(
        "/api/v1/products/",
        json={"name": "Test T-Shirt", "sku": "TS001", "unit_price": 19.99, "sizes": ["S", "M", "L"], "colors": [
            {"color": "Red", "colour_code": 101},
            {"color": "Blue", "colour_code": 102}
        ]},
        headers=headers,
        timeout=10
    )
    assert response.status_code == 201
    created_product = response.json()
    assert created_product["name"] == "Test T-Shirt"
    assert "id" in created_product
    product_id = created_product["id"]

    # List products to verify creation
    response = await async_client.get("/api/v1/products/", headers=headers, timeout=10)
    assert response.status_code == 200
    product_list = response.json()
    assert isinstance(product_list, list)
    assert any(p["id"] == product_id for p in product_list)
    found_product = next(p for p in product_list if p["id"] == product_id)
    assert found_product["name"] == "Test T-Shirt"
    assert found_product["colors"] == [
        {"color": "Red", "colour_code": 101},
        {"color": "Blue", "colour_code": 102}
    ]

@pytest.mark.asyncio
async def test_delete_product_with_cascade(async_client: AsyncClient, auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    # Create a product
    response = await async_client.post(
        "/api/v1/products/",
        json={"name": "Test Product", "sku": "TP001", "unit_price": 25.00, "sizes": ["M"], "colors": [
            {"color": "Green", "colour_code": 103}
        ]},
        headers=headers,
        timeout=10
    )
    assert response.status_code == 201
    product_id = response.json()["id"]

    # Create inward log for the product with detailed fields
    response = await async_client.post(
        "/api/v1/inward/",
        json={
            "product_id": product_id,
            "color": "Green",
            "colour_code": 103,
            "sizes": {"M": 10},
            "date": str(date.today()),
            "category": "Supply",
            "stakeholder_name": "Supplier A",
            "operation": "Inward"
        },
        headers=headers,
        timeout=10
    )
    assert response.status_code == 201

    # Delete the product
    response = await async_client.delete(f"/api/v1/products/{product_id}", headers=headers, timeout=10)
    assert response.status_code == 204

    # Verify product is deleted
    response = await async_client.get(f"/api/v1/products/{product_id}", headers=headers, timeout=10)
    assert response.status_code == 404

    # Verify related logs are also deleted (cascade delete)
    response = await async_client.get(f"/api/v1/stock/{product_id}", headers=headers, timeout=10)
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()