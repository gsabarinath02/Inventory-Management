#!/usr/bin/env python3
"""
Simple test script to verify Orders functionality
"""
import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_orders_functionality():
    print("🧪 Testing Orders Functionality")
    print("=" * 50)
    
    # 1. Login
    print("1. Logging in...")
    login_data = {
        "email": "admin@example.com",
        "password": "admin123"
    }
    
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    if response.status_code != 200:
        print(f"❌ Login failed: {response.status_code}")
        return False
    
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✅ Login successful")
    
    # 2. Get products
    print("\n2. Getting products...")
    response = requests.get(f"{BASE_URL}/products/", headers=headers)
    if response.status_code != 200:
        print(f"❌ Failed to get products: {response.status_code}")
        return False
    
    products = response.json()
    if not products:
        print("❌ No products found")
        return False
    
    product = products[0]
    product_id = product["id"]
    print(f"✅ Found product: {product['name']} (ID: {product_id})")
    
    # 3. Get existing orders
    print(f"\n3. Getting existing orders for product {product_id}...")
    response = requests.get(f"{BASE_URL}/products/{product_id}/orders", headers=headers)
    if response.status_code != 200:
        print(f"❌ Failed to get orders: {response.status_code}")
        return False
    
    orders = response.json()
    print(f"✅ Found {len(orders)} existing orders")
    
    # 4. Create a new order
    print(f"\n4. Creating a new order...")
    order_data = {
        "product_id": product_id,
        "color": "Red",
        "colour_code": 4,
        "sizes": {"S": 5, "M": 3},
        "date": "2024-01-20",
        "agency_name": "TestAgency",
        "store_name": "TestStore"
    }
    
    response = requests.post(f"{BASE_URL}/products/{product_id}/orders", 
                           json=order_data, headers=headers)
    if response.status_code != 200:
        print(f"❌ Failed to create order: {response.status_code}")
        print(f"Response: {response.text}")
        return False
    
    new_order = response.json()
    print(f"✅ Order created successfully!")
    print(f"   Order Number: {new_order['order_number']}")
    print(f"   Financial Year: {new_order['financial_year']}")
    print(f"   Agency: {new_order['agency_name']}")
    print(f"   Store: {new_order['store_name']}")
    
    # 5. Get all orders
    print(f"\n5. Getting all orders...")
    response = requests.get(f"{BASE_URL}/orders/", headers=headers)
    if response.status_code != 200:
        print(f"❌ Failed to get all orders: {response.status_code}")
        return False
    
    all_orders = response.json()
    print(f"✅ Found {len(all_orders)} total orders")
    
    # 6. Verify the new order is in the list
    order_found = any(order["id"] == new_order["id"] for order in all_orders)
    if order_found:
        print("✅ New order found in all orders list")
    else:
        print("❌ New order not found in all orders list")
        return False
    
    print("\n🎉 All Orders tests passed!")
    print("\n📋 Frontend Test Instructions:")
    print("1. Open http://localhost:3000 in your browser")
    print("2. Login with admin@example.com / admin123")
    print("3. Go to 'Upload Data' section")
    print("4. Select a product from the dropdown")
    print("5. Click on 'Orders' tab")
    print("6. Verify you can see the orders table")
    print("7. Try adding a new order")
    print("8. Try editing an existing order")
    print("9. Try deleting an order")
    
    return True

if __name__ == "__main__":
    try:
        success = test_orders_functionality()
        if success:
            print("\n✅ Orders functionality is working correctly!")
        else:
            print("\n❌ Orders functionality has issues!")
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}") 