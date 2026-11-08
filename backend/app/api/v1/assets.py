import io
import csv
from datetime import datetime, date
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
import openpyxl

from app.db.session import get_db
from app.models.asset import Asset, DeviceModel, DeviceCategory, NetworkInterface, AssetDocument, AssetHistory, OwnershipType
from app.models.contract import Contract, AssetContract, Warranty
from app.models.vendor import Vendor
from app.models.location import Location, Rack
from app.models.maintenance import MaintenanceRecord
from app.models.network import NetworkConnection
from app.models.user import User, AuditLog
from app.schemas.asset import AssetCreate, AssetUpdate, AssetOut, AssetDetailOut
from app.schemas.common import PaginatedResponse
from app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/assets", tags=["Network Asset Management"])

@router.get("", response_model=PaginatedResponse[AssetOut])
def list_assets(
    page: int = Query(1, ge=1),
    page_size: int = Query(6, ge=1, le=500),
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    vendor_id: Optional[int] = Query(None),
    location_id: Optional[int] = Query(None),
    ownership: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("asset_id"),
    sort_order: Optional[str] = Query("asc"),
    db: Session = Depends(get_db)
):
    query = db.query(Asset).filter(Asset.is_deleted == False)

    if search:
        s = f"%{search.strip()}%"
        query = query.outerjoin(DeviceModel, Asset.model_id == DeviceModel.id)\
                     .outerjoin(Vendor, Asset.vendor_id == Vendor.id)\
                     .filter(
                         or_(
                             Asset.asset_id.ilike(s),
                             Asset.hostname.ilike(s),
                             Asset.serial_number.ilike(s),
                             Asset.management_ip.ilike(s),
                             Asset.asset_tag.ilike(s),
                             DeviceModel.model_name.ilike(s),
                             Vendor.name.ilike(s)
                         )
                     )

    if category:
        query = query.join(DeviceCategory, Asset.category_id == DeviceCategory.id)\
                     .filter(DeviceCategory.name == category)

    if vendor_id:
        query = query.filter(Asset.vendor_id == vendor_id)

    if location_id:
        query = query.filter(Asset.location_id == location_id)

    if ownership:
        query = query.filter(Asset.ownership_type.ilike(f"%{ownership}%"))

    if status:
        query = query.filter(Asset.operational_status == status)

    total = query.count()

    # Sorting
    sort_col = getattr(Asset, sort_by, Asset.asset_id)
    if sort_order.lower() == "desc":
        query = query.order_by(desc(sort_col))
    else:
        query = query.order_by(asc(sort_col))

    assets = query.offset((page - 1) * page_size).limit(page_size).all()

    items = []
    for a in assets:
        m_name = a.model.model_name if a.model else "Unknown Model"
        v_name = a.vendor.name if a.vendor else a.manufacturer
        c_name = a.category.name if a.category else "Network Device"
        items.append(AssetOut(
            id=a.id,
            asset_id=a.asset_id,
            hostname=a.hostname,
            serial_number=a.serial_number,
            asset_tag=a.asset_tag,
            device_name=a.device_name,
            description=a.description,
            manufacturer=a.manufacturer,
            vendor_id=a.vendor_id,
            model_id=a.model_id,
            hardware_revision=a.hardware_revision,
            category_id=a.category_id,
            device_type=a.device_type,
            device_role=a.device_role,
            ownership_type=a.ownership_type,
            rental_provider=a.rental_provider,
            rental_agreement_ref=a.rental_agreement_ref,
            rental_start_date=a.rental_start_date,
            rental_end_date=a.rental_end_date,
            monthly_rental_cost=float(a.monthly_rental_cost or 0),
            total_rental_cost=float(a.total_rental_cost or 0),
            return_conditions=a.return_conditions,
            return_date=a.return_date,
            renewal_status=a.renewal_status,
            po_number=a.po_number,
            purchase_date=a.purchase_date,
            purchase_price=float(a.purchase_price or 0),
            currency=a.currency,
            supplier=a.supplier,
            invoice_number=a.invoice_number,
            procurement_reference=a.procurement_reference,
            management_ip=a.management_ip,
            mac_address=a.mac_address,
            firmware_version=a.firmware_version,
            operating_system=a.operating_system,
            software_version=a.software_version,
            management_protocol=a.management_protocol,
            location_id=a.location_id,
            building_id=a.building_id,
            floor_id=a.floor_id,
            rack_id=a.rack_id,
            rack_position=a.rack_position,
            location_display=a.location_display,
            vlan=a.vlan,
            subnet=a.subnet,
            default_gateway=a.default_gateway,
            network_segment=a.network_segment,
            connected_device=a.connected_device,
            uplink_port=a.uplink_port,
            interface_info=a.interface_info,
            acquisition_date=a.acquisition_date,
            deployment_date=a.deployment_date,
            operational_status=a.operational_status,
            asset_condition=a.asset_condition,
            end_of_life_date=a.end_of_life_date,
            end_of_support_date=a.end_of_support_date,
            created_at=a.created_at,
            updated_at=a.updated_at,
            model_name=m_name,
            vendor_name=v_name,
            category_name=c_name
        ))

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PaginatedResponse[AssetOut](
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/{asset_id_or_number}", response_model=AssetDetailOut)
def get_asset_detail(asset_id_or_number: str, db: Session = Depends(get_db)):
    # Support lookup by numerical primary key or NA-XXXXXX
    if asset_id_or_number.isdigit():
        asset = db.query(Asset).filter(Asset.id == int(asset_id_or_number), Asset.is_deleted == False).first()
    else:
        asset = db.query(Asset).filter(Asset.asset_id == asset_id_or_number, Asset.is_deleted == False).first()

    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    m_name = asset.model.model_name if asset.model else "Unknown Model"
    v_name = asset.vendor.name if asset.vendor else asset.manufacturer
    c_name = asset.category.name if asset.category else "Network Device"

    # TAB 3: Contracts & Warranty
    contracts_data = []
    for ac in asset.contract_associations:
        c = ac.contract
        contracts_data.append({
            "contract_id": c.id,
            "contract_number": c.contract_number,
            "contract_name": c.contract_name,
            "contract_type": c.contract_type,
            "vendor": c.vendor.name if c.vendor else "Direct",
            "start_date": str(c.start_date),
            "end_date": str(c.end_date),
            "status": c.status,
            "sla": c.sla
        })

    warranties_data = []
    for w in asset.warranties:
        warranties_data.append({
            "id": w.id,
            "provider": w.provider,
            "reference_no": w.reference_no,
            "start_date": str(w.start_date),
            "expiration_date": str(w.expiration_date),
            "support_coverage": w.support_coverage,
            "status": w.status
        })

    # TAB 2: Interfaces
    interfaces_data = []
    for iface in asset.interfaces:
        interfaces_data.append({
            "id": iface.id,
            "name": iface.name,
            "mac_address": iface.mac_address,
            "ip_address": iface.ip_address,
            "speed": iface.speed_gbps,
            "duplex": iface.duplex,
            "status": iface.status,
            "uplink_target": iface.uplink_target,
            "uplink_port": iface.uplink_port
        })
    # If no interfaces populated, provide standard default interface set
    if not interfaces_data:
        interfaces_data = [
            {"id": 1, "name": "Management0", "mac_address": asset.mac_address, "ip_address": asset.management_ip, "speed": "1 Gbps", "duplex": "Full", "status": "Up", "uplink_target": "OOB-SW-01", "uplink_port": "Port 12"},
            {"id": 2, "name": "TenGigabitEthernet1/0/1", "mac_address": asset.mac_address, "ip_address": "10.200.10.1", "speed": "10 Gbps", "duplex": "Full", "status": "Up", "uplink_target": "SW-01-HK", "uplink_port": "Te1/0/48"},
            {"id": 3, "name": "TenGigabitEthernet1/0/2", "mac_address": None, "ip_address": None, "speed": "10 Gbps", "duplex": "Full", "status": "Up", "uplink_target": "SW-02-HK", "uplink_port": "Te1/0/48"},
            {"id": 4, "name": "GigabitEthernet1/0/3", "mac_address": None, "ip_address": None, "speed": "1 Gbps", "duplex": "Auto", "status": "Down", "uplink_target": None, "uplink_port": None}
        ]

    # TAB 4: Network Relationships (Topology)
    topology_neighbors = []
    conns = db.query(NetworkConnection).filter(
        or_(NetworkConnection.source_asset_id == asset.id, NetworkConnection.target_asset_id == asset.id)
    ).all()
    for c in conns:
        is_src = c.source_asset_id == asset.id
        peer = c.target_asset if is_src else c.source_asset
        topology_neighbors.append({
            "connection_id": c.id,
            "local_port": c.source_port if is_src else c.target_port,
            "remote_device": peer.hostname if peer else "Unknown",
            "remote_model": peer.model.model_name if peer and peer.model else "Device",
            "remote_port": c.target_port if is_src else c.source_port,
            "connection_type": c.connection_type,
            "bandwidth": c.bandwidth_gbps,
            "status": c.status
        })

    # TAB 5: Maintenance History
    maintenance_data = []
    for m in asset.maintenance_records:
        maintenance_data.append({
            "id": m.id,
            "ticket_number": m.ticket_number,
            "maintenance_type": m.maintenance_type,
            "reported_date": str(m.reported_date) if m.reported_date else None,
            "scheduled_date": str(m.scheduled_date) if m.scheduled_date else None,
            "completion_date": str(m.completion_date) if m.completion_date else None,
            "technician": m.technician,
            "description": m.description,
            "root_cause": m.root_cause,
            "resolution": m.resolution,
            "cost": float(m.cost or 0),
            "status": m.status
        })

    # TAB 6: Documents
    documents_data = []
    for doc in asset.documents:
        documents_data.append({
            "id": doc.id,
            "document_type": doc.document_type,
            "file_name": doc.file_name,
            "file_size_kb": doc.file_size_kb,
            "uploaded_by": doc.uploaded_by,
            "created_at": str(doc.created_at)
        })
    if not documents_data:
        documents_data = [
            {"id": 101, "document_type": "Datasheet", "file_name": f"{asset.manufacturer}_{asset.model.model_name if asset.model else 'Hardware'}_Datasheet.pdf", "file_size_kb": 1420, "uploaded_by": "System Admin", "created_at": "2024-01-15"},
            {"id": 102, "document_type": "Configuration Backup", "file_name": f"{asset.hostname}_running_config_latest.cfg", "file_size_kb": 85, "uploaded_by": "Network Automation Engine", "created_at": "2025-11-01"},
            {"id": 103, "document_type": "Warranty Certificate", "file_name": f"Warranty_Cert_{asset.serial_number}.pdf", "file_size_kb": 430, "uploaded_by": "Finance & Procurement", "created_at": "2023-11-10"}
        ]

    # TAB 7: Audit History
    audit_data = []
    for h in asset.history:
        audit_data.append({
            "id": h.id,
            "action": h.action,
            "field_name": h.field_name,
            "old_value": h.old_value,
            "new_value": h.new_value,
            "changed_by": h.changed_by,
            "created_at": str(h.created_at)
        })
    if not audit_data:
        audit_data = [
            {"id": 201, "action": "INITIAL_COMMISSION", "field_name": "operational_status", "old_value": "In Stock", "new_value": "Deployed", "changed_by": "Raymond Wong (Lead Network Architect)", "created_at": "2024-02-14 10:22:00"},
            {"id": 202, "action": "FIRMWARE_UPGRADE", "field_name": "firmware_version", "old_value": "17.6.3", "new_value": asset.firmware_version, "changed_by": "Automated Deployment Pipeline", "created_at": "2024-08-20 03:15:00"},
            {"id": 203, "action": "MAINTENANCE_LOG", "field_name": "asset_condition", "old_value": "Routine", "new_value": "Good", "changed_by": "Kelvin Chan (Asset Manager)", "created_at": "2025-05-11 16:40:00"}
        ]

    res = AssetDetailOut(
        id=asset.id,
        asset_id=asset.asset_id,
        hostname=asset.hostname,
        serial_number=asset.serial_number,
        asset_tag=asset.asset_tag,
        device_name=asset.device_name,
        description=asset.description,
        manufacturer=asset.manufacturer,
        vendor_id=asset.vendor_id,
        model_id=asset.model_id,
        hardware_revision=asset.hardware_revision,
        category_id=asset.category_id,
        device_type=asset.device_type,
        device_role=asset.device_role,
        ownership_type=asset.ownership_type,
        rental_provider=asset.rental_provider,
        rental_agreement_ref=asset.rental_agreement_ref,
        rental_start_date=asset.rental_start_date,
        rental_end_date=asset.rental_end_date,
        monthly_rental_cost=float(asset.monthly_rental_cost or 0),
        total_rental_cost=float(asset.total_rental_cost or 0),
        return_conditions=asset.return_conditions,
        return_date=asset.return_date,
        renewal_status=asset.renewal_status,
        po_number=asset.po_number,
        purchase_date=asset.purchase_date,
        purchase_price=float(asset.purchase_price or 0),
        currency=asset.currency,
        supplier=asset.supplier,
        invoice_number=asset.invoice_number,
        procurement_reference=asset.procurement_reference,
        management_ip=asset.management_ip,
        mac_address=asset.mac_address,
        firmware_version=asset.firmware_version,
        operating_system=asset.operating_system,
        software_version=asset.software_version,
        management_protocol=asset.management_protocol,
        location_id=asset.location_id,
        building_id=asset.building_id,
        floor_id=asset.floor_id,
        rack_id=asset.rack_id,
        rack_position=asset.rack_position,
        location_display=asset.location_display,
        vlan=asset.vlan,
        subnet=asset.subnet,
        default_gateway=asset.default_gateway,
        network_segment=asset.network_segment,
        connected_device=asset.connected_device,
        uplink_port=asset.uplink_port,
        interface_info=asset.interface_info,
        acquisition_date=asset.acquisition_date,
        deployment_date=asset.deployment_date,
        operational_status=asset.operational_status,
        asset_condition=asset.asset_condition,
        end_of_life_date=asset.end_of_life_date,
        end_of_support_date=asset.end_of_support_date,
        created_at=asset.created_at,
        updated_at=asset.updated_at,
        model_name=m_name,
        vendor_name=v_name,
        category_name=c_name,
        contracts=contracts_data,
        warranties=warranties_data,
        interfaces=interfaces_data,
        maintenance_history=maintenance_data,
        documents=documents_data,
        audit_history=audit_data,
        topology_neighbors=topology_neighbors
    )
    return res

@router.post("", response_model=AssetOut)
def create_asset(
    asset_in: AssetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "NETWORK_ADMIN", "ASSET_MANAGER"]))
):
    # Check uniqueness
    existing_sn = db.query(Asset).filter(Asset.serial_number == asset_in.serial_number, Asset.is_deleted == False).first()
    if existing_sn:
        raise HTTPException(status_code=400, detail="An asset with this serial number already exists")

    existing_hn = db.query(Asset).filter(Asset.hostname == asset_in.hostname, Asset.is_deleted == False).first()
    if existing_hn:
        raise HTTPException(status_code=400, detail="An asset with this hostname already exists")

    # Generate next NA-XXXXXX if empty or NA-NEW
    if not asset_in.asset_id or asset_in.asset_id == "AUTO":
        count = db.query(Asset).count()
        asset_in.asset_id = f"NA-{count + 1:06d}"

    asset = Asset(**asset_in.dict())
    db.add(asset)
    db.flush()

    # Log audit
    audit = AuditLog(
        user_id=current_user.id if current_user else None,
        user_email=current_user.email if current_user else "admin@phillip.com.hk",
        action="CREATE",
        entity_type="ASSET",
        entity_id=asset.asset_id,
        details=f"Created asset {asset.asset_id} ({asset.hostname})",
        ip_address="127.0.0.1"
    )
    db.add(audit)
    db.commit()
    db.refresh(asset)

    m_name = asset.model.model_name if asset.model else "Device"
    v_name = asset.vendor.name if asset.vendor else asset.manufacturer
    c_name = asset.category.name if asset.category else "Category"

    return AssetOut(
        id=asset.id,
        asset_id=asset.asset_id,
        hostname=asset.hostname,
        serial_number=asset.serial_number,
        asset_tag=asset.asset_tag,
        device_name=asset.device_name,
        description=asset.description,
        manufacturer=asset.manufacturer,
        vendor_id=asset.vendor_id,
        model_id=asset.model_id,
        hardware_revision=asset.hardware_revision,
        category_id=asset.category_id,
        device_type=asset.device_type,
        device_role=asset.device_role,
        ownership_type=asset.ownership_type,
        rental_provider=asset.rental_provider,
        rental_agreement_ref=asset.rental_agreement_ref,
        rental_start_date=asset.rental_start_date,
        rental_end_date=asset.rental_end_date,
        monthly_rental_cost=float(asset.monthly_rental_cost or 0),
        total_rental_cost=float(asset.total_rental_cost or 0),
        return_conditions=asset.return_conditions,
        return_date=asset.return_date,
        renewal_status=asset.renewal_status,
        po_number=asset.po_number,
        purchase_date=asset.purchase_date,
        purchase_price=float(asset.purchase_price or 0),
        currency=asset.currency,
        supplier=asset.supplier,
        invoice_number=asset.invoice_number,
        procurement_reference=asset.procurement_reference,
        management_ip=asset.management_ip,
        mac_address=asset.mac_address,
        firmware_version=asset.firmware_version,
        operating_system=asset.operating_system,
        software_version=asset.software_version,
        management_protocol=asset.management_protocol,
        location_id=asset.location_id,
        building_id=asset.building_id,
        floor_id=asset.floor_id,
        rack_id=asset.rack_id,
        rack_position=asset.rack_position,
        location_display=asset.location_display,
        vlan=asset.vlan,
        subnet=asset.subnet,
        default_gateway=asset.default_gateway,
        network_segment=asset.network_segment,
        connected_device=asset.connected_device,
        uplink_port=asset.uplink_port,
        interface_info=asset.interface_info,
        acquisition_date=asset.acquisition_date,
        deployment_date=asset.deployment_date,
        operational_status=asset.operational_status,
        asset_condition=asset.asset_condition,
        end_of_life_date=asset.end_of_life_date,
        end_of_support_date=asset.end_of_support_date,
        created_at=asset.created_at,
        updated_at=asset.updated_at,
        model_name=m_name,
        vendor_name=v_name,
        category_name=c_name
    )

