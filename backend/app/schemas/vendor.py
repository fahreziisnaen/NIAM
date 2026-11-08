from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime

class VendorBase(BaseModel):
    vendor_code: str
    name: str
    category: Optional[str] = "Network Hardware"
    manufacturer: Optional[str] = None
    primary_contact: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    country: Optional[str] = "Hong Kong"
    support_contact: Optional[str] = None
    support_email: Optional[str] = None
    support_hotline: Optional[str] = None
    website: Optional[str] = None
    status: Optional[str] = "Active"
    notes: Optional[str] = None

class VendorCreate(VendorBase):
    pass

class VendorUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    primary_contact: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    support_contact: Optional[str] = None
    support_email: Optional[str] = None
    support_hotline: Optional[str] = None
    website: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class VendorOut(VendorBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    asset_count: Optional[int] = 0
    contract_count: Optional[int] = 0

    class Config:
        from_attributes = True

