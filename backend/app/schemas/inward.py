from pydantic import BaseModel, ConfigDict
from datetime import date
import enum

class InwardCategory(str, enum.Enum):
    SUPPLY = "Supply"
    RETURN = "Return"

class InwardLogBase(BaseModel):
    product_id: int
    color: str
    colour_code: int
    sizes: dict[str, int]  # e.g., {"S": 10, "M": 5, ...}
    date: date
    category: InwardCategory = InwardCategory.SUPPLY
    stakeholder_name: str | None = None
    operation: str  # 'Inward' or 'Sale'

class InwardLogCreate(InwardLogBase):
    pass

class InwardLogUpdate(InwardLogBase):
    pass

class InwardLogInDB(InwardLogBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

class InwardLog(InwardLogInDB):
    pass