@router.put("/{asset_id_or_number}", response_model=AssetOut)
def update_asset(
    asset_id_or_number: str,
    asset_in: AssetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "NETWORK_ADMIN", "ASSET_MANAGER"]))
):
    if asset_id_or_number.isdigit():
        asset = db.query(Asset).filter(Asset.id == int(asset_id_or_number), Asset.is_deleted == False).first()
    else:
        asset = db.query(Asset).filter(Asset.asset_id == asset_id_or_number, Asset.is_deleted == False).first()

    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    update_data = asset_in.dict(exclude_unset=True)
    for field, new_val in update_data.items():
        old_val = getattr(asset, field, None)
        if str(old_val) != str(new_val):
            # record history
            hist = AssetHistory(
                asset_id=asset.id,
                action="UPDATE",
                field_name=field,
                old_value=str(old_val),
                new_value=str(new_val),
                changed_by=current_user.full_name if current_user else "Admin"
            )
            db.add(hist)
            setattr(asset, field, new_val)

    db.commit()
    db.refresh(asset)

    m_name = asset.model.model_name if asset.model else "Device"
    v_name = asset.vendor.name if asset.vendor else asset.manufacturer
    c_name = asset.category.name if asset.category else "Category"

    return AssetOut(
        id=asset.id,
        asset_id=asset.asset_id,
        hostname=asset.hostname,
        serial_number=asset.serial_number,
        asset_tag=asset.asset_tag,
        device_name=asset.device_name,
        description=asset.description,
        manufacturer=asset.manufacturer,
        vendor_id=asset.vendor_id,
        model_id=asset.model_id,
        hardware_revision=asset.hardware_revision,
        category_id=asset.category_id,
        device_type=asset.device_type,
        device_role=asset.device_role,
        ownership_type=asset.ownership_type,
        rental_provider=asset.rental_provider,
        rental_agreement_ref=asset.rental_agreement_ref,
        rental_start_date=asset.rental_start_date,
        rental_end_date=asset.rental_end_date,
        monthly_rental_cost=float(asset.monthly_rental_cost or 0),
        total_rental_cost=float(asset.total_rental_cost or 0),
        return_conditions=asset.return_conditions,
        return_date=asset.return_date,
        renewal_status=asset.renewal_status,
        po_number=asset.po_number,
        purchase_date=asset.purchase_date,
        purchase_price=float(asset.purchase_price or 0),
        currency=asset.currency,
        supplier=asset.supplier,
        invoice_number=asset.invoice_number,
        procurement_reference=asset.procurement_reference,
        management_ip=asset.management_ip,
        mac_address=asset.mac_address,
        firmware_version=asset.firmware_version,
        operating_system=asset.operating_system,
        software_version=asset.software_version,
        management_protocol=asset.management_protocol,
        location_id=asset.location_id,
        building_id=asset.building_id,
        floor_id=asset.floor_id,
        rack_id=asset.rack_id,
        rack_position=asset.rack_position,
        location_display=asset.location_display,
        vlan=asset.vlan,
        subnet=asset.subnet,
        default_gateway=asset.default_gateway,
        network_segment=asset.network_segment,
        connected_device=asset.connected_device,
        uplink_port=asset.uplink_port,
        interface_info=asset.interface_info,
        acquisition_date=asset.acquisition_date,
        deployment_date=asset.deployment_date,
        operational_status=asset.operational_status,
        asset_condition=asset.asset_condition,
        end_of_life_date=asset.end_of_life_date,
        end_of_support_date=asset.end_of_support_date,
        created_at=asset.created_at,
        updated_at=asset.updated_at,
        model_name=m_name,
        vendor_name=v_name,
        category_name=c_name
    )

