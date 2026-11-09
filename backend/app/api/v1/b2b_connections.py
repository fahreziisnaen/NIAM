import csv
import io
from datetime import date, timedelta, datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc

from app.db.session import get_db
from app.models.b2b_connection import B2BConnection
from app.schemas.b2b_connection import (
    B2BConnectionCreate,
    B2BConnectionUpdate,
    B2BConnectionOut,
    B2BConnectionListResponse
)

router = APIRouter(prefix="/b2b-connections", tags=["B2B Connection Profiles"])

def calculate_status(conn: B2BConnection) -> str:
    """Helper to dynamically calculate expiry status if contract_expiry_date is set."""
    if not conn.contract_expiry_date:
        return conn.status or "Active"
    
    today = date.today()
    if conn.contract_expiry_date < today:
        return "Expired"
    elif conn.contract_expiry_date <= today + timedelta(days=60):
        return "Expiring Soon"
    return conn.status or "Active"

@router.get("", response_model=Dict[str, Any])
def list_b2b_connections(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    search: Optional[str] = Query(None),
    connection_type: Optional[str] = Query(None),
    registration_owner: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("id"),
    sort_order: Optional[str] = Query("asc"),
    db: Session = Depends(get_db)
):
    query = db.query(B2BConnection)

    # Search filter
    if search and search.strip():
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                B2BConnection.profile_name.ilike(s),
                B2BConnection.company_name.ilike(s),
                B2BConnection.vpn_peer_ip.ilike(s),
                B2BConnection.metro_circuit_id.ilike(s),
                B2BConnection.service_type.ilike(s),
                B2BConnection.notes.ilike(s),
            )
        )

    # Type filter (VPN / Metro)
    if connection_type and connection_type.strip() and connection_type.upper() != "ALL":
        query = query.filter(B2BConnection.connection_type == connection_type.strip())

    # Registration Owner filter (PSHK / B2B Company)
    if registration_owner and registration_owner.strip() and registration_owner.upper() != "ALL":
        query = query.filter(B2BConnection.metro_registration_owner == registration_owner.strip())

    # Status filter
    if status_filter and status_filter.strip() and status_filter.upper() != "ALL":
        today = date.today()
        if status_filter == "Expired":
            query = query.filter(B2BConnection.contract_expiry_date < today)
        elif status_filter == "Expiring Soon":
            query = query.filter(
                B2BConnection.contract_expiry_date >= today,
                B2BConnection.contract_expiry_date <= today + timedelta(days=60)
            )
        elif status_filter == "Active":
            query = query.filter(
                or_(
                    B2BConnection.contract_expiry_date.is_(None),
                    B2BConnection.contract_expiry_date > today + timedelta(days=60)
                )
            )
        else:
            query = query.filter(B2BConnection.status == status_filter.strip())

    # Sorting
    sort_column = getattr(B2BConnection, sort_by, B2BConnection.id)
    if sort_order.lower() == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(asc(sort_column))

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    # Calculate overall stats for header cards
    all_connections = db.query(B2BConnection).all()
    today = date.today()
    
    total_all = len(all_connections)
    total_metro = sum(1 for c in all_connections if (c.connection_type or "").upper() == "METRO")
    total_vpn = sum(1 for c in all_connections if (c.connection_type or "").upper() == "VPN")
    pshk_owner_count = sum(1 for c in all_connections if c.metro_registration_owner == "PSHK")
    b2b_owner_count = sum(1 for c in all_connections if c.metro_registration_owner == "B2B Company")
    
    expiring_soon_count = sum(
        1 for c in all_connections 
        if c.contract_expiry_date and today <= c.contract_expiry_date <= today + timedelta(days=60)
    )
    expired_count = sum(
        1 for c in all_connections 
        if c.contract_expiry_date and c.contract_expiry_date < today
    )

    # Format items output
    items_out = []
    for item in items:
        computed_status = calculate_status(item)
        items_out.append({
            "id": item.id,
            "profile_name": item.profile_name,
            "company_name": item.company_name,
            "connection_type": item.connection_type,
            "vpn_peer_ip": item.vpn_peer_ip,
            "metro_circuit_id": item.metro_circuit_id,
            "metro_vlan_id": item.metro_vlan_id,
            "metro_registration_owner": item.metro_registration_owner,
            "contract_expiry_date": item.contract_expiry_date.isoformat() if item.contract_expiry_date else None,
            "bandwidth": item.bandwidth,
            "status": computed_status,
            "service_type": item.service_type,
            "contact_person": item.contact_person,
            "contact_email": item.contact_email,
            "notes": item.notes,
            "created_at": item.created_at.isoformat() if item.created_at else None,
            "updated_at": item.updated_at.isoformat() if item.updated_at else None,
        })

    return {
        "items": items_out,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size if total > 0 else 1,
        "stats": {
            "total_connections": total_all,
            "total_metro": total_metro,
            "total_vpn": total_vpn,
            "pshk_owner_count": pshk_owner_count,
            "b2b_owner_count": b2b_owner_count,
            "expiring_soon_count": expiring_soon_count,
            "expired_count": expired_count,
        }
    }

