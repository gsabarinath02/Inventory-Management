import requests

API_URL = "http://localhost:8000/api/v1/products"

product_data = {
    "name": "Demo Product",
    "sku": "DP8888",
    "description": "A demo product for testing.",
    "unit_price": 150.0,
    "sizes": ["S", "M", "L"],
    "colors": [
        {"color": "Red", "colour_code": 101},
        {"color": "Blue", "colour_code": 102}
    ]
}

# Add a dummy auth header for testing
headers = {"Authorization": "Bearer test-token"}

# 1. Create product (with testing auth)
resp = requests.post(API_URL, json=product_data, headers=headers)
print("Create:", resp.status_code, resp.text)
product = resp.json() if resp.status_code == 200 or resp.status_code == 201 else {}
product_id = product.get("id")
print(f"Product ID: {product_id}")

# 2. Update product (with testing auth)
if product_id:
    update_data = product_data.copy()
    update_data["name"] = "Demo Product Updated"
    resp = requests.put(f"{API_URL}/{product_id}", json=update_data, headers=headers)
    print("Update:", resp.status_code, resp.text)
else:
    print("No product ID found, skipping update")

# 3. Delete product (with testing auth)
if product_id:
    resp = requests.delete(f"{API_URL}/{product_id}", headers=headers)
    print("Delete:", resp.status_code, resp.text)
else:
    print("No product ID found, skipping delete") 