from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime, date

class ContractBase(BaseModel):
    contract_number: str
    contract_name: str
    contract_type: str
    vendor_id: Optional[int] = None
    contract_owner: Optional[str] = "IT Infrastructure Team"
    start_date: date
    end_date: date
    contract_value: Optional[float] = 0.0
    currency: Optional[str] = "HKD"
    payment_terms: Optional[str] = "Annual Advance / Net 30"
    sla: Optional[str] = "24x7x4hr On-site Response"
    support_level: Optional[str] = "Enterprise Support"
    renewal_terms: Optional[str] = None
    status: Optional[str] = "Active"
    document_url: Optional[str] = None
    notes: Optional[str] = None

class ContractCreate(ContractBase):
    asset_ids: Optional[List[int]] = []

class ContractUpdate(BaseModel):
    contract_number: Optional[str] = None
    contract_name: Optional[str] = None
    contract_type: Optional[str] = None
    vendor_id: Optional[int] = None
    contract_owner: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    contract_value: Optional[float] = None
    currency: Optional[str] = None
    payment_terms: Optional[str] = None
    sla: Optional[str] = None
    support_level: Optional[str] = None
    renewal_terms: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    asset_ids: Optional[List[int]] = None

class ContractOut(ContractBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    vendor_name: Optional[str] = None
    covered_asset_count: Optional[int] = 0
    days_to_expiration: Optional[int] = None

    class Config:
        from_attributes = True

class ContractDetailOut(ContractOut):
    covered_assets: List[Dict[str, Any]] = []
