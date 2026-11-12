from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class KPICard(BaseModel):
    title: str
    value: int
    subtitle: str
    trend: Optional[str] = None
    icon: str
    color: str

class DistributionSlice(BaseModel):
    name: str
    value: int
    percentage: float
    color: str

class AttentionItem(BaseModel):
    id: str
    title: str
    count: int
    badge_color: str
    icon: str
    link: str

class TimelinePoint(BaseModel):
    month: str
    contracts: int
    warranties: int

class DashboardStats(BaseModel):
    total_assets: int
    company_owned: int
    company_owned_pct: float
    rental_leased: int
    rental_leased_pct: float
    active_contracts: int
    contracts_expiring_soon: int
    total_vendors: int
    total_locations: int
    devices_deployed: int
    devices_in_maintenance: int
    contracts_expiring_90d: int
    warranties_expiring_90d: int
    warranties_expiring_soon: Optional[int] = 0
    devices_under_maintenance: Optional[int] = 0
    last_updated: str
    asset_distribution: List[DistributionSlice]
    device_distribution: Optional[List[DistributionSlice]] = None
    attention_required: List[AttentionItem]
    contract_timeline: List[TimelinePoint]

