import asyncio
import logging
from database import engine
from models import Base, Product, InwardLog, SalesLog
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def init_db():
    """Initialize database with sample data"""
    try:
        # Create tables
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created successfully")

        # Create session
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        
        async with async_session() as session:
            # Check if we already have products
            result = await session.execute("SELECT COUNT(*) FROM products")
            count = result.scalar()
            
            if count == 0:
                # Add sample products
                sample_products = [
                    Product(
                        name="T-Shirt",
                        sku="TS001",
                        description="Cotton T-Shirt",
                        unit_price=25.99,
                        sizes=["S", "M", "L", "XL"],
                        colors=["Red", "Blue", "Black"]
                    ),
                    Product(
                        name="Jeans",
                        sku="JN001",
                        description="Denim Jeans",
                        unit_price=49.99,
                        sizes=["30", "32", "34", "36"],
                        colors=["Blue", "Black", "Grey"]
                    ),
                    Product(
                        name="Sneakers",
                        sku="SN001",
                        description="Running Sneakers",
                        unit_price=79.99,
                        sizes=["7", "8", "9", "10", "11"],
                        colors=["White", "Black", "Red"]
                    )
                ]
                
                for product in sample_products:
                    session.add(product)
                
                await session.commit()
                logger.info("Sample products added successfully")
                
                # Add sample inward logs
                sample_inward = [
                    InwardLog(
                        product_id=1,
                        quantity=50,
                        unit_cost=15.00,
                        size="M",
                        color="Red",
                        supplier="Supplier A",
                        notes="Initial stock"
                    ),
                    InwardLog(
                        product_id=1,
                        quantity=30,
                        unit_cost=15.00,
                        size="L",
                        color="Blue",
                        supplier="Supplier A",
                        notes="Restock"
                    ),
                    InwardLog(
                        product_id=2,
                        quantity=25,
                        unit_cost=30.00,
                        size="32",
                        color="Blue",
                        supplier="Supplier B",
                        notes="Initial stock"
                    )
                ]
                
                for inward in sample_inward:
                    session.add(inward)
                
                await session.commit()
                logger.info("Sample inward logs added successfully")
                
                # Add sample sales logs
                sample_sales = [
                    SalesLog(
                        product_id=1,
                        quantity=5,
                        unit_price=25.99,
                        size="M",
                        color="Red",
                        customer="Customer A",
                        notes="Online order"
                    ),
                    SalesLog(
                        product_id=1,
                        quantity=3,
                        unit_price=25.99,
                        size="L",
                        color="Blue",
                        customer="Customer B",
                        notes="Store sale"
                    ),
                    SalesLog(
                        product_id=2,
                        quantity=2,
                        unit_price=49.99,
                        size="32",
                        color="Blue",
                        customer="Customer C",
                        notes="Online order"
                    )
                ]
                
                for sales in sample_sales:
                    session.add(sales)
                
                await session.commit()
                logger.info("Sample sales logs added successfully")
            else:
                logger.info("Database already contains data, skipping sample data creation")
                
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(init_db()) 