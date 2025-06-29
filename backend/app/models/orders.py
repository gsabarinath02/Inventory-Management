from .base import Base
from sqlalchemy import Column, Integer, String, Date, JSON, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    date = Column(Date, nullable=False)
    colour_code = Column(Integer, nullable=True)
    color = Column(String, nullable=True)
    sizes = Column(JSON, nullable=True)
    agency_name = Column(String, nullable=True)
    store_name = Column(String, nullable=True)
    operation = Column(String, nullable=True)
    order_number = Column(Integer, nullable=True)
    financial_year = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    product = relationship("Product", back_populates="orders") 