import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_and_list_products(client: AsyncClient):
    # Create a product
    response = await client.post(
        "/api/products",
        json={"name": "Test T-Shirt", "sku": "TS001", "unit_price": 19.99, "sizes": ["S", "M", "L"], "colors": ["Red", "Blue"]}
    )
    assert response.status_code == 201
    created_product = response.json()
    assert created_product["name"] == "Test T-Shirt"
    assert "id" in created_product
    product_id = created_product["id"]

    # List products to verify creation
    response = await client.get("/api/products")
    assert response.status_code == 200
    product_list = response.json()
    assert isinstance(product_list, list)
    
    # Check if the created product is in the list
    assert any(p["id"] == product_id for p in product_list)
    found_product = next(p for p in product_list if p["id"] == product_id)
    assert found_product["name"] == "Test T-Shirt"
    assert found_product["colors"] == ["Red", "Blue"]

@pytest.mark.asyncio
async def test_delete_product_with_cascade(client: AsyncClient):
    # Create a product
    response = await client.post(
        "/api/products",
        json={"name": "Test Product", "sku": "TP001", "unit_price": 25.00, "sizes": ["M"], "colors": ["Green"]}
    )
    assert response.status_code == 201
    product_id = response.json()["id"]

    # Create inward log for the product
    response = await client.post(
        "/api/inward",
        json={
            "product_id": product_id,
            "csv_text": "2024-01-01,Green,Green Color,10,15.00,M,Green,Category A,Supplier A"
        }
    )
    assert response.status_code == 200

    # Create sales log for the product
    response = await client.post(
        "/api/sales",
        json={
            "product_id": product_id,
            "csv_text": "2024-01-02,Green,Green Color,5,25.00,M,Green,Category A,Customer A"
        }
    )
    assert response.status_code == 200

    # Delete the product
    response = await client.delete(f"/api/products/{product_id}")
    assert response.status_code == 204

    # Verify product is deleted
    response = await client.get(f"/api/products/{product_id}")
    assert response.status_code == 404

    # Verify related logs are also deleted (cascade delete)
    # Try to get stock for the deleted product - should return 404
    response = await client.get(f"/api/stock/{product_id}")
    assert response.status_code == 404