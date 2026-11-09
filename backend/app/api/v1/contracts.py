from datetime import date, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.session import get_db
from app.models.contract import Contract, AssetContract
from app.models.asset import Asset
from app.models.vendor import Vendor
from app.models.user import User, AuditLog
from app.schemas.contract import ContractCreate, ContractUpdate, ContractOut, ContractDetailOut
from app.schemas.common import PaginatedResponse

router = APIRouter(prefix="/contracts", tags=["Contract & Rental Management"])

def format_contract_out(c: Contract, db: Session) -> ContractOut:
    v_name = c.vendor.name if c.vendor else "Direct"
    days_left = (c.end_date - date.today()).days
    covered_count = db.query(AssetContract).filter(AssetContract.contract_id == c.id).count()
    return ContractOut(
        id=c.id,
        contract_number=c.contract_number,
        contract_name=c.contract_name,
        contract_type=c.contract_type,
        vendor_id=c.vendor_id,
        contract_owner=c.contract_owner,
        start_date=c.start_date,
        end_date=c.end_date,
        contract_value=float(c.contract_value or 0),
        currency=c.currency or "HKD",
        payment_terms=c.payment_terms,
        sla=c.sla,
        support_level=c.support_level,
        renewal_terms=c.renewal_terms,
        status=c.status,
        document_url=c.document_url,
        notes=c.notes,
        created_at=c.created_at,
        updated_at=c.updated_at,
        vendor_name=v_name,
        covered_asset_count=covered_count,
        days_to_expiration=days_left
    )

@router.get("", response_model=PaginatedResponse[ContractOut])
def list_contracts(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None),
    contract_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    expiring_days: Optional[int] = Query(None),
    vendor_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Contract)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Contract.contract_number.ilike(s),
                Contract.contract_name.ilike(s),
                Contract.contract_type.ilike(s)
            )
        )

    if contract_type:
        query = query.filter(Contract.contract_type == contract_type)

    if status:
        query = query.filter(Contract.status == status)

    if vendor_id:
        query = query.filter(Contract.vendor_id == vendor_id)

    if expiring_days:
        target_date = date.today() + timedelta(days=expiring_days)
        query = query.filter(Contract.end_date <= target_date, Contract.end_date >= date.today())

    total = query.count()
    contracts = query.order_by(Contract.end_date.asc()).offset((page - 1) * page_size).limit(page_size).all()

    items = [format_contract_out(c, db) for c in contracts]
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PaginatedResponse[ContractOut](
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/assets/available")
def list_available_assets_for_contract(
    search: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(Asset).filter(Asset.is_deleted == False)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Asset.asset_id.ilike(s),
                Asset.hostname.ilike(s),
                Asset.serial_number.ilike(s),
                Asset.manufacturer.ilike(s)
            )
        )
    assets = query.limit(limit).all()
    return [{
        "id": a.id,
        "asset_id": a.asset_id,
        "hostname": a.hostname,
        "model": a.model.model_name if a.model else "Device",
        "vendor": a.vendor.name if a.vendor else a.manufacturer,
        "manufacturer": a.manufacturer,
        "serial_number": a.serial_number,
        "location": a.location_display or "Central HQ",
        "status": a.operational_status,
        "ownership": a.ownership_type
    } for a in assets]

@router.get("/{contract_id}", response_model=ContractDetailOut)
def get_contract_detail(contract_id: int, db: Session = Depends(get_db)):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    covered_assets = []
    for assoc in contract.asset_associations:
        a = assoc.asset
        if not a.is_deleted:
            covered_assets.append({
                "id": a.id,
                "asset_id": a.asset_id,
                "hostname": a.hostname,
                "model": a.model.model_name if a.model else "Device",
                "vendor": a.vendor.name if a.vendor else a.manufacturer,
                "manufacturer": a.manufacturer,
                "serial_number": a.serial_number,
                "location": a.location_display or "Central HQ",
                "status": a.operational_status,
                "ownership": a.ownership_type,
                "coverage_notes": assoc.coverage_notes or "Active Coverage"
            })

    days_left = (contract.end_date - date.today()).days
    return ContractDetailOut(
        id=contract.id,
        contract_number=contract.contract_number,
        contract_name=contract.contract_name,
        contract_type=contract.contract_type,
        vendor_id=contract.vendor_id,
        contract_owner=contract.contract_owner,
        start_date=contract.start_date,
        end_date=contract.end_date,
        contract_value=float(contract.contract_value or 0),
        currency=contract.currency or "HKD",
        payment_terms=contract.payment_terms,
        sla=contract.sla,
        support_level=contract.support_level,
        renewal_terms=contract.renewal_terms,
        status=contract.status,
        document_url=contract.document_url,
        notes=contract.notes,
        created_at=contract.created_at,
        updated_at=contract.updated_at,
        vendor_name=contract.vendor.name if contract.vendor else "Direct",
        covered_asset_count=len(covered_assets),
        days_to_expiration=days_left,
        covered_assets=covered_assets
    )

