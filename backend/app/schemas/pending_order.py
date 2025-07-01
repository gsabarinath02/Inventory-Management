from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, List
from datetime import date

class PendingOrderBase(BaseModel):
    product_id: int
    color: str
    colour_code: Optional[int] = None
    sizes: Dict[str, int]
    date: date
    agency_name: Optional[str] = None
    store_name: Optional[str] = None
    operation: str = "Order"

class PendingOrderCreate(PendingOrderBase):
    pass

class PendingOrderUpdate(PendingOrderBase):
    pass

class PendingOrderInDB(PendingOrderBase):
    id: int
    order_number: int
    financial_year: str
    model_config = ConfigDict(from_attributes=True)

class PendingOrderResponse(PendingOrderInDB):
    pass

class PendingOrderBulkCreate(BaseModel):
    orders: List[PendingOrderCreate]

class PendingOrderBulkResponse(BaseModel):
    rows_processed: int
    errors: Optional[List[str]] = None 