from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime

class VLANBase(BaseModel):
    vlan_id: int
    name: str
    subnet: str
    gateway: str
    location_id: Optional[int] = None
    description: Optional[str] = None

class VLANCreate(VLANBase):
    pass

class VLANOut(VLANBase):
    id: int
    created_at: Optional[datetime] = None
    ip_count: Optional[int] = 0

    class Config:
        from_attributes = True

class IPAddressBase(BaseModel):
    ip_address: str
    ip_version: Optional[str] = "IPv4"
    subnet: str
    vlan_id: Optional[int] = None
    status: Optional[str] = "Available"
    asset_id: Optional[int] = None
    hostname: Optional[str] = None
    mac_address: Optional[str] = None
    interface_name: Optional[str] = None
    description: Optional[str] = None

class IPAddressCreate(IPAddressBase):
    pass

class IPAddressOut(IPAddressBase):
    id: int
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ConnectionBase(BaseModel):
    source_asset_id: int
    source_port: str
    target_asset_id: int
    target_port: str
    connection_type: Optional[str] = "10G Fiber SFP+"
    bandwidth_gbps: Optional[str] = "10 Gbps"
    status: Optional[str] = "Active"
    notes: Optional[str] = None

class ConnectionCreate(ConnectionBase):
    pass

class ConnectionOut(ConnectionBase):
    id: int
    created_at: Optional[datetime] = None
    source_hostname: Optional[str] = None
    source_model: Optional[str] = None
    source_ip: Optional[str] = None
    target_hostname: Optional[str] = None
    target_model: Optional[str] = None
    target_ip: Optional[str] = None

    class Config:
        from_attributes = True

