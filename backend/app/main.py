from fastapi import FastAPI, Request, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from .database import get_db
from .api.v1 import products, inward, sales, stock, auth, users
from app.database import engine, Base
from sqlalchemy import text

app = FastAPI(title="Inventory Management System")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routers
app.include_router(products.router, prefix="/api/v1/products", tags=["products"])
app.include_router(inward.router, prefix="/api/v1/inward", tags=["inward"])
app.include_router(sales.router, prefix="/api/v1/sales", tags=["sales"])
app.include_router(stock.router, prefix="/api/v1/stock", tags=["stock"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])

@app.get("/")
async def root():
    return {"message": "Welcome to the Inventory Management System API"}

@app.get("/health")
async def health_check():
    """Comprehensive health check endpoint"""
    try:
        # Test database connection
        async with engine.begin() as connection:
            result = await connection.execute(text("SELECT 1"))
            db_healthy = result.scalar() == 1
            
        # Check if tables exist
        tables_query = text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('products', 'inward_logs', 'sales_logs', 'product_color_stocks', 'users')
        """)
        
        async with engine.begin() as connection:
            result = await connection.execute(tables_query)
            existing_tables = [row[0] for row in result.fetchall()]
            
        return {
            "status": "healthy" if db_healthy else "unhealthy",
            "database": {
                "connected": db_healthy,
                "tables": existing_tables,
                "expected_tables": ["products", "inward_logs", "sales_logs", "product_color_stocks", "users"]
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
                "expected_tables": ["products", "inward_logs", "sales_logs", "product_color_stocks", "users"]
            },
            "timestamp": "2025-06-22T09:15:00Z"
        } 