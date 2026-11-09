from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime

# ==========================================
# RACK SCHEMAS
# ==========================================
class RackBase(BaseModel):
    rack_name: str
    rack_number: Optional[str] = None
    room: Optional[str] = "Main Server Hall"
    total_u: Optional[int] = 42
    power_feed: Optional[str] = "Dual A+B Redundant (32A)"
    max_power_kw: Optional[str] = "10kW"
    floor_id: Optional[int] = None

class RackCreate(RackBase):
    pass

class RackUpdate(BaseModel):
    rack_name: Optional[str] = None
    rack_number: Optional[str] = None
    room: Optional[str] = None
    total_u: Optional[int] = None
    power_feed: Optional[str] = None
    max_power_kw: Optional[str] = None
    floor_id: Optional[int] = None

class RackOut(RackBase):
    id: int
    created_at: Optional[datetime] = None
    asset_count: Optional[int] = 0
    occupied_u: Optional[int] = 0
    available_u: Optional[int] = 42
    utilization_pct: Optional[float] = 0.0
    floor_name: Optional[str] = None
    building_name: Optional[str] = None
    location_name: Optional[str] = None
    location_code: Optional[str] = None

    class Config:
        from_attributes = True

# Elevation unit item
class RackUnitItem(BaseModel):
    u_position: int
    is_occupied: bool
    asset_id: Optional[str] = None
    hostname: Optional[str] = None
    device_name: Optional[str] = None
    model_name: Optional[str] = None
    manufacturer: Optional[str] = None
    category: Optional[str] = None
    operational_status: Optional[str] = None
    management_ip: Optional[str] = None
    rack_units: Optional[int] = 1

class RackElevationOut(BaseModel):
    rack: RackOut
    units: List[RackUnitItem] = []

# ==========================================
# FLOOR SCHEMAS
# ==========================================
class FloorBase(BaseModel):
    floor_number: str
    floor_name: Optional[str] = "Primary Network Hall"
    building_id: int

class FloorCreate(FloorBase):
    pass

class FloorUpdate(BaseModel):
    floor_number: Optional[str] = None
    floor_name: Optional[str] = None
    building_id: Optional[int] = None

class FloorOut(FloorBase):
    id: int
    building_name: Optional[str] = None
    location_name: Optional[str] = None
    location_code: Optional[str] = None
    rack_count: Optional[int] = 0

    class Config:
        from_attributes = True

# ==========================================
# BUILDING SCHEMAS
# ==========================================
class BuildingBase(BaseModel):
    code: str
    name: str
    address: Optional[str] = None
    location_id: int

class BuildingCreate(BuildingBase):
    pass

class BuildingUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    address: Optional[str] = None
    location_id: Optional[int] = None

class BuildingOut(BuildingBase):
    id: int
    location_name: Optional[str] = None
    location_code: Optional[str] = None
    floor_count: Optional[int] = 0
    rack_count: Optional[int] = 0

    class Config:
        from_attributes = True

# ==========================================
# LOCATION / SITE SCHEMAS
# ==========================================
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

class LocationUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    type: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None

class LocationOut(LocationBase):
    id: int
    created_at: Optional[datetime] = None
    asset_count: Optional[int] = 0
    building_count: Optional[int] = 0
    floor_count: Optional[int] = 0
    rack_count: Optional[int] = 0
    racks: List[RackOut] = []

    class Config:
        from_attributes = True
