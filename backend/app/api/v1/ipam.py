from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
import datetime
import ipaddress

from app.db.session import get_db
from app.models.network import VLAN, IPAddress
from app.models.asset import Asset
from app.schemas.network import (
    VLANCreate,
    VLANUpdate,
    VLANOut,
    IPAddressCreate,
    IPAddressUpdate,
    IPAddressOut,
    AssignIPRequest,
    BulkIPImportRequest,
)

router = APIRouter(prefix="/ipam", tags=["IP Address Management"])

@router.get("/vlans", response_model=List[VLANOut])
def list_vlans(
    search: Optional[str] = Query(None),
    location_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(VLAN)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                VLAN.name.ilike(s),
                VLAN.subnet.ilike(s),
                VLAN.gateway.ilike(s),
                VLAN.description.ilike(s)
            )
        )
    if location_id:
        query = query.filter(VLAN.location_id == location_id)

    vlans = query.order_by(VLAN.vlan_id.asc()).all()

    # Optimized single-query count aggregation for high-scale VLAN fleets (100+ VLANs)
    counts = dict(
        db.query(IPAddress.vlan_id, func.count(IPAddress.id))
        .filter(IPAddress.vlan_id.isnot(None))
        .group_by(IPAddress.vlan_id)
        .all()
    )

    results = []
    for v in vlans:
        cnt = counts.get(v.id, 0)
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

@router.get("/vlans/{id}", response_model=VLANOut)
def get_vlan(id: int, db: Session = Depends(get_db)):
    v = db.query(VLAN).filter(VLAN.id == id).first()
    if not v:
        raise HTTPException(status_code=404, detail="VLAN not found")
    cnt = db.query(IPAddress).filter(IPAddress.vlan_id == v.id).count()
    return VLANOut(
        id=v.id,
        vlan_id=v.vlan_id,
        name=v.name,
        subnet=v.subnet,
        gateway=v.gateway,
        location_id=v.location_id,
        description=v.description,
        created_at=v.created_at,
        ip_count=cnt
    )

@router.post("/vlans", response_model=VLANOut)
def create_vlan(vlan_in: VLANCreate, db: Session = Depends(get_db)):
    existing = db.query(VLAN).filter(VLAN.vlan_id == vlan_in.vlan_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"VLAN ID {vlan_in.vlan_id} already exists")
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

@router.put("/vlans/{id}", response_model=VLANOut)
def update_vlan(id: int, vlan_in: VLANUpdate, db: Session = Depends(get_db)):
    v = db.query(VLAN).filter(VLAN.id == id).first()
    if not v:
        raise HTTPException(status_code=404, detail="VLAN not found")

    update_data = vlan_in.dict(exclude_unset=True)
    if "vlan_id" in update_data and update_data["vlan_id"] != v.vlan_id:
        existing = db.query(VLAN).filter(VLAN.vlan_id == update_data["vlan_id"]).first()
        if existing and existing.id != id:
            raise HTTPException(status_code=400, detail=f"VLAN ID {update_data['vlan_id']} already exists")

    for field, val in update_data.items():
        setattr(v, field, val)

    db.commit()
    db.refresh(v)

    cnt = db.query(IPAddress).filter(IPAddress.vlan_id == v.id).count()
    return VLANOut(
        id=v.id,
        vlan_id=v.vlan_id,
        name=v.name,
        subnet=v.subnet,
        gateway=v.gateway,
        location_id=v.location_id,
        description=v.description,
        created_at=v.created_at,
        ip_count=cnt
    )

@router.delete("/vlans/{id}")
def delete_vlan(id: int, db: Session = Depends(get_db)):
    v = db.query(VLAN).filter(VLAN.id == id).first()
    if not v:
        raise HTTPException(status_code=404, detail="VLAN not found")

    # Unlink IP addresses assigned to this VLAN
    db.query(IPAddress).filter(IPAddress.vlan_id == id).update({"vlan_id": None})
    db.delete(v)
    db.commit()
    return {"success": True, "message": f"VLAN {v.vlan_id} deleted successfully"}