@router.get("/export/csv")
def export_b2b_connections_csv(db: Session = Depends(get_db)):
    connections = db.query(B2BConnection).order_by(B2BConnection.id.asc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID",
        "B2B Connection Profile",
        "B2B Company Name",
        "Connection Type",
        "VPN Peer IP",
        "Metro Circuit ID",
        "Metro VlanID (IT Dept)",
        "Metro Registration Owner",
        "Contract Expiry Date",
        "Bandwidth",
        "Status",
        "Service Type",
        "Contact Person",
        "Contact Email",
        "Notes"
    ])

    for c in connections:
        computed_status = calculate_status(c)
        writer.writerow([
            c.id,
            c.profile_name,
            c.company_name,
            c.connection_type,
            c.vpn_peer_ip or "-",
            c.metro_circuit_id or "-",
            c.metro_vlan_id or "-",
            c.metro_registration_owner or "-",
            c.contract_expiry_date.isoformat() if c.contract_expiry_date else "-",
            c.bandwidth or "-",
            computed_status,
            c.service_type or "-",
            c.contact_person or "-",
            c.contact_email or "-",
            c.notes or "-"
        ])

    output.seek(0)
    response = StreamingResponse(iter([output.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=b2b_connection_profiles.csv"
    return response

@router.get("/{connection_id}", response_model=Dict[str, Any])
def get_b2b_connection(connection_id: int, db: Session = Depends(get_db)):
    conn = db.query(B2BConnection).filter(B2BConnection.id == connection_id).first()
    if not conn:
        raise HTTPException(status_code=404, detail="B2B Connection Profile not found")
    
    return {
        "id": conn.id,
        "profile_name": conn.profile_name,
        "company_name": conn.company_name,
        "connection_type": conn.connection_type,
        "vpn_peer_ip": conn.vpn_peer_ip,
        "metro_circuit_id": conn.metro_circuit_id,
        "metro_vlan_id": conn.metro_vlan_id,
        "metro_registration_owner": conn.metro_registration_owner,
        "contract_expiry_date": conn.contract_expiry_date.isoformat() if conn.contract_expiry_date else None,
        "bandwidth": conn.bandwidth,
        "status": calculate_status(conn),
        "service_type": conn.service_type,
        "contact_person": conn.contact_person,
        "contact_email": conn.contact_email,
        "notes": conn.notes,
        "created_at": conn.created_at.isoformat() if conn.created_at else None,
        "updated_at": conn.updated_at.isoformat() if conn.updated_at else None,
    }

@router.post("", status_code=status.HTTP_201_CREATED, response_model=Dict[str, Any])
def create_b2b_connection(data: B2BConnectionCreate, db: Session = Depends(get_db)):
    # Check duplicate profile name
    existing = db.query(B2BConnection).filter(B2BConnection.profile_name.ilike(data.profile_name.strip())).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"B2B Connection Profile '{data.profile_name}' already exists."
        )

    # Sanitize based on connection type
    conn_type = data.connection_type.strip().capitalize()
    if conn_type not in ["Vpn", "Metro"]:
        conn_type = "VPN" if "vpn" in conn_type.lower() else "Metro"
    
    vpn_peer_ip = data.vpn_peer_ip.strip() if (data.vpn_peer_ip and conn_type == "VPN") else None
    metro_circuit_id = data.metro_circuit_id.strip() if (data.metro_circuit_id and conn_type == "Metro") else None
    metro_vlan_id = data.metro_vlan_id if conn_type == "Metro" else None
    metro_registration_owner = data.metro_registration_owner if conn_type == "Metro" else None

    new_conn = B2BConnection(
        profile_name=data.profile_name.strip(),
        company_name=data.company_name.strip(),
        connection_type=conn_type.upper() if conn_type.upper() == "VPN" else "Metro",
        vpn_peer_ip=vpn_peer_ip,
        metro_circuit_id=metro_circuit_id,
        metro_vlan_id=metro_vlan_id,
        metro_registration_owner=metro_registration_owner,
        contract_expiry_date=data.contract_expiry_date,
        bandwidth=data.bandwidth.strip() if data.bandwidth else None,
        status=data.status or "Active",
        service_type=data.service_type.strip() if data.service_type else None,
        contact_person=data.contact_person.strip() if data.contact_person else None,
        contact_email=data.contact_email.strip() if data.contact_email else None,
        notes=data.notes.strip() if data.notes else None,
    )

    db.add(new_conn)
    db.commit()
    db.refresh(new_conn)

    return {
        "id": new_conn.id,
        "message": f"B2B Connection Profile '{new_conn.profile_name}' created successfully.",
        "profile_name": new_conn.profile_name
    }

@router.put("/{connection_id}", response_model=Dict[str, Any])
def update_b2b_connection(connection_id: int, data: B2BConnectionUpdate, db: Session = Depends(get_db)):
    conn = db.query(B2BConnection).filter(B2BConnection.id == connection_id).first()
    if not conn:
        raise HTTPException(status_code=404, detail="B2B Connection Profile not found")

    if data.profile_name and data.profile_name.strip() != conn.profile_name:
        existing = db.query(B2BConnection).filter(
            B2BConnection.profile_name.ilike(data.profile_name.strip()),
            B2BConnection.id != connection_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"B2B Connection Profile '{data.profile_name}' is already used by another record."
            )
        conn.profile_name = data.profile_name.strip()

    if data.company_name is not None:
        conn.company_name = data.company_name.strip()

    if data.connection_type is not None:
        c_type = data.connection_type.strip()
        conn.connection_type = "VPN" if c_type.upper() == "VPN" else "Metro"

    if data.vpn_peer_ip is not None:
        conn.vpn_peer_ip = data.vpn_peer_ip.strip() if data.vpn_peer_ip else None

    if data.metro_circuit_id is not None:
        conn.metro_circuit_id = data.metro_circuit_id.strip() if data.metro_circuit_id else None

    if data.metro_vlan_id is not None:
        conn.metro_vlan_id = data.metro_vlan_id

    if data.metro_registration_owner is not None:
        conn.metro_registration_owner = data.metro_registration_owner

    if data.contract_expiry_date is not None:
        conn.contract_expiry_date = data.contract_expiry_date

    if data.bandwidth is not None:
        conn.bandwidth = data.bandwidth.strip() if data.bandwidth else None

    if data.status is not None:
        conn.status = data.status

    if data.service_type is not None:
        conn.service_type = data.service_type.strip() if data.service_type else None

    if data.contact_person is not None:
        conn.contact_person = data.contact_person.strip() if data.contact_person else None

    if data.contact_email is not None:
        conn.contact_email = data.contact_email.strip() if data.contact_email else None

    if data.notes is not None:
        conn.notes = data.notes.strip() if data.notes else None

    conn.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(conn)

    return {
        "id": conn.id,
        "message": f"B2B Connection Profile '{conn.profile_name}' updated successfully.",
        "profile_name": conn.profile_name
    }

@router.delete("/{connection_id}", response_model=Dict[str, Any])
def delete_b2b_connection(connection_id: int, db: Session = Depends(get_db)):
    conn = db.query(B2BConnection).filter(B2BConnection.id == connection_id).first()
    if not conn:
        raise HTTPException(status_code=404, detail="B2B Connection Profile not found")

    p_name = conn.profile_name
    db.delete(conn)
    db.commit()

    return {
        "id": connection_id,
        "message": f"B2B Connection Profile '{p_name}' deleted successfully."
    }

