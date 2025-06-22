from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import products, inward, sales, stock
from app.database import engine, Base
from sqlalchemy import text

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Inventory Management System")

# CORS Middleware
origins = [
    "http://localhost",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
app.include_router(products.router, prefix="/api/v1/products", tags=["products"])
app.include_router(inward.router, prefix="/api/v1/inward", tags=["inward"])
app.include_router(sales.router, prefix="/api/v1/sales", tags=["sales"])
app.include_router(stock.router, prefix="/api/v1/stock", tags=["stock"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the Inventory Management System API"}

@app.get("/health")
async def health_check():
    """Comprehensive health check endpoint"""
    try:
        # Test database connection
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            db_healthy = result.scalar() == 1
            
        # Check if tables exist
        tables_query = text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('products', 'inward_logs', 'sales_logs', 'product_color_stocks')
        """)
        
        with engine.connect() as connection:
            result = connection.execute(tables_query)
            existing_tables = [row[0] for row in result.fetchall()]
            
        return {
            "status": "healthy" if db_healthy else "unhealthy",
            "database": {
                "connected": db_healthy,
                "tables": existing_tables,
                "expected_tables": ["products", "inward_logs", "sales_logs", "product_color_stocks"]
            },
            "timestamp": "2025-06-22T09:15:00Z"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "database": {
                "connected": False,
                "tables": [],
                "expected_tables": ["products", "inward_logs", "sales_logs", "product_color_stocks"]
            },
            "timestamp": "2025-06-22T09:15:00Z"
        } 