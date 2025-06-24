from fastapi import FastAPI, Request, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from .database import get_db, AsyncSessionLocal
from .api.v1 import products, inward, sales, stock, auth, users, audit_logs
from app.database import engine, Base
from sqlalchemy import text
from .core.logging_context import current_user_var
from .api.deps import get_current_user
from .core.services.audit_logger import setup_audit_logging
from app.utils.scheduler import start_scheduler
from fastapi.exceptions import RequestValidationError
import logging

app = FastAPI(title="Inventory Management System")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def db_session_middleware(request: Request, call_next):
    # This part is just an example of how you might get the user.
    # In a real app, you would decode a token from the request headers.
    token = request.headers.get("Authorization")
    user = None
    if token:
        try:
            # A simplified way to get user; in reality, you'd have a DB session here
            # and call get_current_user properly. This is just for context.
            # For the purpose of this middleware, we might need a simplified get_current_user
            # or handle it gracefully if the user is not available on certain routes.
            # As get_current_user is async and depends on DB, we can't call it here directly
            # without a DB session. This highlights the complexity.
            # A better approach would be to have this logic inside another dependency
            # that runs after the db session is available.
            # For now, we'll set a placeholder or find a way to get the user.
            # The dependency injection of FastAPI will handle the user for endpoints,
            # but for a middleware that runs for every request, it's different.
            
            # Let's assume we can get a temporary DB session for this.
            async with AsyncSessionLocal() as db:
                try:
                    # We need to extract the token string "Bearer <token>"
                    if token.startswith("Bearer "):
                        token_str = token.split(" ")[1]
                        user = await get_current_user(token=token_str, db=db)
                    else:
                        user = None
                except Exception:
                    user = None # Could not validate, or no token
        except (IndexError, AttributeError):
            user = None
    
    current_user_var.set(user)
    response = await call_next(request)
    return response

# API routers
app.include_router(products.router, prefix="/api/v1/products", tags=["products"])
app.include_router(inward.router, prefix="/api/v1/inward", tags=["inward"])
app.include_router(sales.router, prefix="/api/v1/sales", tags=["sales"])
app.include_router(stock.router, prefix="/api/v1/stock", tags=["stock"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(audit_logs.router, prefix="/api/v1/audit-logs", tags=["audit-logs"])

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

# Setup event listeners for audit logging
setup_audit_logging() 

if __name__ == "__main__":
    start_scheduler()

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    logging.error(f"422 Validation Error: {exc.errors()} | Body: {exc.body}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body},
    ) 