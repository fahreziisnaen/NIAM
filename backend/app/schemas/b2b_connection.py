from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import date, datetime

class B2BConnectionBase(BaseModel):
    profile_name: str = Field(..., description="B2B Connection Profile identifier, e.g. B2B-HKEX-OCG-01")
    company_name: str = Field(..., description="B2B Company / Partner Name, e.g. HKEX, Bloomberg, HSBC")
    connection_type: str = Field(..., description="Connection Type: VPN or Metro")
    
    # VPN specific
    vpn_peer_ip: Optional[str] = Field(None, description="VPN Peer IP (remote gateway IP)")
    
    # Metro specific
    metro_circuit_id: Optional[str] = Field(None, description="Metro Circuit ID from Telco (e.g. HKT-ETH-892110)")
    metro_vlan_id: Optional[int] = Field(None, description="Metro VlanID for IT Dept use only (e.g. 420)")
    metro_registration_owner: Optional[str] = Field(None, description="Registration Owner: PSHK or B2B Company")
    
    # Contract expiration
    contract_expiry_date: Optional[date] = Field(None, description="Contract Expiry Date provided by B2B Team")
    
    # Operational fields
    bandwidth: Optional[str] = Field(None, description="Bandwidth, e.g. 100 Mbps, 1 Gbps, 10 Gbps")
    status: Optional[str] = Field("Active", description="Status: Active, Expiring Soon, Expired, Suspended, Provisioning")
    service_type: Optional[str] = Field(None, description="Service Type, e.g. FIX Protocol, Market Data Feed, Order Routing, Custody")
    contact_person: Optional[str] = Field(None, description="Partner or B2B team PIC name")
    contact_email: Optional[str] = Field(None, description="Partner contact email")
    notes: Optional[str] = Field(None, description="IT Dept remarks, routing information, or BGP ASN")

class B2BConnectionCreate(B2BConnectionBase):
    pass

class B2BConnectionUpdate(BaseModel):
    profile_name: Optional[str] = None
    company_name: Optional[str] = None
    connection_type: Optional[str] = None
    vpn_peer_ip: Optional[str] = None
    metro_circuit_id: Optional[str] = None
    metro_vlan_id: Optional[int] = None
    metro_registration_owner: Optional[str] = None
    contract_expiry_date: Optional[date] = None
    bandwidth: Optional[str] = None
    status: Optional[str] = None
    service_type: Optional[str] = None
    contact_person: Optional[str] = None
    contact_email: Optional[str] = None
    notes: Optional[str] = None

class B2BConnectionOut(B2BConnectionBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class B2BConnectionListResponse(BaseModel):
    items: List[B2BConnectionOut]
    total: int
    page: int
    page_size: int
    stats: Optional[Dict[str, Any]] = None

