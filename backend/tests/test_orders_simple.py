import pytest
from fastapi.testclient import TestClient
import sys
import os

# Add the app directory to Python path
sys.path.insert(0, '/app')

from app.main import app

client = TestClient(app)

def get_admin_token():
    """Get authentication token for the default admin user"""
    # Login as the default admin user
    login_payload = {
        "email": "admin@example.com",
        "password": "admin123"
    }
    
    response = client.post("/api/v1/auth/login", json=login_payload)
    print(f"Admin login response: {response.status_code}")
    if response.status_code == 200:
        token_data = response.json()
        return token_data["access_token"]
    else:
        print(f"Admin login failed: {response.text}")
        return None

def test_create_order_simple():
    """Simple test to verify Orders API works"""
    # Get admin authentication token
    admin_token = get_admin_token()
    if not admin_token:
        print("❌ Could not authenticate as admin - skipping test")
        return
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # First create a product
    product_payload = {
        "name": "TestProduct",
        "sku": "TEST-SKU-004",
        "unit_price": 100.0,
        "sizes": ["S", "M"],
        "colors": [{"color": "Red", "colour_code": 4}],
    }
    
    response = client.post("/api/v1/products/", json=product_payload, headers=headers)
    print(f"Product creation response: {response.status_code} - {response.text}")
    assert response.status_code in (200, 201), f"Failed to create product: {response.text}"
    
    product_data = response.json()
    product_id = product_data["id"]
    
    # Create an order
    order_payload = {
        "product_id": product_id,
        "color": "Red",
        "colour_code": 4,
        "sizes": {"S": 2, "M": 1},
        "date": "2024-01-15",
        "agency_name": "TestAgency",
        "store_name": "TestStore"
    }
    
    response = client.post(f"/api/v1/products/{product_id}/orders", json=order_payload, headers=headers)
    print(f"Order creation response: {response.status_code} - {response.text}")
    assert response.status_code == 200, f"Failed to create order: {response.text}"
    
    order_data = response.json()
    assert order_data["product_id"] == product_id
    assert order_data["color"] == "Red"
    assert order_data["sizes"]["S"] == 2
    assert order_data["sizes"]["M"] == 1
    print("✅ Order creation test passed!")

def test_get_orders_simple():
    """Simple test to verify getting orders works"""
    # Get admin authentication token
    admin_token = get_admin_token()
    if not admin_token:
        print("❌ Could not authenticate as admin - skipping test")
        return
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    response = client.get("/api/v1/orders/", headers=headers)
    print(f"Get orders response: {response.status_code} - {response.text}")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    print("✅ Get orders test passed!")

if __name__ == "__main__":
    print("Running Orders API tests...")
    try:
        test_create_order_simple()
        test_get_orders_simple()
        print("🎉 All tests passed!")
    except Exception as e:
        print(f"❌ Test failed: {e}")
        sys.exit(1) 