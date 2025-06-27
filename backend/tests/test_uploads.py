# This file is kept for backward compatibility but tests have been moved to:
# - test_inward.py for inward upload tests
# - test_sales.py for sales upload tests

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import InwardLog, SalesLog

@pytest_asyncio.fixture(scope="function", autouse=True)
async def setup_product(async_client: AsyncClient):
    """Creates a product that can be used by all tests in this module."""
    response = await async_client.post(
        "/api/products",
        json={"name": "Test Product for Uploads", "sku": "UP001", "unit_price": 10.0, "sizes": ["S"], "colors": ["Red"]}
    )
    assert response.status_code == 201
    return response.json()

# Legacy tests - kept for backward compatibility
# The following tests are deprecated and covered in test_inward.py and test_sales.py with the new schema.
# @pytest.mark.asyncio
# async def test_upload_inward_csv_valid(client: AsyncClient, db_session: AsyncSession, setup_product):
#     ...
# @pytest.mark.asyncio
# async def test_upload_sales_csv_valid(client: AsyncClient, db_session: AsyncSession, setup_product):
#     ... 