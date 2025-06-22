from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    sku = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text)
    unit_price = Column(Float, nullable=False)
    sizes = Column(JSON, default=list)  # List of available sizes
    colors = Column(JSON, default=list)  # List of available colors
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    inward_logs = relationship("InwardLog", back_populates="product", cascade="all, delete-orphan")
    sales_logs = relationship("SalesLog", back_populates="product", cascade="all, delete-orphan")

class InwardLog(Base):
    __tablename__ = "inward_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_cost = Column(Float, nullable=False)
    size = Column(String(50))  # Size for this inward entry
    color = Column(String(50))  # Color for this inward entry
    color_name = Column(String(100))  # Color name from CSV
    category = Column(String(100))  # Category from CSV
    supplier = Column(String(255))  # Agency/Supplier
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    product = relationship("Product", back_populates="inward_logs")

class SalesLog(Base):
    __tablename__ = "sales_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    size = Column(String(50))  # Size for this sales entry
    color = Column(String(50))  # Color for this sales entry
    color_name = Column(String(100))  # Color name from CSV
    category = Column(String(100))  # Category from CSV
    customer = Column(String(255))  # Party name/Customer
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    product = relationship("Product", back_populates="sales_logs") 