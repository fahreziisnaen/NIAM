from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class MaintenanceBase(BaseModel):
    ticket_number: str
    asset_id: int
    maintenance_type: str
    scheduled_date: Optional[datetime] = None
    technician: Optional[str] = "Certified Network Field Engineer"
    vendor_id: Optional[int] = None
    description: str
    root_cause: Optional[str] = None
    resolution: Optional[str] = None
    cost: Optional[float] = 0.0
    status: Optional[str] = "Scheduled"

class MaintenanceCreate(MaintenanceBase):
    pass

class MaintenanceUpdate(BaseModel):
    maintenance_type: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    completion_date: Optional[datetime] = None
    technician: Optional[str] = None
    description: Optional[str] = None
    root_cause: Optional[str] = None
    resolution: Optional[str] = None
    cost: Optional[float] = None
    status: Optional[str] = None

class MaintenanceOut(MaintenanceBase):
    id: int
    reported_date: Optional[datetime] = None
    completion_date: Optional[datetime] = None
    created_at: Optional[datetime] = None
    hostname: Optional[str] = None
    asset_id_str: Optional[str] = None
    model_name: Optional[str] = None
    vendor_name: Optional[str] = None

    class Config:
        from_attributes = True

