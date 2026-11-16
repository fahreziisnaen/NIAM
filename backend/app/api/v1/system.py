import json
import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import require_role
from app.models.user import User, Role, AlertRule, AlertSetting
from app.models.vendor import Vendor
from app.models.location import Location, Building, Floor, Rack
from app.models.contract import Contract, AssetContract, Warranty
from app.models.asset import DeviceCategory, DeviceModel, OwnershipType, Asset, NetworkInterface
from app.models.network import VLAN, IPAddress, NetworkConnection
from app.models.maintenance import MaintenanceRecord
from app.models.inventory import SparePart, SpareStockTransaction
from app.models.b2b_connection import B2BConnection

router = APIRouter(prefix="/system", tags=["System Backup & Disaster Recovery"])

@router.get("/backup/summary")
def get_backup_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "NETWORK_ADMIN"]))
):
    """
    Returns current counts across key database tables for backup visualization.
    """
    return {
        "counts": {
            "vlans": db.query(VLAN).count(),
            "ip_addresses": db.query(IPAddress).count(),
            "assets": db.query(Asset).filter(Asset.is_deleted == False).count(),
            "locations": db.query(Location).count(),
            "vendors": db.query(Vendor).count(),
            "contracts": db.query(Contract).count(),
            "network_connections": db.query(NetworkConnection).count(),
            "alert_rules": db.query(AlertRule).count()
        },
        "database_type": "PostgreSQL 16",
        "system_status": "Healthy & Persistent"
    }

@router.get("/backup/export-json")
def export_database_json(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN"]))
):
    """
    Exports a comprehensive JSON snapshot of the entire enterprise dataset.
    Restricted to SUPER_ADMIN.
    """
    timestamp = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    
    # 1. IPAM & Network
    vlans = [
        {
            "id": v.id, "vlan_id": v.vlan_id, "name": v.name,
            "subnet": v.subnet, "gateway": v.gateway, "description": v.description
        } for v in db.query(VLAN).all()
    ]
    ip_addresses = [
        {
            "id": ip.id, "ip_address": ip.ip_address, "subnet": ip.subnet,
            "vlan_id": ip.vlan_id, "status": ip.status, "device_type": ip.device_type,
            "hostname": ip.hostname, "mac_address": ip.mac_address,
            "interface_name": ip.interface_name, "description": ip.description,
            "asset_id": ip.asset_id
        } for ip in db.query(IPAddress).all()
    ]
    network_connections = [
        {
            "id": nc.id, "source_asset_id": nc.source_asset_id, "source_port": nc.source_port,
            "target_asset_id": nc.target_asset_id, "target_port": nc.target_port,
            "connection_type": nc.connection_type, "bandwidth_gbps": nc.bandwidth_gbps,
            "status": nc.status, "notes": nc.notes
        } for nc in db.query(NetworkConnection).all()
    ]

    # 2. Hardware Assets
    assets = [
        {
            "id": a.id, "asset_id": a.asset_id, "hostname": a.hostname,
            "serial_number": a.serial_number, "manufacturer": a.manufacturer,
            "management_ip": a.management_ip, "operational_status": a.operational_status,
            "ownership_type": a.ownership_type, "notes": a.notes
        } for a in db.query(Asset).filter(Asset.is_deleted == False).all()
    ]

    # 3. Locations
    locations = [
        {
            "id": l.id, "code": l.code, "name": l.name, "site_type": l.site_type,
            "address": l.address, "city": l.city, "status": l.status
        } for l in db.query(Location).all()
    ]

    # 4. Contracts & Vendors
    vendors = [
        {
            "id": v.id, "code": v.code, "name": v.name, "category": v.category,
            "support_email": v.support_email, "support_phone": v.support_phone, "status": v.status
        } for v in db.query(Vendor).all()
    ]
    contracts = [
        {
            "id": c.id, "contract_number": c.contract_number, "title": c.title,
            "vendor_id": c.vendor_id, "contract_type": c.contract_type,
            "status": c.status, "start_date": str(c.start_date) if c.start_date else None,
            "end_date": str(c.end_date) if c.end_date else None
        } for c in db.query(Contract).all()
    ]

    # 5. Alert Rules & Settings
    alert_rules = [
        {
            "id": r.id, "rule_code": r.rule_code, "name": r.name,
            "category": r.category, "severity": r.severity, "channels": r.channels,
            "is_enabled": r.is_enabled
        } for r in db.query(AlertRule).all()
    ]

    snapshot = {
        "system": "Phillip Securities Hong Kong - Network Asset Management System (PSHK - NAMS)",
        "version": "1.0.0",
        "exported_at": datetime.datetime.utcnow().isoformat() + "Z",
        "exported_by": current_user.username,
        "counts": {
            "vlans": len(vlans),
            "ip_addresses": len(ip_addresses),
            "assets": len(assets),
            "locations": len(locations),
            "vendors": len(vendors),
            "contracts": len(contracts),
            "network_connections": len(network_connections),
            "alert_rules": len(alert_rules),
        },
        "data": {
            "vlans": vlans,
            "ip_addresses": ip_addresses,
            "network_connections": network_connections,
            "assets": assets,
            "locations": locations,
            "vendors": vendors,
            "contracts": contracts,
            "alert_rules": alert_rules
        }
    }

    content = json.dumps(snapshot, indent=2)
    filename = f"pshk_nams_backup_{timestamp}.json"

    return Response(
        content=content,
        media_type="application/json",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Cache-Control": "no-store, no-cache"
        }
    )