@router.get("/addresses", response_model=List[IPAddressOut])
def list_ip_addresses(
    subnet: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    vlan_id: Optional[int] = Query(None),
    device_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(500, ge=1, le=2000),
    db: Session = Depends(get_db)
):
    query = db.query(IPAddress)
    if subnet:
        query = query.filter(IPAddress.subnet == subnet)
    if status:
        query = query.filter(IPAddress.status == status)
    if vlan_id is not None:
        query = query.filter(IPAddress.vlan_id == vlan_id)
    if device_type:
        query = query.filter(IPAddress.device_type == device_type)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                IPAddress.ip_address.ilike(s),
                IPAddress.hostname.ilike(s),
                IPAddress.mac_address.ilike(s),
                IPAddress.description.ilike(s),
                IPAddress.interface_name.ilike(s),
                IPAddress.device_type.ilike(s)
            )
        )
    records = query.order_by(IPAddress.id.asc()).limit(limit).all()
    results = []
    for r in records:
        out = IPAddressOut.from_orm(r)
        if r.asset:
            out.asset_hostname = r.asset.hostname
            out.asset_model = r.asset.model.model_name if r.asset.model else ""
            out.asset_tag = r.asset.asset_id
        results.append(out)
    return results

@router.post("/addresses", response_model=IPAddressOut)
def create_ip_address(ip_in: IPAddressCreate, db: Session = Depends(get_db)):
    existing = db.query(IPAddress).filter(IPAddress.ip_address == ip_in.ip_address.strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"IP address {ip_in.ip_address} already exists")

    new_ip = IPAddress(**ip_in.dict())
    if new_ip.asset_id:
        asset = db.query(Asset).filter(Asset.id == new_ip.asset_id).first()
        if asset:
            if not new_ip.hostname:
                new_ip.hostname = asset.hostname
            if not new_ip.mac_address:
                new_ip.mac_address = asset.mac_address
            if not new_ip.device_type:
                new_ip.device_type = "Network Hardware"
            new_ip.status = "Assigned"
            new_ip.assigned_date = datetime.datetime.utcnow()
            if not asset.management_ip:
                asset.management_ip = new_ip.ip_address
    else:
        # Non-asset device / VM / endpoint
        if new_ip.hostname and new_ip.status == "Available":
            new_ip.status = "Assigned"
            new_ip.assigned_date = datetime.datetime.utcnow()

    db.add(new_ip)
    db.commit()
    db.refresh(new_ip)
    out = IPAddressOut.from_orm(new_ip)
    if new_ip.asset:
        out.asset_hostname = new_ip.asset.hostname
        out.asset_model = new_ip.asset.model.model_name if new_ip.asset.model else ""
        out.asset_tag = new_ip.asset.asset_id
    return out

@router.put("/addresses/{id}", response_model=IPAddressOut)
def update_ip_address(id: int, ip_in: IPAddressUpdate, db: Session = Depends(get_db)):
    ip_rec = db.query(IPAddress).filter(IPAddress.id == id).first()
    if not ip_rec:
        raise HTTPException(status_code=404, detail="IP address record not found")

    update_data = ip_in.dict(exclude_unset=True)
    if "ip_address" in update_data and update_data["ip_address"] != ip_rec.ip_address:
        dup = db.query(IPAddress).filter(IPAddress.ip_address == update_data["ip_address"]).first()
        if dup and dup.id != id:
            raise HTTPException(status_code=400, detail=f"IP address {update_data['ip_address']} already exists")

    # If assigning or unlinking asset
    if "asset_id" in update_data:
        target_asset_id = update_data["asset_id"]
        if target_asset_id:
            asset = db.query(Asset).filter(Asset.id == target_asset_id).first()
            if asset:
                if not update_data.get("hostname"):
                    update_data["hostname"] = asset.hostname
                if not update_data.get("mac_address"):
                    update_data["mac_address"] = asset.mac_address
                if not update_data.get("device_type"):
                    update_data["device_type"] = "Network Hardware"
                update_data["status"] = "Assigned"
                update_data["assigned_date"] = datetime.datetime.utcnow()
                if not asset.management_ip:
                    asset.management_ip = ip_rec.ip_address
        else:
            # Explicitly set asset_id to None (unlink asset without dropping IP)
            update_data["asset_id"] = None

    for field, val in update_data.items():
        setattr(ip_rec, field, val)

    db.commit()
    db.refresh(ip_rec)
    out = IPAddressOut.from_orm(ip_rec)
    if ip_rec.asset:
        out.asset_hostname = ip_rec.asset.hostname
        out.asset_model = ip_rec.asset.model.model_name if ip_rec.asset.model else ""
        out.asset_tag = ip_rec.asset.asset_id
    return out

