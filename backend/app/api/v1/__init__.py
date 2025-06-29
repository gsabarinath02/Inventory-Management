from fastapi import APIRouter

from . import auth, users, products, inward, sales, orders, stock, audit_logs, customers, agencies

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(inward.router, prefix="/inward", tags=["inward"])
api_router.include_router(sales.router, prefix="/sales", tags=["sales"])
api_router.include_router(orders.router, prefix="", tags=["orders"])
api_router.include_router(stock.router, prefix="/stock", tags=["stock"])
api_router.include_router(audit_logs.router, prefix="/audit-logs", tags=["audit-logs"])
api_router.include_router(customers.router, prefix="/customers", tags=["customers"])
api_router.include_router(agencies.router, prefix="/agencies", tags=["agencies"])
