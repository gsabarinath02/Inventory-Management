from sqlalchemy import Column, Integer, String, ForeignKey, Date
from sqlalchemy.orm import relationship
from ..database import Base

class SalesLog(Base):
    __tablename__ = "sales_logs"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    color = Column(String, nullable=False)
    size = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    date = Column(Date, nullable=False)
    agency_name = Column(String, nullable=True)
    store_name = Column(String, nullable=True)

    product = relationship("Product", back_populates="sales_logs")
