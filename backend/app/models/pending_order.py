from .base import Base
from sqlalchemy import Column, Integer, String, Date, JSON, ForeignKey, DateTime, UniqueConstraint
from datetime import datetime

class PendingOrder(Base):
    __tablename__ = "pending_orders"
    __table_args__ = (UniqueConstraint('order_number', 'financial_year', name='uq_pending_order_number_finyear'),)
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, nullable=False)
    date = Column(Date, nullable=False)
    colour_code = Column(Integer, nullable=True)
    color = Column(String, nullable=True)
    sizes = Column(JSON, nullable=True)
    agency_name = Column(String, nullable=True)
    store_name = Column(String, nullable=True)
    operation = Column(String, nullable=True)
    order_number = Column(Integer, nullable=False)
    financial_year = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow) 