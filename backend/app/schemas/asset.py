from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime, date
from decimal import Decimal

class AssetBase(BaseModel):
    asset_id: str
    hostname: str
    serial_number: str
    asset_tag: Optional[str] = None
    device_name: Optional[str] = None
    description: Optional[str] = None
    
    manufacturer: str
    vendor_id: Optional[int] = None
    model_id: Optional[int] = None
    hardware_revision: Optional[str] = "1.0"
    category_id: Optional[int] = None
    device_type: Optional[str] = "Network Infrastructure"
    device_role: Optional[str] = "Access / Edge"
    
    ownership_type: Optional[str] = "Company Owned"
    rental_provider: Optional[str] = None
    rental_agreement_ref: Optional[str] = None
    rental_start_date: Optional[date] = None
    rental_end_date: Optional[date] = None
    monthly_rental_cost: Optional[float] = 0.0
    total_rental_cost: Optional[float] = 0.0
    return_conditions: Optional[str] = None
    return_date: Optional[date] = None
    renewal_status: Optional[str] = "Active"
    
    po_number: Optional[str] = None
    purchase_date: Optional[date] = None
    purchase_price: Optional[float] = 0.0
    currency: Optional[str] = "HKD"
    supplier: Optional[str] = None
    invoice_number: Optional[str] = None
    procurement_reference: Optional[str] = None
    
    management_ip: Optional[str] = None
    mac_address: Optional[str] = None
    firmware_version: Optional[str] = None
    operating_system: Optional[str] = None
    software_version: Optional[str] = None
    management_protocol: Optional[str] = "SSH / HTTPS"
    
    location_id: Optional[int] = None
    building_id: Optional[int] = None
    floor_id: Optional[int] = None
    rack_id: Optional[int] = None
    rack_position: Optional[str] = None
    location_display: Optional[str] = None
    
    vlan: Optional[str] = "VLAN 100"
    subnet: Optional[str] = "10.200.10.0/24"
    default_gateway: Optional[str] = "10.200.10.1"
    network_segment: Optional[str] = "Core Datacenter Backbone"
    connected_device: Optional[str] = None
    uplink_port: Optional[str] = "Te1/0/1"
    interface_info: Optional[str] = None
    
    acquisition_date: Optional[date] = None
    deployment_date: Optional[date] = None
    operational_status: Optional[str] = "Deployed"
    asset_condition: Optional[str] = "Operational"
    end_of_life_date: Optional[date] = None
    end_of_support_date: Optional[date] = None

class AssetCreate(AssetBase):
    pass

class AssetUpdate(BaseModel):
    hostname: Optional[str] = None
    asset_tag: Optional[str] = None
    description: Optional[str] = None
    vendor_id: Optional[int] = None
    model_id: Optional[int] = None
    hardware_revision: Optional[str] = None
    category_id: Optional[int] = None
    device_role: Optional[str] = None
    ownership_type: Optional[str] = None
    rental_provider: Optional[str] = None
    rental_agreement_ref: Optional[str] = None
    rental_end_date: Optional[date] = None
    monthly_rental_cost: Optional[float] = None
    management_ip: Optional[str] = None
    mac_address: Optional[str] = None
    firmware_version: Optional[str] = None
    operating_system: Optional[str] = None
    location_id: Optional[int] = None
    rack_id: Optional[int] = None
    rack_position: Optional[str] = None
    location_display: Optional[str] = None
    vlan: Optional[str] = None
    subnet: Optional[str] = None
    default_gateway: Optional[str] = None
    operational_status: Optional[str] = None
    asset_condition: Optional[str] = None

class AssetOut(AssetBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    model_name: Optional[str] = None
    vendor_name: Optional[str] = None
    category_name: Optional[str] = None

    class Config:
        from_attributes = True

class AssetDetailOut(AssetOut):
    contracts: List[Dict[str, Any]] = []
    warranties: List[Dict[str, Any]] = []
    interfaces: List[Dict[str, Any]] = []
    maintenance_history: List[Dict[str, Any]] = []
    documents: List[Dict[str, Any]] = []
    audit_history: List[Dict[str, Any]] = []
    topology_neighbors: List[Dict[str, Any]] = []

