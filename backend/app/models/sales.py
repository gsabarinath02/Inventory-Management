from sqlalchemy import Column, Integer, String, ForeignKey, Date, JSON
from sqlalchemy.orm import relationship
from ..database import Base

class SalesLog(Base):
    __tablename__ = "sales_logs"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    color = Column(String, nullable=False)
    colour_code = Column(Integer, nullable=True)
    sizes = Column(JSON, nullable=False)  # e.g., {"S": 10, "M": 5, ...}
    date = Column(Date, nullable=False)
    agency_name = Column(String, nullable=True)
    store_name = Column(String, nullable=True)
    operation = Column(String, nullable=False)  # 'Inward' or 'Sale'
    order_number = Column(Integer, nullable=True)

    product = relationship("Product", back_populates="sales_logs")
