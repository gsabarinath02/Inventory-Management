import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import date

from app.core.crud.product import create_product
from app.core.crud.inward import create_inward_log
from app.core.crud.sales import create_sales_log
from app.schemas.product import ProductCreate
from app.schemas.inward import InwardLogCreate
from app.schemas.sales import SalesLogCreate

def test_get_stock_matrix(client: TestClient, db: Session):
    # 1. Create a product
    product_data = ProductCreate(
        name="Test T-Shirt",
        sku="TEST-SKU-001",
        description="A t-shirt for testing",
        unit_price=10.0,
        sizes=["S", "M", "L"],
        colors=["Red", "Blue"]
    )
    product = create_product(db, product_data)
    
    # 2. Create inward logs (supplies)
    create_inward_log(db, InwardLogCreate(product_id=product.id, color="Red", size="M", quantity=10, date=date.today(), category="Supply"))
    create_inward_log(db, InwardLogCreate(product_id=product.id, color="Blue", size="L", quantity=5, date=date.today(), category="Supply"))
    
    # 3. Create sales logs
    create_sales_log(db, SalesLogCreate(product_id=product.id, color="Red", size="M", quantity=2, date=date.today(), category="Retail"))

    # 4. Create a return (inward log, but category is Return)
    create_inward_log(db, InwardLogCreate(product_id=product.id, color="Blue", size="L", quantity=1, date=date.today(), category="Return"))
    
    # 5. Create a sales return
    create_sales_log(db, SalesLogCreate(product_id=product.id, color="Red", size="M", quantity=1, date=date.today(), category="Return"))

    # 6. Call the API endpoint
    response = client.get(f"/api/v1/stock/{product.id}")
    
    # 7. Assert the response
    assert response.status_code == 200
    stock_matrix = response.json()
    
    # Expected: 
    # Red, M: 10 (supply) - 2 (sale) + 1 (sales return) = 9
    # Blue, L: 5 (supply) - 1 (inward return) = 4
    
    assert stock_matrix["Red"]["S"] == 0
    assert stock_matrix["Red"]["M"] == 9
    assert stock_matrix["Red"]["L"] == 0
    assert stock_matrix["Red"]["total"] == 9
    
    assert stock_matrix["Blue"]["S"] == 0
    assert stock_matrix["Blue"]["M"] == 0
    assert stock_matrix["Blue"]["L"] == 4
    assert stock_matrix["Blue"]["total"] == 4

def test_get_stock_matrix_no_logs(client: TestClient, db: Session):
    product_data = ProductCreate(
        name="Test Jacket",
        sku="TEST-SKU-002",
        description="A jacket for testing",
        unit_price=50.0,
        sizes=["M"],
        colors=["Black"]
    )
    product = create_product(db, product_data)

    response = client.get(f"/api/v1/stock/{product.id}")
    assert response.status_code == 200
    stock_matrix = response.json()

    assert stock_matrix["Black"]["M"] == 0
    assert stock_matrix["Black"]["total"] == 0
    
def test_get_stock_matrix_no_sizes(client: TestClient, db: Session):
    product_data = ProductCreate(
        name="Test Scarf",
        sku="TEST-SKU-003",
        description="A scarf for testing",
        unit_price=15.0,
        sizes=[],
        colors=["Green"]
    )
    product = create_product(db, product_data)

    response = client.get(f"/api/v1/stock/{product.id}")
    assert response.status_code == 200
    assert response.json() == {} 