@router.post("", response_model=ContractOut)
def create_contract(
    contract_in: ContractCreate,
    db: Session = Depends(get_db)
):
    existing = db.query(Contract).filter(Contract.contract_number == contract_in.contract_number.strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Contract number '{contract_in.contract_number}' already exists")

    contract = Contract(
        contract_number=contract_in.contract_number.strip(),
        contract_name=contract_in.contract_name.strip(),
        contract_type=contract_in.contract_type.strip(),
        vendor_id=contract_in.vendor_id,
        contract_owner=contract_in.contract_owner or "IT Infrastructure Team",
        start_date=contract_in.start_date,
        end_date=contract_in.end_date,
        contract_value=contract_in.contract_value or 0.0,
        currency=contract_in.currency or "HKD",
        payment_terms=contract_in.payment_terms or "Annual Advance / Net 30",
        sla=contract_in.sla or "24x7x4hr On-site Response",
        support_level=contract_in.support_level or "Enterprise Support",
        renewal_terms=contract_in.renewal_terms,
        status=contract_in.status or "Active",
        document_url=contract_in.document_url,
        notes=contract_in.notes
    )
    db.add(contract)
    db.flush()

    if contract_in.asset_ids:
        for a_id in contract_in.asset_ids:
            db.add(AssetContract(asset_id=a_id, contract_id=contract.id, coverage_notes="Primary Hardware & SLA Coverage"))

    db.commit()
    db.refresh(contract)
    return format_contract_out(contract, db)

@router.put("/{contract_id}", response_model=ContractOut)
def update_contract(
    contract_id: int,
    contract_in: ContractUpdate,
    db: Session = Depends(get_db)
):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    update_data = contract_in.dict(exclude_unset=True)

    if "contract_number" in update_data and update_data["contract_number"] != contract.contract_number:
        dup = db.query(Contract).filter(Contract.contract_number == update_data["contract_number"], Contract.id != contract_id).first()
        if dup:
            raise HTTPException(status_code=400, detail=f"Contract number '{update_data['contract_number']}' already in use")

    asset_ids = update_data.pop("asset_ids", None)

    for field, val in update_data.items():
        if val is not None:
            setattr(contract, field, val)

    if asset_ids is not None:
        db.query(AssetContract).filter(AssetContract.contract_id == contract.id).delete()
        for a_id in asset_ids:
            db.add(AssetContract(asset_id=a_id, contract_id=contract.id, coverage_notes="Updated SLA Coverage"))

    db.commit()
    db.refresh(contract)
    return format_contract_out(contract, db)

@router.delete("/{contract_id}")
def delete_contract(contract_id: int, db: Session = Depends(get_db)):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    c_num = contract.contract_number
    # Cascaded delete removes asset_contracts
    db.delete(contract)
    db.commit()
    return {"success": True, "message": f"Contract '{c_num}' deleted successfully"}

@router.post("/{contract_id}/assets/{asset_id}")
def add_asset_to_contract(
    contract_id: int,
    asset_id: int,
    coverage_notes: Optional[str] = "Hardware & SLA Coverage",
    db: Session = Depends(get_db)
):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    existing = db.query(AssetContract).filter(
        AssetContract.contract_id == contract_id,
        AssetContract.asset_id == asset_id
    ).first()
    if existing:
        return {"success": True, "message": f"Asset {asset.hostname} is already covered under contract {contract.contract_number}"}

    db.add(AssetContract(asset_id=asset_id, contract_id=contract_id, coverage_notes=coverage_notes))
    db.commit()
    return {"success": True, "message": f"Asset {asset.hostname} added to contract {contract.contract_number}"}

@router.delete("/{contract_id}/assets/{asset_id}")
def remove_asset_from_contract(
    contract_id: int,
    asset_id: int,
    db: Session = Depends(get_db)
):
    assoc = db.query(AssetContract).filter(
        AssetContract.contract_id == contract_id,
        AssetContract.asset_id == asset_id
    ).first()
    if not assoc:
        raise HTTPException(status_code=404, detail="Asset is not linked to this contract")

    db.delete(assoc)
    db.commit()
    return {"success": True, "message": "Asset removed from contract coverage"}
