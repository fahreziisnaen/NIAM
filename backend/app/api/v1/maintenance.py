from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
import datetime

from app.db.session import get_db
from app.models.maintenance import MaintenanceRecord
from app.models.asset import Asset
from app.models.vendor import Vendor
from app.models.user import User, AuditLog
from app.schemas.maintenance import MaintenanceCreate, MaintenanceUpdate, MaintenanceOut
from app.schemas.common import PaginatedResponse
from app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/maintenance", tags=["Maintenance Management"])

@router.get("", response_model=PaginatedResponse[MaintenanceOut])
def list_maintenance_records(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    maintenance_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    asset_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(MaintenanceRecord)

    if status:
        query = query.filter(MaintenanceRecord.status == status)

    if maintenance_type:
        query = query.filter(MaintenanceRecord.maintenance_type == maintenance_type)

    if asset_id:
        query = query.filter(MaintenanceRecord.asset_id == asset_id)

    if search:
        s = f"%{search.strip()}%"
        query = query.join(Asset, MaintenanceRecord.asset_id == Asset.id).filter(
            or_(
                MaintenanceRecord.ticket_number.ilike(s),
                MaintenanceRecord.description.ilike(s),
                MaintenanceRecord.technician.ilike(s),
                Asset.hostname.ilike(s),
                Asset.asset_id.ilike(s)
            )
        )

    total = query.count()
    records = query.order_by(MaintenanceRecord.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    items = []
    for r in records:
        a = r.asset
        v = r.vendor
        items.append(MaintenanceOut(
            id=r.id,
            ticket_number=r.ticket_number,
            asset_id=r.asset_id,
            maintenance_type=r.maintenance_type,
            reported_date=r.reported_date,
            scheduled_date=r.scheduled_date,
            completion_date=r.completion_date,
            technician=r.technician,
            vendor_id=r.vendor_id,
            description=r.description,
            root_cause=r.root_cause,
            resolution=r.resolution,
            cost=float(r.cost or 0),
            status=r.status,
            created_at=r.created_at,
            hostname=a.hostname if a else "Unknown",
            model_name=a.model.model_name if a and a.model else "Device",
            vendor_name=v.name if v else "Internal"
        ))

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PaginatedResponse[MaintenanceOut](
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.post("", response_model=MaintenanceOut)
def create_maintenance_record(
    mnt_in: MaintenanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "NETWORK_ADMIN", "ASSET_MANAGER"]))
):
    asset = db.query(Asset).filter(Asset.id == mnt_in.asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    rec = MaintenanceRecord(**mnt_in.dict())
    db.add(rec)
    
    # If emergency or corrective, update asset operational status
    if mnt_in.status in ["In Progress", "Scheduled"]:
        asset.operational_status = "In Maintenance"
        asset.asset_condition = "Maintenance Required"

    audit = AuditLog(
        user_id=current_user.id if current_user else None,
        user_email=current_user.email if current_user else "admin@phillip.com.hk",
        action="CREATE",
        entity_type="MAINTENANCE",
        entity_id=rec.ticket_number,
        details=f"Created maintenance ticket {rec.ticket_number} for {asset.hostname}",
        ip_address="127.0.0.1"
    )
    db.add(audit)
    db.commit()
    db.refresh(rec)

    return MaintenanceOut(
        id=rec.id,
        ticket_number=rec.ticket_number,
        asset_id=rec.asset_id,
        maintenance_type=rec.maintenance_type,
        reported_date=rec.reported_date,
        scheduled_date=rec.scheduled_date,
        completion_date=rec.completion_date,
        technician=rec.technician,
        vendor_id=rec.vendor_id,
        description=rec.description,
        root_cause=rec.root_cause,
        resolution=rec.resolution,
        cost=float(rec.cost or 0),
        status=rec.status,
        created_at=rec.created_at,
        hostname=asset.hostname,
        model_name=asset.model.model_name if asset.model else "Device",
        vendor_name=asset.vendor.name if asset.vendor else "Internal"
    )

@router.put("/{id}", response_model=MaintenanceOut)
def update_maintenance_record(
    id: int,
    mnt_in: MaintenanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "NETWORK_ADMIN", "ASSET_MANAGER"]))
):
    rec = db.query(MaintenanceRecord).filter(MaintenanceRecord.id == id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Maintenance ticket not found")

    update_data = mnt_in.dict(exclude_unset=True)
    for field, val in update_data.items():
        setattr(rec, field, val)

    # If marked completed, return asset to Deployed
    if mnt_in.status == "Completed":
        rec.completion_date = datetime.datetime.utcnow()
        if rec.asset:
            rec.asset.operational_status = "Deployed"
            rec.asset.asset_condition = "Operational"

    db.commit()
    db.refresh(rec)

    asset = rec.asset
    return MaintenanceOut(
        id=rec.id,
        ticket_number=rec.ticket_number,
        asset_id=rec.asset_id,
        maintenance_type=rec.maintenance_type,
        reported_date=rec.reported_date,
        scheduled_date=rec.scheduled_date,
        completion_date=rec.completion_date,
        technician=rec.technician,
        vendor_id=rec.vendor_id,
        description=rec.description,
        root_cause=rec.root_cause,
        resolution=rec.resolution,
        cost=float(rec.cost or 0),
        status=rec.status,
        created_at=rec.created_at,
        hostname=asset.hostname if asset else "Unknown",
        model_name=asset.model.model_name if asset and asset.model else "Device",
        vendor_name=rec.vendor.name if rec.vendor else "Internal"
    )

