import pytest
import pytest_asyncio
from httpx import AsyncClient

@pytest_asyncio.fixture(scope="function", autouse=True)
async def setup_product_and_logs(client: AsyncClient):
    """Set up a product and its inward/sales logs for stock calculation."""
    # 1. Create product
    res = await client.post(
        "/api/products",
        json={"name": "Test Stock Product", "sku": "SP001", "unit_price": 50.0, "sizes": ["S", "M"], "colors": ["Green", "Yellow"]}
    )
    assert res.status_code == 201
    product_id = res.json()["id"]

    # 2. Add inward logs
    inward_csv = """2025-06-21,GRN,Green,10,5.0,S,Green,Supply,SupX
2025-06-21,GRN,Green,5,5.0,M,Green,Supply,SupX
2025-06-21,YLW,Yellow,8,5.0,S,Yellow,Supply,SupY"""
    res = await client.post("/api/inward", json={"product_id": product_id, "csv_text": inward_csv})
    assert res.status_code == 200
    assert res.json()["rows_processed"] == 3

    # 3. Add sales logs
    sales_csv = """2025-06-22,GRN,Green,2,50.0,S,Green,Sale,CustX
2025-06-22,GRN,Green,1,50.0,M,Green,Sale,CustX
2025-06-22,YLW,Yellow,3,50.0,S,Yellow,Sale,CustY"""
    res = await client.post("/api/sales", json={"product_id": product_id, "csv_text": sales_csv})
    assert res.status_code == 200
    assert res.json()["rows_processed"] == 3

    return product_id

@pytest.mark.asyncio
async def test_get_stock_matrix(client: AsyncClient, setup_product_and_logs):
    product_id = setup_product_and_logs
    
    response = await client.get(f"/api/stock/{product_id}")
    assert response.status_code == 200
    
    matrix = response.json()
    # Expected format: { [color: string]: { [size: string]: number } }

    # Expected:
    # Green: S=10-2=8, M=5-1=4
    # Yellow: S=8-3=5
    assert "Green" in matrix
    assert "Yellow" in matrix
    assert matrix["Green"]["S"] == 8
    assert matrix["Green"]["M"] == 4
    assert matrix["Yellow"]["S"] == 5
    # Ensure no phantom entries
    assert "L" not in matrix["Green"]
    assert "M" not in matrix["Yellow"]

@pytest.mark.asyncio
async def test_get_stock_matrix_with_negative_values(client: AsyncClient, setup_product_and_logs):
    product_id = setup_product_and_logs
    
    # Add more sales to create negative stock
    sales_csv = """2025-06-23,GRN,Green,15,50.0,S,Green,Sale,CustZ"""
    res = await client.post("/api/sales", json={"product_id": product_id, "csv_text": sales_csv})
    assert res.status_code == 200
    
    response = await client.get(f"/api/stock/{product_id}")
    assert response.status_code == 200
    
    matrix = response.json()
    # Green S should now be 8 - 15 = -7
    assert matrix["Green"]["S"] == -7 