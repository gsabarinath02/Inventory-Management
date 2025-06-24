from pydantic import BaseModel

class ProductColorStockBase(BaseModel):
    color: str
    total_stock: int
    colour_code: int | None = None

class ProductColorStockCreate(ProductColorStockBase):
    product_id: int

class ProductColorStockUpdate(BaseModel):
    total_stock: int
    colour_code: int | None = None

class ProductColorStockInDBBase(ProductColorStockBase):
    id: int
    product_id: int

    class Config:
        orm_mode = True

class ProductColorStock(ProductColorStockInDBBase):
    pass 