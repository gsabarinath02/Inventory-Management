from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class AuditLogBase(BaseModel):
    user_id: int
    username: str
    action: str
    entity: str
    entity_id: int
    field_changed: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None

class AuditLogCreate(AuditLogBase):
    pass

class AuditLogOut(AuditLogBase):
    id: int
    timestamp: datetime

    class Config:
        orm_mode = True 