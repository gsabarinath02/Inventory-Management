from sqlalchemy import Column, Integer, String, ForeignKey, Date, Enum
from sqlalchemy.orm import relationship
from ..database import Base
import enum

class InwardCategory(str, enum.Enum):
    SUPPLY = "Supply"
    RETURN = "Return"

class InwardLog(Base):
    __tablename__ = "inward_logs"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    color = Column(String, nullable=False)
    colour_code = Column(Integer, nullable=False)
    size = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    date = Column(Date, nullable=False)
    category = Column(Enum(InwardCategory), nullable=False, server_default=InwardCategory.SUPPLY.name)
    stakeholder_name = Column(String, nullable=True)
    
    product = relationship("Product", back_populates="inward_logs")
