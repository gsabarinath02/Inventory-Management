from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    sku = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text)
    unit_price = Column(Float, nullable=False)
    sizes = Column(JSON, nullable=False)
    # colors: List[Dict[str, int]] as JSON, e.g. [{"color": "red", "colour_code": 101}]
    colors = Column(JSON, nullable=False)
    allowed_stores = Column(JSON, nullable=True)
    allowed_agencies = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    inward_logs = relationship("InwardLog", back_populates="product", cascade="all, delete-orphan")
    sales_logs = relationship("SalesLog", back_populates="product", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="product", cascade="all, delete-orphan")
    product_color_stocks = relationship("ProductColorStock", back_populates="product", cascade="all, delete-orphan")
