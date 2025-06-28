from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime

class AgencyBase(BaseModel):
    agency_name: str = Field(..., min_length=1, max_length=255)
    owner_mobile: str = Field(..., min_length=10, max_length=15)
    accounts_mobile: str = Field(..., min_length=10, max_length=15)
    days_of_payment: int = Field(..., ge=0, le=365)
    gst_number: str = Field(..., min_length=15, max_length=15)
    address: str = Field(..., min_length=1)
    pincode: str = Field(..., min_length=6, max_length=6)
    region_covered: str = Field(..., min_length=1)

    @validator('owner_mobile', 'accounts_mobile')
    def validate_mobile(cls, v):
        if not v.isdigit():
            raise ValueError('Mobile number must contain only digits')
        return v

    @validator('gst_number')
    def validate_gst(cls, v):
        if len(v) != 15:
            raise ValueError('GST number must be exactly 15 characters')
        if not v.isalnum():
            raise ValueError('GST number must contain only alphanumeric characters')
        return v

    @validator('pincode')
    def validate_pincode(cls, v):
        if not v.isdigit():
            raise ValueError('Pincode must contain only digits')
        return v

class AgencyCreate(AgencyBase):
    pass

class AgencyUpdate(BaseModel):
    agency_name: Optional[str] = Field(None, min_length=1, max_length=255)
    owner_mobile: Optional[str] = Field(None, min_length=10, max_length=15)
    accounts_mobile: Optional[str] = Field(None, min_length=10, max_length=15)
    days_of_payment: Optional[int] = Field(None, ge=0, le=365)
    gst_number: Optional[str] = Field(None, min_length=15, max_length=15)
    address: Optional[str] = Field(None, min_length=1)
    pincode: Optional[str] = Field(None, min_length=6, max_length=6)
    region_covered: Optional[str] = Field(None, min_length=1)

class Agency(AgencyBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True 