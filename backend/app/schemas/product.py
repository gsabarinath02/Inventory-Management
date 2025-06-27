from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime

class ColorCodePair(BaseModel):
    color: str
    colour_code: int

class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    sku: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    sizes: List[str] = Field(default_factory=list)
    colors: List[ColorCodePair] = Field(default_factory=list, description="List of color/colour_code pairs")
    allowed_stores: List[str] = Field(default_factory=list, description="List of allowed store names")
    allowed_agencies: List[str] = Field(default_factory=list, description="List of allowed agency names")

class ProductCreate(ProductBase):
    unit_price: float  # Allow any float for testing

class ProductUpdate(ProductBase):
    unit_price: Optional[float]  # Allow any float for testing

class ProductOut(ProductBase):
    id: int
    unit_price: float
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class Product(ProductOut):
    pass
