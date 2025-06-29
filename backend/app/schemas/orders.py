from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, List
from datetime import date

class OrderBase(BaseModel):
    product_id: int
    color: str
    colour_code: Optional[int] = None
    sizes: Dict[str, int]
    date: date
    agency_name: Optional[str] = None
    store_name: Optional[str] = None
    operation: str = "Order"

class OrderCreate(OrderBase):
    pass

class OrderUpdate(OrderBase):
    pass

class OrderInDB(OrderBase):
    id: int
    order_number: int
    financial_year: str

    model_config = ConfigDict(from_attributes=True)

class OrderResponse(OrderInDB):
    pass

class OrderBulkCreate(BaseModel):
    orders: List[OrderCreate]

class OrderBulkResponse(BaseModel):
    rows_processed: int
    errors: Optional[List[str]] = None 