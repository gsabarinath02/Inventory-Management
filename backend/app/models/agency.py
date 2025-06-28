from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from ..database import Base

class Agency(Base):
    __tablename__ = "agencies"
    
    id = Column(Integer, primary_key=True, index=True)
    agency_name = Column(String, unique=True, index=True, nullable=False)
    owner_mobile = Column(String, nullable=False)
    accounts_mobile = Column(String, nullable=False)
    days_of_payment = Column(Integer, nullable=False)
    gst_number = Column(String, nullable=False)
    address = Column(Text, nullable=False)
    pincode = Column(String, nullable=False)
    region_covered = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now()) 