from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from ..database import Base

class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    store_name = Column(String, unique=True, index=True, nullable=False)
    referrer = Column(String, nullable=False)  # "Nagarajan" or "Krishna Pranav"
    owner_mobile = Column(String, nullable=False)
    accounts_mobile = Column(String, nullable=False)
    days_of_payment = Column(Integer, nullable=False)
    gst_number = Column(String, nullable=False)
    address = Column(Text, nullable=False)
    pincode = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now()) 