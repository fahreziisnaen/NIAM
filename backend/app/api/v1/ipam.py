from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
import datetime

from app.db.session import get_db
from app.models.network import VLAN, IPAddress
from app.models.asset import Asset
from app.schemas.network import VLANCreate, VLANOut, IPAddressCreate, IPAddressOut

router = APIRouter(prefix="/ipam", tags=["IP Address Management"])

@router.get("/vlans", response_model=List[VLANOut])
def list_vlans(db: Session = Depends(get_db)):
    vlans = db.query(VLAN).all()
    results = []
    for v in vlans:
        cnt = db.query(IPAddress).filter(IPAddress.vlan_id == v.id).count()
        results.append(VLANOut(
            id=v.id,
            vlan_id=v.vlan_id,
            name=v.name,
            subnet=v.subnet,
            gateway=v.gateway,
            location_id=v.location_id,
            description=v.description,
            created_at=v.created_at,
            ip_count=cnt
        ))
    return results

@router.post("/vlans", response_model=VLANOut)
def create_vlan(vlan_in: VLANCreate, db: Session = Depends(get_db)):
    existing = db.query(VLAN).filter(VLAN.vlan_id == vlan_in.vlan_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="VLAN ID already exists")
    v = VLAN(**vlan_in.dict())
    db.add(v)
    db.commit()
    db.refresh(v)
    return VLANOut(
        id=v.id,
        vlan_id=v.vlan_id,
        name=v.name,
        subnet=v.subnet,
        gateway=v.gateway,
        location_id=v.location_id,
        description=v.description,
        created_at=v.created_at,
        ip_count=0
    )

@router.get("/addresses", response_model=List[IPAddressOut])
def list_ip_addresses(
    subnet: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(IPAddress)
    if subnet:
        query = query.filter(IPAddress.subnet == subnet)
    if status:
        query = query.filter(IPAddress.status == status)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                IPAddress.ip_address.ilike(s),
                IPAddress.hostname.ilike(s),
                IPAddress.mac_address.ilike(s),
                IPAddress.description.ilike(s)
            )
        )
    return query.limit(limit).all()

@router.post("/assign")
def assign_ip_address(
    ip_address: str,
    asset_id: int,
    interface_name: Optional[str] = "GigabitEthernet1/0/1",
    db: Session = Depends(get_db)
):
    # Duplicate check
    existing = db.query(IPAddress).filter(IPAddress.ip_address == ip_address).first()
    if existing and existing.status == "Assigned" and existing.asset_id != asset_id:
        raise HTTPException(status_code=400, detail=f"IP {ip_address} is already assigned to asset #{existing.asset_id} ({existing.hostname})")

    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    if not existing:
        existing = IPAddress(
            ip_address=ip_address,
            ip_version="IPv4",
            subnet="10.200.100.0/24",
            status="Assigned",
            asset_id=asset.id,
            hostname=asset.hostname,
            mac_address=asset.mac_address,
            interface_name=interface_name,
            description=f"Assigned to {asset.hostname}",
            assigned_date=datetime.datetime.utcnow()
        )
        db.add(existing)
    else:
        existing.status = "Assigned"
        existing.asset_id = asset.id
        existing.hostname = asset.hostname
        existing.mac_address = asset.mac_address
        existing.interface_name = interface_name
        existing.assigned_date = datetime.datetime.utcnow()

    # Update asset management IP if empty
    if not asset.management_ip:
        asset.management_ip = ip_address

    db.commit()
    return {"success": True, "message": f"IP {ip_address} successfully assigned to {asset.hostname}"}

@router.post("/release")
def release_ip_address(ip_address: str, db: Session = Depends(get_db)):
    ip_rec = db.query(IPAddress).filter(IPAddress.ip_address == ip_address).first()
    if not ip_rec:
        raise HTTPException(status_code=404, detail="IP address record not found")
    ip_rec.status = "Available"
    ip_rec.asset_id = None
    ip_rec.hostname = None
    ip_rec.mac_address = None
    ip_rec.interface_name = None
    db.commit()
    return {"success": True, "message": f"IP {ip_address} is now released and Available"}