@router.delete("/addresses/{id}")
def delete_ip_address(id: int, db: Session = Depends(get_db)):
    ip_rec = db.query(IPAddress).filter(IPAddress.id == id).first()
    if not ip_rec:
        raise HTTPException(status_code=404, detail="IP address record not found")
    db.delete(ip_rec)
    db.commit()
    return {"success": True, "message": "IP address deleted successfully"}

@router.post("/addresses/batch")
def generate_ip_batch(
    subnet: str,
    vlan_id: Optional[int] = None,
    start_host: int = 1,
    end_host: int = 50,
    db: Session = Depends(get_db)
):
    """Generate a sequential block of available IP addresses for a subnet"""
    try:
        net = ipaddress.ip_network(subnet, strict=False)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid subnet CIDR format: {str(e)}")

    hosts = list(net.hosts())
    if start_host < 1 or end_host > len(hosts) or start_host > end_host:
        raise HTTPException(status_code=400, detail=f"Host range must be between 1 and {len(hosts)}")

    created_count = 0
    for idx in range(start_host - 1, end_host):
        ip_str = str(hosts[idx])
        existing = db.query(IPAddress).filter(IPAddress.ip_address == ip_str).first()
        if not existing:
            new_rec = IPAddress(
                ip_address=ip_str,
                ip_version="IPv4" if net.version == 4 else "IPv6",
                subnet=subnet,
                vlan_id=vlan_id,
                status="Available",
                description="Auto-generated IP Pool"
            )
            db.add(new_rec)
            created_count += 1

    db.commit()
    return {"success": True, "created": created_count, "message": f"Successfully initialized {created_count} IP addresses for {subnet}"}