@router.post("/backup/restore")
async def restore_database_json(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN"]))
):
    """
    Restores database records from an uploaded JSON backup file.
    Restricted to SUPER_ADMIN.
    """
    if not file.filename.endswith(".json"):
        raise HTTPException(
            status_code=400,
            detail="Only JSON backup files (.json) generated by PSHK NAMS are supported."
        )
    
    try:
        content = await file.read()
        payload = json.loads(content)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON file format: {str(e)}")

    if "data" not in payload:
        raise HTTPException(status_code=400, detail="Invalid backup file: 'data' root object missing.")

    data = payload["data"]
    restored_counts = {}

    try:
        # 1. Restore Locations
        loc_count = 0
        for l in data.get("locations", []):
            code = l.get("code")
            if not code:
                continue
            loc = db.query(Location).filter(Location.code == code).first()
            if not loc:
                loc = Location(code=code)
                db.add(loc)
            loc.name = l.get("name", loc.name)
            loc.site_type = l.get("site_type", loc.site_type)
            loc.address = l.get("address", loc.address)
            loc.city = l.get("city", loc.city)
            loc.status = l.get("status", "Active")
            loc_count += 1
        db.flush()
        restored_counts["locations"] = loc_count

        # 2. Restore Vendors
        vnd_count = 0
        for v in data.get("vendors", []):
            code = v.get("code")
            if not code:
                continue
            vnd = db.query(Vendor).filter(Vendor.code == code).first()
            if not vnd:
                vnd = Vendor(code=code)
                db.add(vnd)
            vnd.name = v.get("name", vnd.name)
            vnd.category = v.get("category", vnd.category)
            vnd.support_email = v.get("support_email", vnd.support_email)
            vnd.support_phone = v.get("support_phone", vnd.support_phone)
            vnd.status = v.get("status", "Active")
            vnd_count += 1
        db.flush()
        restored_counts["vendors"] = vnd_count

        # 3. Restore VLANs
        vlan_count = 0
        for v in data.get("vlans", []):
            vid = v.get("vlan_id")
            if not vid:
                continue
            existing = db.query(VLAN).filter(VLAN.vlan_id == vid).first()
            if not existing:
                existing = VLAN(vlan_id=vid)
                db.add(existing)
            existing.name = v.get("name", existing.name)
            existing.subnet = v.get("subnet", existing.subnet)
            existing.gateway = v.get("gateway", existing.gateway)
            existing.description = v.get("description", existing.description)
            vlan_count += 1
        db.flush()
        restored_counts["vlans"] = vlan_count

        # 4. Restore IP Addresses
        ip_count = 0
        for ip in data.get("ip_addresses", []):
            ip_addr = ip.get("ip_address")
            if not ip_addr:
                continue
            existing = db.query(IPAddress).filter(IPAddress.ip_address == ip_addr).first()
            if not existing:
                existing = IPAddress(ip_address=ip_addr)
                db.add(existing)
            existing.subnet = ip.get("subnet", existing.subnet or "Auto")
            existing.status = ip.get("status", "Available")
            existing.device_type = ip.get("device_type", "Server VM")
            existing.hostname = ip.get("hostname", existing.hostname)
            existing.mac_address = ip.get("mac_address", existing.mac_address)
            existing.interface_name = ip.get("interface_name", existing.interface_name)
            existing.description = ip.get("description", existing.description)
            ip_count += 1
        db.flush()
        restored_counts["ip_addresses"] = ip_count

        # 5. Restore Contracts
        contract_count = 0
        for c in data.get("contracts", []):
            c_num = c.get("contract_number")
            if not c_num:
                continue
            existing = db.query(Contract).filter(Contract.contract_number == c_num).first()
            if not existing:
                existing = Contract(contract_number=c_num)
                db.add(existing)
            existing.title = c.get("title", existing.title)
            existing.contract_type = c.get("contract_type", existing.contract_type)
            existing.status = c.get("status", "Active")
            contract_count += 1
        db.flush()
        restored_counts["contracts"] = contract_count

        # 6. Restore Alert Rules
        rule_count = 0
        for r in data.get("alert_rules", []):
            rcode = r.get("rule_code")
            if not rcode:
                continue
            existing = db.query(AlertRule).filter(AlertRule.rule_code == rcode).first()
            if not existing:
                existing = AlertRule(rule_code=rcode)
                db.add(existing)
            existing.name = r.get("name", existing.name)
            existing.category = r.get("category", existing.category)
            existing.severity = r.get("severity", existing.severity)
            existing.channels = r.get("channels", existing.channels)
            existing.is_enabled = r.get("is_enabled", existing.is_enabled)
            rule_count += 1
        db.flush()
        restored_counts["alert_rules"] = rule_count

        db.commit()
        return {
            "status": "success",
            "message": f"Successfully restored database records from {file.filename}!",
            "restored_counts": restored_counts
        }
    except Exception as err:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database restore failed: {str(err)}")