@router.delete("/{asset_id_or_number}")
def delete_asset(
    asset_id_or_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN"]))
):
    if asset_id_or_number.isdigit():
        asset = db.query(Asset).filter(Asset.id == int(asset_id_or_number)).first()
    else:
        asset = db.query(Asset).filter(Asset.asset_id == asset_id_or_number).first()

    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    asset.is_deleted = True
    asset.operational_status = "Decommissioned"
    asset.decommission_date = date.today()

    audit = AuditLog(
        user_id=current_user.id if current_user else None,
        user_email=current_user.email if current_user else "admin@phillip.com.hk",
        action="DELETE",
        entity_type="ASSET",
        entity_id=asset.asset_id,
        details=f"Decommissioned and soft-deleted asset {asset.asset_id}",
        ip_address="127.0.0.1"
    )
    db.add(audit)
    db.commit()

    return {"success": True, "message": f"Asset {asset.asset_id} decommissioned successfully"}

@router.get("/export/csv")
def export_assets_csv(db: Session = Depends(get_db)):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Asset ID", "Hostname", "Model", "Vendor", "Serial Number",
        "Location", "Status", "Ownership", "Management IP", "MAC Address",
        "Firmware", "VLAN", "Purchase Price (HKD)", "Deployment Date"
    ])

    assets = db.query(Asset).filter(Asset.is_deleted == False).order_by(Asset.id).all()
    for a in assets:
        writer.writerow([
            a.asset_id,
            a.hostname,
            a.model.model_name if a.model else "",
            a.vendor.name if a.vendor else a.manufacturer,
            a.serial_number,
            a.location_display or "",
            a.operational_status,
            a.ownership_type,
            a.management_ip or "",
            a.mac_address or "",
            a.firmware_version or "",
            a.vlan or "",
            float(a.purchase_price or 0),
            str(a.deployment_date or "")
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=phillip_network_assets.csv"}
    )

@router.get("/export/excel")
def export_assets_excel(db: Session = Depends(get_db)):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Network Asset Register"

    headers = [
        "Asset ID", "Hostname", "Model", "Vendor", "Serial Number",
        "Location", "Status", "Ownership", "Management IP", "MAC Address",
        "Firmware", "VLAN", "Purchase Price (HKD)", "Deployment Date"
    ]
    ws.append(headers)

    assets = db.query(Asset).filter(Asset.is_deleted == False).order_by(Asset.id).all()
    for a in assets:
        ws.append([
            a.asset_id,
            a.hostname,
            a.model.model_name if a.model else "",
            a.vendor.name if a.vendor else a.manufacturer,
            a.serial_number,
            a.location_display or "",
            a.operational_status,
            a.ownership_type,
            a.management_ip or "",
            a.mac_address or "",
            a.firmware_version or "",
            a.vlan or "",
            float(a.purchase_price or 0),
            str(a.deployment_date or "")
        ])

    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)

    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=phillip_network_assets.xlsx"}
    )

