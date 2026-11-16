import json
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
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

