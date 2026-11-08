from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.session import get_db
from app.models.inventory import SparePart, SpareStockTransaction
from app.models.vendor import Vendor
from app.models.user import User, AuditLog
from app.schemas.inventory import SparePartCreate, SparePartUpdate, SparePartOut, SpareStockTransactionCreate, SpareStockTransactionOut
from app.schemas.common import PaginatedResponse
from app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/spares", tags=["Spare Parts & Inventory"])

@router.get("", response_model=PaginatedResponse[SparePartOut])
def list_spare_parts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(SparePart)
    if category:
        query = query.filter(SparePart.category == category)
    if status:
        query = query.filter(SparePart.status == status)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                SparePart.part_number.ilike(s),
                SparePart.name.ilike(s),
                SparePart.stock_location.ilike(s)
            )
        )

    total = query.count()
    items = query.order_by(SparePart.quantity.asc()).offset((page - 1) * page_size).limit(page_size).all()

    out_items = []
    for sp in items:
        v_name = sp.vendor.name if sp.vendor else ""
        out_items.append(SparePartOut(
            id=sp.id,
            part_number=sp.part_number,
            name=sp.name,
            category=sp.category,
            vendor_id=sp.vendor_id,
            quantity=sp.quantity,
            min_stock_level=sp.min_stock_level,
            unit_cost=float(sp.unit_cost or 0),
            currency=sp.currency,
            stock_location=sp.stock_location,
            status=sp.status,
            compatibility=sp.compatibility,
            notes=sp.notes,
            created_at=sp.created_at,
            updated_at=sp.updated_at,
            vendor_name=v_name
        ))

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PaginatedResponse[SparePartOut](
        items=out_items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.post("", response_model=SparePartOut)
def create_spare_part(
    sp_in: SparePartCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "NETWORK_ADMIN", "ASSET_MANAGER"]))
):
    existing = db.query(SparePart).filter(SparePart.part_number == sp_in.part_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Spare part number already exists")

    sp = SparePart(**sp_in.dict())
    if sp.quantity <= sp.min_stock_level:
        sp.status = "Low Stock" if sp.quantity > 0 else "Out of Stock"
    else:
        sp.status = "In Stock"

    db.add(sp)
    db.commit()
    db.refresh(sp)

    return SparePartOut(
        id=sp.id,
        part_number=sp.part_number,
        name=sp.name,
        category=sp.category,
        vendor_id=sp.vendor_id,
        quantity=sp.quantity,
        min_stock_level=sp.min_stock_level,
        unit_cost=float(sp.unit_cost or 0),
        currency=sp.currency,
        stock_location=sp.stock_location,
        status=sp.status,
        compatibility=sp.compatibility,
        notes=sp.notes,
        created_at=sp.created_at,
        updated_at=sp.updated_at,
        vendor_name=sp.vendor.name if sp.vendor else ""
    )

@router.post("/{id}/transact", response_model=SparePartOut)
def record_spare_transaction(
    id: int,
    tx_in: SpareStockTransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "NETWORK_ADMIN", "ASSET_MANAGER"]))
):
    sp = db.query(SparePart).filter(SparePart.id == id).first()
    if not sp:
        raise HTTPException(status_code=404, detail="Spare part not found")

    if tx_in.transaction_type == "Check-out":
        if sp.quantity < tx_in.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock. Available: {sp.quantity}")
        sp.quantity -= tx_in.quantity
    elif tx_in.transaction_type == "Check-in":
        sp.quantity += tx_in.quantity
    elif tx_in.transaction_type == "Adjustment":
        sp.quantity = tx_in.quantity

    # Update status
    if sp.quantity == 0:
        sp.status = "Out of Stock"
    elif sp.quantity <= sp.min_stock_level:
        sp.status = "Low Stock"
    else:
        sp.status = "In Stock"

    tx = SpareStockTransaction(
        spare_part_id=sp.id,
        transaction_type=tx_in.transaction_type,
        quantity=tx_in.quantity,
        destination_asset_id=tx_in.destination_asset_id,
        technician=tx_in.technician,
        reference_ticket=tx_in.reference_ticket,
        notes=tx_in.notes
    )
    db.add(tx)
    db.commit()
    db.refresh(sp)

    return SparePartOut(
        id=sp.id,
        part_number=sp.part_number,
        name=sp.name,
        category=sp.category,
        vendor_id=sp.vendor_id,
        quantity=sp.quantity,
        min_stock_level=sp.min_stock_level,
        unit_cost=float(sp.unit_cost or 0),
        currency=sp.currency,
        stock_location=sp.stock_location,
        status=sp.status,
        compatibility=sp.compatibility,
        notes=sp.notes,
        created_at=sp.created_at,
        updated_at=sp.updated_at,
        vendor_name=sp.vendor.name if sp.vendor else ""
    )

@router.get("/{id}/transactions", response_model=List[SpareStockTransactionOut])
def get_part_transactions(id: int, db: Session = Depends(get_db)):
    txs = db.query(SpareStockTransaction).filter(SpareStockTransaction.spare_part_id == id).order_by(SpareStockTransaction.created_at.desc()).all()
    return txs

