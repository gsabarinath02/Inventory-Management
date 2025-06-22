from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime, date

# Base Models
class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    sku: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    sizes: List[str] = Field(default_factory=list)
    colors: List[str] = Field(default_factory=list)

class ProductCreate(ProductBase):
    unit_price: float = Field(..., gt=0)

class ProductUpdate(ProductBase):
    unit_price: Optional[float] = Field(None, gt=0)

# Output Models for specific routes
class ProductOut(ProductBase):
    id: int
    unit_price: float
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

class Product(ProductOut): # Keep for compatibility if needed elsewhere
    pass

class UploadResult(BaseModel):
    status: str
    rows_processed: int
    errors: List[str]

# Log Models
class InwardLogBase(BaseModel):
    product_id: int = Field(...)
    quantity: int = Field(..., gt=0)
    unit_cost: float = Field(..., ge=0)
    size: Optional[str] = Field(None)
    color: Optional[str] = Field(None)
    color_name: Optional[str] = Field(None)
    category: Optional[str] = Field(None)
    supplier: Optional[str] = Field(None)
    notes: Optional[str] = Field(None)

class InwardLogCreate(InwardLogBase):
    pass

class InwardLog(InwardLogBase):
    id: int
    created_at: datetime
    
    model_config = {"from_attributes": True}

class SalesLogBase(BaseModel):
    product_id: int = Field(...)
    quantity: int = Field(..., gt=0)
    unit_price: float = Field(..., ge=0)
    size: Optional[str] = Field(None)
    color: Optional[str] = Field(None)
    color_name: Optional[str] = Field(None)
    category: Optional[str] = Field(None)
    customer: Optional[str] = Field(None)
    notes: Optional[str] = Field(None)

class SalesLogCreate(SalesLogBase):
    pass

class SalesLog(SalesLogBase):
    id: int
    created_at: datetime
    
    model_config = {"from_attributes": True}

# Report/Stock Models
class StockInfo(BaseModel):
    product: Product
    total_inward: int
    total_sales: int
    current_stock: int
    total_inward_value: float
    total_sales_value: float