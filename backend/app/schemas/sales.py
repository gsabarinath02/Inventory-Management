from pydantic import BaseModel, ConfigDict
from datetime import date

class SalesLogBase(BaseModel):
    product_id: int
    color: str
    colour_code: int | None = None
    sizes: dict[str, int]  # e.g., {"S": 10, "M": 5, ...}
    date: date
    agency_name: str | None = None
    store_name: str | None = None
    operation: str  # 'Inward' or 'Sale'

class SalesLogCreate(SalesLogBase):
    pass

class SalesLogUpdate(SalesLogBase):
    pass

class SalesLogInDB(SalesLogBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

class SalesLog(SalesLogInDB):
    pass
