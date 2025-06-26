import asyncio
from app.models import Product
from app.database import AsyncSessionLocal, Base, engine
import json

async def insert_product():
    # Create tables if not exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    # Insert a test product
    async with AsyncSessionLocal() as session:
        product = Product(
            name="Demo Product",
            sku="DP001",
            description="A demo product for testing update/delete.",
            unit_price=150.0,
            sizes=json.dumps(["S", "M", "L"]),
            colors=json.dumps([
                {"color": "Red", "colour_code": 101},
                {"color": "Blue", "colour_code": 102}
            ])
        )
        session.add(product)
        await session.commit()
        await session.refresh(product)
        print(f"Inserted product with ID: {product.id}")

if __name__ == "__main__":
    asyncio.run(insert_product()) 