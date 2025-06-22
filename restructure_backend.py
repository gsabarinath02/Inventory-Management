#!/usr/bin/env python3
"""
Backend Restructuring Script
This script helps restructure the backend codebase into a modular structure.
"""

import os
import shutil
from pathlib import Path

def create_directory_structure():
    """Create the new modular directory structure"""
    
    # Define the new structure
    directories = [
        "backend/app",
        "backend/app/models",
        "backend/app/schemas", 
        "backend/app/api",
        "backend/app/api/v1",
        "backend/app/core",
        "backend/app/core/crud",
        "backend/app/core/services",
        "backend/app/utils",
        "backend/tests/api",
        "backend/tests/utils"
    ]
    
    # Create directories
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        print(f"Created directory: {directory}")

def create_init_files():
    """Create __init__.py files for Python packages"""
    
    init_locations = [
        "backend/app",
        "backend/app/models",
        "backend/app/schemas",
        "backend/app/api", 
        "backend/app/api/v1",
        "backend/app/core",
        "backend/app/core/crud",
        "backend/app/core/services",
        "backend/app/utils",
        "backend/tests",
        "backend/tests/api",
        "backend/tests/utils"
    ]
    
    for location in init_locations:
        init_file = Path(location) / "__init__.py"
        if not init_file.exists():
            init_file.touch()
            print(f"Created: {init_file}")

def move_and_restructure_files():
    """Move existing files to new structure and create modular versions"""
    
    # Move main files
    moves = [
        ("backend/config.py", "backend/app/config.py"),
        ("backend/database.py", "backend/app/database.py"),
        ("backend/models.py", "backend/app/models/base.py"),
        ("backend/schemas.py", "backend/app/schemas/base.py"),
        ("backend/crud.py", "backend/app/core/crud/base.py"),
    ]
    
    for src, dst in moves:
        if Path(src).exists():
            shutil.copy2(src, dst)
            print(f"Copied: {src} -> {dst}")

def create_modular_models():
    """Create separate model files"""
    
    # Product model
    product_model = '''from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    sku = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text)
    unit_price = Column(Float, nullable=False)
    sizes = Column(JSON, default=list)
    colors = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    inward_logs = relationship("InwardLog", back_populates="product", cascade="all, delete-orphan")
    sales_logs = relationship("SalesLog", back_populates="product", cascade="all, delete-orphan")
'''
    
    # Inward model
    inward_model = '''from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base

class InwardLog(Base):
    __tablename__ = "inward_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_cost = Column(Float, nullable=False)
    size = Column(String(50))
    color = Column(String(50))
    color_name = Column(String(100))
    category = Column(String(100))
    supplier = Column(String(255))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    product = relationship("Product", back_populates="inward_logs")
'''
    
    # Sales model
    sales_model = '''from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base

class SalesLog(Base):
    __tablename__ = "sales_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    size = Column(String(50))
    color = Column(String(50))
    color_name = Column(String(100))
    category = Column(String(100))
    customer = Column(String(255))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    product = relationship("Product", back_populates="sales_logs")
'''
    
    # Write model files
    models = [
        ("backend/app/models/product.py", product_model),
        ("backend/app/models/inward.py", inward_model),
        ("backend/app/models/sales.py", sales_model)
    ]
    
    for file_path, content in models:
        with open(file_path, 'w') as f:
            f.write(content)
        print(f"Created: {file_path}")

def create_modular_schemas():
    """Create separate schema files"""
    
    # Product schemas
    product_schemas = '''from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    sku: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    sizes: List[str] = Field(default_factory=list)
    colors: List[str] = Field(default_factory=list)

class ProductCreate(ProductBase):
    unit_price: float = Field(..., gt=0)

class ProductUpdate(ProductBase):
    unit_price: Optional[float] = Field(None, gt=0)

class ProductOut(ProductBase):
    id: int
    unit_price: float
    created_at: datetime
    updated_at: Optional[datetime] = None
    model_config = {"from_attributes": True}

class Product(ProductOut):
    pass
'''
    
    # Inward schemas
    inward_schemas = '''from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class InwardLogBase(BaseModel):
    product_id: int = Field(...)
    quantity: int = Field(..., gt=0)
    unit_cost: float = Field(..., ge=0)
    size: Optional[str] = Field(None)
    color: Optional[str] = Field(None)
    color_name: Optional[str] = Field(None)
    category: Optional[str] = Field(None)
    supplier: Optional[str] = Field(None)
    notes: Optional[str] = Field(None)

class InwardLogCreate(InwardLogBase):
    pass

class InwardLog(InwardLogBase):
    id: int
    created_at: datetime
    model_config = {"from_attributes": True}
'''
    
    # Sales schemas
    sales_schemas = '''from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class SalesLogBase(BaseModel):
    product_id: int = Field(...)
    quantity: int = Field(..., gt=0)
    unit_price: float = Field(..., ge=0)
    size: Optional[str] = Field(None)
    color: Optional[str] = Field(None)
    color_name: Optional[str] = Field(None)
    category: Optional[str] = Field(None)
    customer: Optional[str] = Field(None)
    notes: Optional[str] = Field(None)

class SalesLogCreate(SalesLogBase):
    pass

class SalesLog(SalesLogBase):
    id: int
    created_at: datetime
    model_config = {"from_attributes": True}
'''
    
    # Write schema files
    schemas = [
        ("backend/app/schemas/product.py", product_schemas),
        ("backend/app/schemas/inward.py", inward_schemas),
        ("backend/app/schemas/sales.py", sales_schemas)
    ]
    
    for file_path, content in schemas:
        with open(file_path, 'w') as f:
            f.write(content)
        print(f"Created: {file_path}")

def create_package_exports():
    """Create __init__.py files with proper exports"""
    
    # Models exports
    models_init = '''from .product import Product
from .inward import InwardLog
from .sales import SalesLog

__all__ = ["Product", "InwardLog", "SalesLog"]
'''
    
    # Schemas exports
    schemas_init = '''from .product import Product, ProductCreate, ProductUpdate, ProductOut
from .inward import InwardLog, InwardLogCreate, InwardLogBase
from .sales import SalesLog, SalesLogCreate, SalesLogBase

__all__ = [
    "Product", "ProductCreate", "ProductUpdate", "ProductOut",
    "InwardLog", "InwardLogCreate", "InwardLogBase",
    "SalesLog", "SalesLogCreate", "SalesLogBase"
]
'''
    
    # Write init files
    init_files = [
        ("backend/app/models/__init__.py", models_init),
        ("backend/app/schemas/__init__.py", schemas_init)
    ]
    
    for file_path, content in init_files:
        with open(file_path, 'w') as f:
            f.write(content)
        print(f"Updated: {file_path}")

def main():
    """Main restructuring function"""
    print("Starting backend restructuring...")
    
    # Create directory structure
    create_directory_structure()
    
    # Create __init__.py files
    create_init_files()
    
    # Move existing files
    move_and_restructure_files()
    
    # Create modular models
    create_modular_models()
    
    # Create modular schemas
    create_modular_schemas()
    
    # Create package exports
    create_package_exports()
    
    print("\nBackend restructuring completed!")
    print("\nNext steps:")
    print("1. Update imports in existing files")
    print("2. Move route files to app/api/v1/")
    print("3. Update main.py to use new structure")
    print("4. Test the application")
    print("5. Update frontend structure if needed")

if __name__ == "__main__":
    main() 