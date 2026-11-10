from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.session import get_db
from app.models.vendor import Vendor
from app.models.asset import Asset
from app.models.contract import Contract
from app.models.user import User, AuditLog
from app.schemas.vendor import VendorCreate, VendorUpdate, VendorOut
from app.schemas.common import PaginatedResponse
from app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/vendors", tags=["Vendor Management"])

@router.get("", response_model=PaginatedResponse[VendorOut])
def list_vendors(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Vendor)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Vendor.name.ilike(s),
                Vendor.vendor_code.ilike(s),
                Vendor.manufacturer.ilike(s),
                Vendor.primary_contact.ilike(s)
            )
        )

    if category:
        query = query.filter(Vendor.category == category)

    if status:
        query = query.filter(Vendor.status == status)

    total = query.count()
    vendors = query.order_by(Vendor.id.asc()).offset((page - 1) * page_size).limit(page_size).all()

    items = []
    for v in vendors:
        asset_count = len(v.assets)
        contract_count = len(v.contracts)
        items.append(VendorOut(
            id=v.id,
            vendor_code=v.vendor_code,
            name=v.name,
            category=v.category,
            manufacturer=v.manufacturer,
            primary_contact=v.primary_contact,
            email=v.email,
            phone=v.phone,
            address=v.address,
            country=v.country,
            support_contact=v.support_contact,
            support_email=v.support_email,
            support_hotline=v.support_hotline,
            website=v.website,
            status=v.status,
            notes=v.notes,
            created_at=v.created_at,
            updated_at=v.updated_at,
            asset_count=asset_count,
            contract_count=contract_count
        ))

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PaginatedResponse[VendorOut](
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/{vendor_id}")
def get_vendor_detail(vendor_id: int, db: Session = Depends(get_db)):
    v = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vendor not found")

    assets = [
        {
            "id": a.id,
            "asset_id": a.asset_id,
            "hostname": a.hostname,
            "model": a.model.model_name if a.model else "",
            "category": a.category.name if a.category else "",
            "status": a.operational_status,
            "ip_address": a.primary_ip or "-",
            "serial_number": a.serial_number or "-"
        }
        for a in v.assets
    ]
    contracts = [
        {
            "id": c.id,
            "contract_number": c.contract_number,
            "contract_name": c.contract_name,
            "contract_type": c.contract_type,
            "start_date": str(c.start_date) if c.start_date else "-",
            "end_date": str(c.end_date) if c.end_date else "-",
            "status": c.status,
            "contract_value": float(c.contract_value or 0),
            "currency": c.currency or "HKD"
        }
        for c in v.contracts
    ]

    return {
        "vendor": VendorOut.from_orm(v),
        "assets": assets,
        "contracts": contracts,
        "total_assets": len(v.assets),
        "total_contracts": len(v.contracts)
    }

@router.post("", response_model=VendorOut)
def create_vendor(
    vendor_in: VendorCreate,
    db: Session = Depends(get_db)
):
    existing = db.query(Vendor).filter(Vendor.vendor_code == vendor_in.vendor_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Vendor code already exists")

    vendor = Vendor(**vendor_in.dict())
    db.add(vendor)
    db.commit()
    db.refresh(vendor)

    return VendorOut(
        id=vendor.id,
        vendor_code=vendor.vendor_code,
        name=vendor.name,
        category=vendor.category,
        manufacturer=vendor.manufacturer,
        primary_contact=vendor.primary_contact,
        email=vendor.email,
        phone=vendor.phone,
        address=vendor.address,
        country=vendor.country,
        support_contact=vendor.support_contact,
        support_email=vendor.support_email,
        support_hotline=vendor.support_hotline,
        website=vendor.website,
        status=vendor.status,
        notes=vendor.notes,
        created_at=vendor.created_at,
        updated_at=vendor.updated_at,
        asset_count=0,
        contract_count=0
    )

@router.put("/{vendor_id}", response_model=VendorOut)
def update_vendor(
    vendor_id: int,
    vendor_in: VendorUpdate,
    db: Session = Depends(get_db)
):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    for field, val in vendor_in.dict(exclude_unset=True).items():
        setattr(vendor, field, val)

    from datetime import datetime
    vendor.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(vendor)

    return VendorOut(
        id=vendor.id,
        vendor_code=vendor.vendor_code,
        name=vendor.name,
        category=vendor.category,
        manufacturer=vendor.manufacturer,
        primary_contact=vendor.primary_contact,
        email=vendor.email,
        phone=vendor.phone,
        address=vendor.address,
        country=vendor.country,
        support_contact=vendor.support_contact,
        support_email=vendor.support_email,
        support_hotline=vendor.support_hotline,
        website=vendor.website,
        status=vendor.status,
        notes=vendor.notes,
        created_at=vendor.created_at,
        updated_at=vendor.updated_at,
        asset_count=len(vendor.assets),
        contract_count=len(vendor.contracts)
    )

@router.delete("/{vendor_id}")
def delete_vendor(vendor_id: int, db: Session = Depends(get_db)):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    if vendor.assets:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete vendor '{vendor.name}' because {len(vendor.assets)} assets are associated with it. Please reassign the assets first."
        )
    if vendor.contracts:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete vendor '{vendor.name}' because {len(vendor.contracts)} contracts are associated with it. Please reassign the contracts first."
        )

    v_name = vendor.name
    db.delete(vendor)
    db.commit()
    return {"success": True, "message": f"Vendor '{v_name}' deleted successfully."}