@router.post("/assign")
def assign_ip_address(
    req: Optional[AssignIPRequest] = None,
    ip_address: Optional[str] = Query(None),
    asset_id: Optional[int] = Query(None),
    hostname: Optional[str] = Query(None),
    device_type: Optional[str] = Query(None),
    mac_address: Optional[str] = Query(None),
    interface_name: Optional[str] = Query(None),
    description: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    target_ip = (req.ip_address if req else ip_address) or ""
    if not target_ip:
        raise HTTPException(status_code=400, detail="IP address parameter is required")

    target_asset_id = req.asset_id if req else asset_id
    target_hostname = (req.hostname if req else hostname) or ""
    target_dev_type = (req.device_type if req else device_type) or "Server VM"
    target_mac = (req.mac_address if req else mac_address) or None
    target_iface = (req.interface_name if req else interface_name) or None
    target_desc = (req.description if req else description) or None

    asset = None
    if target_asset_id:
        asset = db.query(Asset).filter(Asset.id == target_asset_id).first()
        if not asset:
            raise HTTPException(status_code=404, detail="Selected Asset not found")
        if not target_hostname:
            target_hostname = asset.hostname
        if not target_mac:
            target_mac = asset.mac_address
        target_dev_type = "Network Hardware"

    if not target_hostname:
        raise HTTPException(
            status_code=400,
            detail="Hostname / Device Name is required when not linked to a Hardware Asset."
        )

    existing = db.query(IPAddress).filter(IPAddress.ip_address == target_ip).first()
    if not existing:
        existing = IPAddress(
            ip_address=target_ip,
            ip_version="IPv4",
            subnet=asset.subnet if asset and asset.subnet else "Auto",
            status="Assigned",
            asset_id=asset.id if asset else None,
            device_type=target_dev_type,
            hostname=target_hostname,
            mac_address=target_mac,
            interface_name=target_iface,
            description=target_desc or (f"Assigned to {target_hostname}"),
            assigned_date=datetime.datetime.utcnow()
        )
        db.add(existing)
    else:
        existing.status = "Assigned"
        existing.asset_id = asset.id if asset else None
        existing.device_type = target_dev_type
        existing.hostname = target_hostname
        if target_mac is not None:
            existing.mac_address = target_mac
        if target_iface is not None:
            existing.interface_name = target_iface
        if target_desc is not None:
            existing.description = target_desc
        existing.assigned_date = datetime.datetime.utcnow()

    if asset and not asset.management_ip:
        asset.management_ip = target_ip

    db.commit()
    target_label = f"Asset {asset.hostname}" if asset else f"{target_dev_type} ({target_hostname})"
    return {
        "success": True,
        "message": f"IP {target_ip} successfully assigned to {target_label}",
        "ip_address": target_ip,
        "hostname": target_hostname,
        "device_type": target_dev_type,
        "asset_id": asset.id if asset else None
    }

@router.post("/addresses/bulk-import")
def bulk_import_ip_addresses(req: BulkIPImportRequest, db: Session = Depends(get_db)):
    """
    Import multiple IP allocations directly from Excel/CSV data.
    Allows registering IP usage for VMs, Endpoints, Printers, etc. without pointing to assets.
    """
    if not req.items:
        raise HTTPException(status_code=400, detail="No IP items provided for import")

    created_count = 0
    updated_count = 0

    for it in req.items:
        clean_ip = it.ip_address.strip()
        if not clean_ip:
            continue

        existing = db.query(IPAddress).filter(IPAddress.ip_address == clean_ip).first()
        if existing:
            # Update existing
            if it.subnet:
                existing.subnet = it.subnet
            if it.vlan_id is not None:
                existing.vlan_id = it.vlan_id
            if it.hostname:
                existing.hostname = it.hostname
            if it.device_type:
                existing.device_type = it.device_type
            if it.mac_address:
                existing.mac_address = it.mac_address
            if it.interface_name:
                existing.interface_name = it.interface_name
            if it.description:
                existing.description = it.description
            existing.status = it.status or ("Assigned" if it.hostname else "Available")
            if existing.status == "Assigned" and not existing.assigned_date:
                existing.assigned_date = datetime.datetime.utcnow()
            updated_count += 1
        else:
            # Create new
            new_ip = IPAddress(
                ip_address=clean_ip,
                ip_version="IPv4",
                subnet=it.subnet or "Imported",
                vlan_id=it.vlan_id,
                status=it.status or ("Assigned" if it.hostname else "Available"),
                device_type=it.device_type or "Server VM",
                hostname=it.hostname,
                mac_address=it.mac_address,
                interface_name=it.interface_name,
                description=it.description or "Imported from Excel/CSV",
                assigned_date=datetime.datetime.utcnow() if it.hostname else None
            )
            db.add(new_ip)
            created_count += 1

    db.commit()
    total = created_count + updated_count
    return {
        "success": True,
        "created": created_count,
        "updated": updated_count,
        "total": total,
        "message": f"Successfully imported {total} IP records ({created_count} created, {updated_count} updated)."
    }

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

@router.get("/assets")
def list_assets_for_ip_assignment(db: Session = Depends(get_db)):
    """List assets with their current IP and MAC to easily pick in IPAM assign modal"""
    assets = db.query(Asset).filter(Asset.is_deleted == False).order_by(Asset.hostname).all()
    return [{
        "id": a.id,
        "asset_id": a.asset_id,
        "hostname": a.hostname,
        "mac_address": a.mac_address or "N/A",
        "management_ip": a.management_ip or "N/A",
        "category": a.category.name if a.category else "Hardware",
        "model": a.model.model_name if a.model else "",
        "status": a.operational_status or "Operational"
    } for a in assets]
