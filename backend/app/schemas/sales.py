from pydantic import BaseModel, ConfigDict
from datetime import date

class SalesLogBase(BaseModel):
    product_id: int
    color: str
    colour_code: int | None = None
    size: str
    quantity: int
    date: date
    agency_name: str | None = None
    store_name: str | None = None

class SalesLogCreate(SalesLogBase):
    pass

class SalesLogUpdate(SalesLogBase):
    pass

class SalesLogInDB(SalesLogBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

class SalesLog(SalesLogInDB):
    pass
