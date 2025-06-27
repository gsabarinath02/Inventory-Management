import pytest
import pytest_asyncio
from httpx import AsyncClient

@pytest_asyncio.fixture(scope="function", autouse=True)
async def setup_product_and_logs(async_client: AsyncClient):
    """Set up a product and its inward/sales logs for stock calculation."""
    # 1. Create product
    res = await async_client.post(
        "/api/products",
        json={"name": "Test Stock Product", "sku": "SP001", "unit_price": 50.0, "sizes": ["S", "M"], "colors": ["Green", "Yellow"]},
        timeout=10
    )
    assert res.status_code == 201
    product_id = res.json()["id"]

    # 2. Add inward logs
    inward_csv = """2025-06-21,GRN,Green,10,5.0,S,Green,Supply,SupX\n2025-06-21,GRN,Green,5,5.0,M,Green,Supply,SupX\n2025-06-21,YLW,Yellow,8,5.0,S,Yellow,Supply,SupY"""
    res = await async_client.post("/api/inward", json={"product_id": product_id, "csv_text": inward_csv}, timeout=10)
    assert res.status_code == 200
    assert res.json()["rows_processed"] == 3

    # 3. Add sales logs
    sales_csv = """2025-06-22,GRN,Green,2,50.0,S,Green,Sale,CustX\n2025-06-22,GRN,Green,1,50.0,M,Green,Sale,CustX\n2025-06-22,YLW,Yellow,3,50.0,S,Yellow,Sale,CustY"""
    res = await async_client.post("/api/sales", json={"product_id": product_id, "csv_text": sales_csv}, timeout=10)
    assert res.status_code == 200
    assert res.json()["rows_processed"] == 3

    return product_id

@pytest.mark.asyncio
async def test_get_stock_matrix(async_client: AsyncClient, setup_product_and_logs):
    """Test stock matrix calculation with normal inward and sales logs."""
    product_id = setup_product_and_logs
    response = await async_client.get(f"/api/stock/{product_id}", timeout=10)
    assert response.status_code == 200
    matrix = response.json()
    # Green: S=10-2=8, M=5-1=4; Yellow: S=8-3=5
    assert matrix["Green"]["S"] == 8
    assert matrix["Green"]["M"] == 4
    assert matrix["Yellow"]["S"] == 5
    assert "L" not in matrix["Green"]
    assert "M" not in matrix["Yellow"]

@pytest.mark.asyncio
async def test_get_stock_matrix_with_negative_values(async_client: AsyncClient, setup_product_and_logs):
    """Test stock matrix when sales exceed inward (negative stock)."""
    product_id = setup_product_and_logs
    # Add more sales to create negative stock
    sales_csv = "2025-06-23,GRN,Green,15,50.0,S,Green,Sale,CustZ"
    res = await async_client.post("/api/sales", json={"product_id": product_id, "csv_text": sales_csv}, timeout=10)
    assert res.status_code == 200
    response = await async_client.get(f"/api/stock/{product_id}", timeout=10)
    assert response.status_code == 200
    matrix = response.json()
    assert matrix["Green"]["S"] == -7

@pytest.mark.asyncio
async def test_get_stock_matrix_no_logs(async_client: AsyncClient):
    """Test stock matrix for a product with no inward or sales logs."""
    res = await async_client.post(
        "/api/products",
        json={"name": "Test Jacket", "sku": "TEST-SKU-002", "unit_price": 50.0, "sizes": ["M"], "colors": ["Black"]},
        timeout=10
    )
    assert res.status_code == 201
    product_id = res.json()["id"]
    response = await async_client.get(f"/api/stock/{product_id}", timeout=10)
    assert response.status_code == 200
    matrix = response.json()
    assert matrix["Black"]["M"] == 0
    assert matrix["Black"].get("total", 0) == 0

@pytest.mark.asyncio
async def test_get_stock_matrix_no_sizes(async_client: AsyncClient):
    """Test stock matrix for a product with no sizes defined."""
    res = await async_client.post(
        "/api/products",
        json={"name": "Test Scarf", "sku": "TEST-SKU-003", "unit_price": 15.0, "sizes": [], "colors": ["Green"]},
        timeout=10
    )
    assert res.status_code == 201
    product_id = res.json()["id"]
    response = await async_client.get(f"/api/stock/{product_id}", timeout=10)
    assert response.status_code == 200
    assert response.json() == {}

@pytest.mark.asyncio
async def test_get_stock_matrix_with_returns(async_client: AsyncClient):
    """Test stock matrix with inward and sales returns."""
    res = await async_client.post(
        "/api/products",
        json={"name": "Test T-Shirt", "sku": "TEST-SKU-001", "unit_price": 10.0, "sizes": ["S", "M", "L"], "colors": ["Red", "Blue"]},
        timeout=10
    )
    assert res.status_code == 201
    product_id = res.json()["id"]
    # Inward supply
    await async_client.post("/api/inward", json={"product_id": product_id, "csv_text": "2024-01-01,Red,Red Color,10,15.00,M,Red,Supply,Category A,Supplier A"}, timeout=10)
    await async_client.post("/api/inward", json={"product_id": product_id, "csv_text": "2024-01-01,Blue,Blue Color,5,15.00,L,Blue,Supply,Category A,Supplier A"}, timeout=10)
    # Sales
    await async_client.post("/api/sales", json={"product_id": product_id, "csv_text": "2024-01-02,Red,Red Color,2,25.00,M,Red,Retail,Category A,Customer A"}, timeout=10)
    # Inward return
    await async_client.post("/api/inward", json={"product_id": product_id, "csv_text": "2024-01-03,Blue,Blue Color,1,15.00,L,Blue,Return,Category A,Supplier A"}, timeout=10)
    # Sales return
    await async_client.post("/api/sales", json={"product_id": product_id, "csv_text": "2024-01-04,Red,Red Color,1,25.00,M,Red,Return,Category A,Customer A"}, timeout=10)
    response = await async_client.get(f"/api/stock/{product_id}", timeout=10)
    assert response.status_code == 200
    matrix = response.json()
    assert matrix["Red"]["M"] == 9  # 10 - 2 + 1
    assert matrix["Blue"]["L"] == 4  # 5 - 1

    return product_id 