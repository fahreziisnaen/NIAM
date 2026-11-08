from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

class SparePartBase(BaseModel):
    part_number: str
    name: str
    category: str
    vendor_id: Optional[int] = None
    quantity: int = 0
    min_stock_level: int = 5
    unit_cost: Optional[float] = 0.0
    currency: Optional[str] = "HKD"
    stock_location: Optional[str] = "HK-DC1 Spares Locker"
    status: Optional[str] = "In Stock"
    compatibility: Optional[str] = None
    notes: Optional[str] = None

class SparePartCreate(SparePartBase):
    pass

class SparePartUpdate(BaseModel):
    name: Optional[str] = None
    quantity: Optional[int] = None
    min_stock_level: Optional[int] = None
    unit_cost: Optional[float] = None
    stock_location: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class SparePartOut(SparePartBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    vendor_name: Optional[str] = None

    class Config:
        from_attributes = True

class SpareStockTransactionCreate(BaseModel):
    transaction_type: str  # Check-in, Check-out, Adjustment
    quantity: int
    destination_asset_id: Optional[int] = None
    technician: Optional[str] = "IT Logistics"
    reference_ticket: Optional[str] = None
    notes: Optional[str] = None

class SpareStockTransactionOut(BaseModel):
    id: int
    spare_part_id: int
    transaction_type: str
    quantity: int
    destination_asset_id: Optional[int] = None
    technician: Optional[str] = None
    reference_ticket: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

