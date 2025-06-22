from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.models.base import Base

class ProductColorStock(Base):
    __tablename__ = 'product_color_stocks'

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey('products.id', ondelete="CASCADE"), nullable=False)
    color = Column(String, nullable=False)
    total_stock = Column(Integer, default=0, nullable=False)

    product = relationship("Product", back_populates="product_color_stocks") 