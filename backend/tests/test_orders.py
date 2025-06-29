import pytest
from fastapi.testclient import TestClient
from app.main import app
from datetime import date
import uuid

client = TestClient(app)

@pytest.fixture(scope="module")
def test_product():
    # Create a product for testing orders with unique SKU
    unique_sku = f"ORD-TEST-{uuid.uuid4().hex[:8]}"
    payload = {
        "name": "OrderTestProduct",
        "sku": unique_sku,
        "unit_price": 100.0,
        "sizes": ["S", "M"],
        "colors": [{"color": "Red", "colour_code": 4}],
    }
    response = client.post("/api/v1/products/", json=payload)
    if response.status_code not in (200, 201):
        print("Product creation failed:", response.status_code, response.text)
    assert response.status_code in (200, 201), f"Failed to create product: {response.text}"
    return response.json()

@pytest.fixture(scope="module")
def test_user_token():
    # Register and login a user, return the token
    unique_email = f"ordertestuser_{uuid.uuid4().hex[:8]}@example.com"
    payload = {"email": unique_email, "password": "testpass123"}
    client.post("/api/v1/auth/register", json=payload)
    response = client.post("/api/v1/auth/login", data=payload)
    assert response.status_code == 200
    return response.json()["access_token"]

def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}

def test_create_order(test_product, test_user_token):
    product_id = test_product["id"]
    payload = {
        "product_id": product_id,
        "color": "Red",
        "colour_code": 4,
        "sizes": {"S": 2, "M": 1},
        "date": str(date.today()),
        "agency_name": "TestAgency",
        "store_name": "TestStore"
    }
    response = client.post(f"/api/v1/products/{product_id}/orders", json=payload, headers=auth_headers(test_user_token))
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["product_id"] == product_id
    assert data["color"] == "Red"
    assert data["sizes"]["S"] == 2
    assert data["sizes"]["M"] == 1
    assert data["agency_name"] == "TestAgency"
    assert data["store_name"] == "TestStore"
    global created_order_id
    created_order_id = data["id"]

def test_get_orders(test_product, test_user_token):
    product_id = test_product["id"]
    response = client.get(f"/api/v1/products/{product_id}/orders", headers=auth_headers(test_user_token))
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert any(order["product_id"] == product_id for order in data)

def test_update_order(test_product, test_user_token):
    product_id = test_product["id"]
    # Get the first order
    response = client.get(f"/api/v1/products/{product_id}/orders", headers=auth_headers(test_user_token))
    order = response.json()[0]
    order_id = order["id"]
    payload = {
        "color": "Red",
        "sizes": {"S": 5, "M": 3},
        "date": str(date.today()),
        "agency_name": "UpdatedAgency",
        "store_name": "UpdatedStore"
    }
    response = client.put(f"/api/v1/orders/{order_id}", json=payload, headers=auth_headers(test_user_token))
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["sizes"]["S"] == 5
    assert data["agency_name"] == "UpdatedAgency"
    assert data["store_name"] == "UpdatedStore"

def test_delete_order(test_product, test_user_token):
    product_id = test_product["id"]
    # Get the first order
    response = client.get(f"/api/v1/products/{product_id}/orders", headers=auth_headers(test_user_token))
    order = response.json()[0]
    order_id = order["id"]
    response = client.delete(f"/api/v1/orders/{order_id}", headers=auth_headers(test_user_token))
    assert response.status_code == 200
    # Ensure it's deleted
    response = client.get(f"/api/v1/orders/{order_id}", headers=auth_headers(test_user_token))
    assert response.status_code == 404

def test_create_order_invalid_missing_fields(test_product, test_user_token):
    product_id = test_product["id"]
    payload = {
        "product_id": product_id,
        # Missing color, sizes, date
    }
    response = client.post(f"/api/v1/products/{product_id}/orders", json=payload, headers=auth_headers(test_user_token))
    assert response.status_code == 422

def test_create_order_invalid_sizes(test_product, test_user_token):
    product_id = test_product["id"]
    payload = {
        "product_id": product_id,
        "color": "Red",
        "colour_code": 4,
        "sizes": {"S": -1, "M": 0},  # Invalid negative size
        "date": str(date.today()),
        "agency_name": "TestAgency",
        "store_name": "TestStore"
    }
    response = client.post(f"/api/v1/products/{product_id}/orders", json=payload, headers=auth_headers(test_user_token))
    assert response.status_code == 422

def test_update_order_invalid_date(test_product, test_user_token):
    product_id = test_product["id"]
    # Get the first order (create one if needed)
    payload = {
        "product_id": product_id,
        "color": "Red",
        "colour_code": 4,
        "sizes": {"S": 1, "M": 1},
        "date": str(date.today()),
        "agency_name": "TestAgency",
        "store_name": "TestStore"
    }
    response = client.post(f"/api/v1/products/{product_id}/orders", json=payload, headers=auth_headers(test_user_token))
    order_id = response.json()["id"]
    # Try to update with invalid date
    update_payload = {"date": "not-a-date"}
    response = client.put(f"/api/v1/orders/{order_id}", json=update_payload, headers=auth_headers(test_user_token))
    assert response.status_code == 422 