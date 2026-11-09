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

class VLANUpdate(BaseModel):
    vlan_id: Optional[int] = None
    name: Optional[str] = None
    subnet: Optional[str] = None
    gateway: Optional[str] = None
    location_id: Optional[int] = None
    description: Optional[str] = None

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

class IPAddressUpdate(BaseModel):
    ip_address: Optional[str] = None
    ip_version: Optional[str] = None
    subnet: Optional[str] = None
    vlan_id: Optional[int] = None
    status: Optional[str] = None
    asset_id: Optional[int] = None
    hostname: Optional[str] = None
    mac_address: Optional[str] = None
    interface_name: Optional[str] = None
    description: Optional[str] = None

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

class ConnectionUpdate(BaseModel):
    source_asset_id: Optional[int] = None
    source_port: Optional[str] = None
    target_asset_id: Optional[int] = None
    target_port: Optional[str] = None
    connection_type: Optional[str] = None
    bandwidth_gbps: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None

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
