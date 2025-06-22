from pydantic import BaseModel, RootModel
from typing import Dict, Any

class ProductColorStockBase(BaseModel):
    color: str
    total_stock: int

class ProductColorStockCreate(ProductColorStockBase):
    product_id: int

class ProductColorStockUpdate(BaseModel):
    total_stock: int

class ProductColorStockInDBBase(ProductColorStockBase):
    id: int
    product_id: int

    class Config:
        orm_mode = True

class ProductColorStock(ProductColorStockInDBBase):
    pass

class StockMatrix(RootModel[Dict[str, Dict[str, Any]]]):
    """Stock matrix showing stock levels for each color/size combination"""
    pass

class DetailedStockData(RootModel[Dict[str, Dict[str, Any]]]):
    """Detailed stock information for a product"""
    pass

class StockMovement(BaseModel):
    """Stock movement information"""
    product_id: int
    color: str
    size: str
    quantity: int
    movement_type: str  # "inward" or "sales" 