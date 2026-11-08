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
from app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/contracts", tags=["Contract & Rental Management"])

@router.get("", response_model=PaginatedResponse[ContractOut])
def list_contracts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
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

    today = date.today()
    items = []
    for c in contracts:
        v_name = c.vendor.name if c.vendor else "Direct"
        days_left = (c.end_date - today).days
        covered_count = len(c.asset_associations)
        items.append(ContractOut(
            id=c.id,
            contract_number=c.contract_number,
            contract_name=c.contract_name,
            contract_type=c.contract_type,
            vendor_id=c.vendor_id,
            contract_owner=c.contract_owner,
            start_date=c.start_date,
            end_date=c.end_date,
            contract_value=float(c.contract_value or 0),
            currency=c.currency,
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
        ))

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PaginatedResponse[ContractOut](
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

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
                "asset_id": a.asset_id,
                "hostname": a.hostname,
                "model": a.model.model_name if a.model else "Device",
                "vendor": a.vendor.name if a.vendor else a.manufacturer,
                "serial_number": a.serial_number,
                "location": a.location_display or "Central HQ",
                "status": a.operational_status,
                "ownership": a.ownership_type
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
        currency=contract.currency,
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
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "CONTRACT_MANAGER"]))
):
    existing = db.query(Contract).filter(Contract.contract_number == contract_in.contract_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Contract number already exists")

    contract = Contract(
        contract_number=contract_in.contract_number,
        contract_name=contract_in.contract_name,
        contract_type=contract_in.contract_type,
        vendor_id=contract_in.vendor_id,
        contract_owner=contract_in.contract_owner,
        start_date=contract_in.start_date,
        end_date=contract_in.end_date,
        contract_value=contract_in.contract_value,
        currency=contract_in.currency,
        payment_terms=contract_in.payment_terms,
        sla=contract_in.sla,
        support_level=contract_in.support_level,
        renewal_terms=contract_in.renewal_terms,
        status=contract_in.status,
        document_url=contract_in.document_url,
        notes=contract_in.notes
    )
    db.add(contract)
    db.flush()

    if contract_in.asset_ids:
        for a_id in contract_in.asset_ids:
            db.add(AssetContract(asset_id=a_id, contract_id=contract.id))

    audit = AuditLog(
        user_id=current_user.id if current_user else None,
        user_email=current_user.email if current_user else "admin@phillip.com.hk",
        action="CREATE",
        entity_type="CONTRACT",
        entity_id=contract.contract_number,
        details=f"Created contract {contract.contract_number}",
        ip_address="127.0.0.1"
    )
    db.add(audit)
    db.commit()
    db.refresh(contract)

    return ContractOut(
        id=contract.id,
        contract_number=contract.contract_number,
        contract_name=contract.contract_name,
        contract_type=contract.contract_type,
        vendor_id=contract.vendor_id,
        contract_owner=contract.contract_owner,
        start_date=contract.start_date,
        end_date=contract.end_date,
        contract_value=float(contract.contract_value or 0),
        currency=contract.currency,
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
        covered_asset_count=len(contract_in.asset_ids or []),
        days_to_expiration=(contract.end_date - date.today()).days
    )

