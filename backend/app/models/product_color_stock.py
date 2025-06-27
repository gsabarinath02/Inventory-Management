from sqlalchemy import Column, Integer, String, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.models.base import Base

class ProductColorStock(Base):
    __tablename__ = 'product_color_stocks'

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey('products.id', ondelete="CASCADE"), nullable=False)
    color = Column(String, nullable=False)
    total_stock = Column(Integer, default=0, nullable=False)
    colour_code = Column(Integer, nullable=True)
    sizes = Column(JSON, nullable=True)  # e.g., {"S": 10, "M": 5, ...}

    product = relationship("Product", back_populates="product_color_stocks") 