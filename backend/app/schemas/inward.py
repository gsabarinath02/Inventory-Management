from pydantic import BaseModel
from datetime import date
import enum

class InwardCategory(str, enum.Enum):
    SUPPLY = "Supply"
    RETURN = "Return"

class InwardLogBase(BaseModel):
    product_id: int
    color: str
    colour_code: int
    size: str
    quantity: int
    date: date
    category: InwardCategory = InwardCategory.SUPPLY
    stakeholder_name: str | None = None

class InwardLogCreate(InwardLogBase):
    pass

class InwardLogUpdate(InwardLogBase):
    pass

class InwardLogInDB(InwardLogBase):
    id: int

    class Config:
        orm_mode = True

class InwardLog(InwardLogInDB):
    pass
