from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime

class RackOut(BaseModel):
    id: int
    rack_name: str
    rack_number: Optional[str] = None
    room: Optional[str] = None
    total_u: int
    power_feed: Optional[str] = None
    asset_count: Optional[int] = 0

    class Config:
        from_attributes = True

class LocationBase(BaseModel):
    code: str
    name: str
    type: Optional[str] = "Data Center"
    country: Optional[str] = "Hong Kong"
    city: Optional[str] = "Hong Kong"
    address: Optional[str] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None

class LocationCreate(LocationBase):
    pass

class LocationOut(LocationBase):
    id: int
    created_at: Optional[datetime] = None
    asset_count: Optional[int] = 0
    rack_count: Optional[int] = 0
    racks: List[RackOut] = []

    class Config:
        from_attributes = True

