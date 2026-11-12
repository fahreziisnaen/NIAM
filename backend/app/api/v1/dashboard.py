from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from datetime import date, timedelta, datetime
import calendar
from app.db.session import get_db
from app.models.asset import Asset, DeviceCategory
from app.models.contract import Contract, Warranty
from app.models.vendor import Vendor
from app.models.location import Location
from app.schemas.dashboard import DashboardStats, DistributionSlice, AttentionItem, TimelinePoint

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_statistics(
    site_id: Optional[int] = Query(None),
    vendor_id: Optional[int] = Query(None),
    category_id: Optional[int] = Query(None),
    ownership: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Asset).filter(Asset.is_deleted == False)

    if site_id:
        query = query.filter(Asset.location_id == site_id)
    if vendor_id:
        query = query.filter(Asset.vendor_id == vendor_id)
    if category_id:
        query = query.filter(Asset.category_id == category_id)
    if ownership:
        query = query.filter(Asset.ownership_type == ownership)

    total_assets = query.count()
    company_owned = query.filter(Asset.ownership_type.ilike("%Company%")).count()
    rental_leased = query.filter(Asset.ownership_type.in_(["Rental", "Leased"])).count()
    
    company_pct = round((company_owned / total_assets) * 100, 1) if total_assets > 0 else 0.0
    rental_pct = round((rental_leased / total_assets) * 100, 1) if total_assets > 0 else 0.0

    # Contracts
    active_contracts = db.query(Contract).filter(Contract.status.in_(["Active", "Expiring Soon"])).count()
    today = date.today()
    in_90_days = today + timedelta(days=90)
    
    contracts_expiring_soon = db.query(Contract).filter(
        Contract.end_date <= in_90_days,
        Contract.end_date >= today
    ).count()

    # Warranties
    warranties_expiring_90d = db.query(Warranty).filter(
        Warranty.status == "Expiring Soon"
    ).count()

    # Deployed vs Maintenance
    deployed_count = query.filter(Asset.operational_status == "Deployed").count()
    maintenance_count = query.filter(Asset.operational_status == "In Maintenance").count()

    total_vendors = db.query(Vendor).count()
    total_locations = db.query(Location).count()

    # Asset category distribution
    cat_counts = (
        db.query(DeviceCategory.name, func.count(Asset.id))
        .join(Asset, Asset.category_id == DeviceCategory.id)
        .filter(Asset.is_deleted == False)
        .group_by(DeviceCategory.name)
        .all()
    )

    color_map = {
        "Switch": "#2563EB",     # Blue
        "Router": "#10B981",     # Green
        "Firewall": "#F59E0B",   # Orange
        "Wireless": "#8B5CF6",   # Purple
        "Others": "#64748B"      # Gray
    }

    distribution_list: List[DistributionSlice] = []
    for c_name, c_cnt in cat_counts:
        pct = round((c_cnt / total_assets) * 100) if total_assets > 0 else 0
        distribution_list.append(DistributionSlice(
            name=f"{c_name}es" if c_name == "Switch" else f"{c_name}s",
            value=c_cnt,
            percentage=pct,
            color=color_map.get(c_name, "#3B82F6")
        ))

    # Sort distribution to match screenshot: Switches (42%), Routers (22%), Firewalls (15%), Wireless (13%), Others (8%)
    order_pref = ["Switches", "Routers", "Firewalls", "Wirelesss", "Others"]
    distribution_list.sort(key=lambda x: order_pref.index(x.name) if x.name in order_pref else 99)

    # Attention items
    attention_list = [
        AttentionItem(
            id="contracts-expiring",
            title="Contracts expiring within 90 days",
            count=contracts_expiring_soon,
            badge_color="#EF4444",
            icon="Clock",
            link="/contracts"
        ),
        AttentionItem(
            id="warranties-expiring",
            title="Warranties expiring within 90 days",
            count=warranties_expiring_90d,
            badge_color="#F59E0B",
            icon="ShieldAlert",
            link="/assets"
        ),
        AttentionItem(
            id="devices-maintenance",
            title="Devices under maintenance",
            count=maintenance_count,
            badge_color="#2563EB",
            icon="Wrench",
            link="/maintenance"
        )
    ]

    # Dynamic contract & warranty timeline for current + next 4 months
    timeline: List[TimelinePoint] = []
    for i in range(5):
        y = today.year + (today.month + i - 1) // 12
        m = (today.month + i - 1) % 12 + 1
        m_name = calendar.month_abbr[m]
        f_day = date(y, m, 1)
        l_day = date(y, m, calendar.monthrange(y, m)[1])

        c_cnt = db.query(Contract).filter(
            Contract.end_date >= f_day,
            Contract.end_date <= l_day
        ).count()

        w_cnt = db.query(Warranty).filter(
            Warranty.end_date >= f_day,
            Warranty.end_date <= l_day
        ).count()

        timeline.append(TimelinePoint(
            month=m_name,
            contracts=c_cnt,
            warranties=w_cnt
        ))

    return DashboardStats(
        total_assets=total_assets,
        company_owned=company_owned,
        company_owned_pct=company_pct,
        rental_leased=rental_leased,
        rental_leased_pct=rental_pct,
        active_contracts=active_contracts,
        contracts_expiring_soon=contracts_expiring_soon,
        total_vendors=total_vendors,
        total_locations=total_locations,
        devices_deployed=deployed_count,
        devices_in_maintenance=maintenance_count,
        contracts_expiring_90d=contracts_expiring_soon,
        warranties_expiring_90d=warranties_expiring_90d,
        warranties_expiring_soon=warranties_expiring_90d,
        devices_under_maintenance=maintenance_count,
        last_updated=datetime.now().strftime("%d %b %Y, %H:%M"),
        asset_distribution=distribution_list,
        device_distribution=distribution_list,
        attention_required=attention_list,
        contract_timeline=timeline
    )

