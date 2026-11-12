import io
import csv
from datetime import date, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
import openpyxl

from app.db.session import get_db
from app.models.asset import Asset, DeviceCategory, DeviceModel
from app.models.contract import Contract, Warranty
from app.models.vendor import Vendor
from app.models.location import Location
from app.models.maintenance import MaintenanceRecord
from app.models.inventory import SparePart

router = APIRouter(prefix="/reports", tags=["Reporting & Analytics"])

REPORT_DEFINITIONS = [
    {"id": "asset_register", "name": "Complete Asset Register", "category": "Assets", "description": "Full master catalog of all physical network devices, serial numbers, hostnames, and IP assignments."},
    {"id": "ownership_report", "name": "Asset Ownership Report", "category": "Ownership", "description": "Breakdown of Company Owned, Rental, Leased, and Vendor Provided equipment."},
    {"id": "rental_report", "name": "Rental Equipment Report", "category": "Rental", "description": "Detailed register of all rental & leased network appliances, monthly costs, return dates, and terms."},
    {"id": "contract_register", "name": "Contract Register", "category": "Contracts", "description": "Comprehensive list of all enterprise support contracts, SLAs, vendors, and total contract values."},
    {"id": "contract_expiration", "name": "Contract Expiration Report", "category": "Contracts", "description": "Contracts approaching expiration within 30, 60, and 90 days requiring renewal."},
    {"id": "warranty_expiration", "name": "Warranty Expiration Report", "category": "Warranty", "description": "Hardware warranty coverage and upcoming expiration alerts across data centers."},
    {"id": "vendor_asset_report", "name": "Vendor Asset Report", "category": "Vendors", "description": "Distribution of network hardware models and appliances categorized by vendor & manufacturer."},
    {"id": "site_inventory", "name": "Site Inventory Report", "category": "Locations", "description": "Physical inventory counts and rack allocations grouped by Site (DC1, DC2, HQ, Branches, DR)."},
    {"id": "device_lifecycle", "name": "Device Lifecycle Report", "category": "Lifecycle", "description": "Operational statuses (Deployed, In Maintenance, Decommissioned, Reserved) and deployment age."},
    {"id": "eol_eos_report", "name": "EOL/EOS Report", "category": "Lifecycle", "description": "Devices approaching End-of-Life and End-of-Support requiring hardware refresh cycles."},
    {"id": "maintenance_history", "name": "Maintenance History Report", "category": "Maintenance", "description": "Audit of all preventive and corrective repairs, downtime, resolutions, and associated costs."},
    {"id": "spare_parts_report", "name": "Spare Parts Inventory Report", "category": "Inventory", "description": "Current stock levels of optics, SFP+ modules, power supplies, and low-stock reorder alerts."}
]

@router.get("/types")
def get_report_types():
    return REPORT_DEFINITIONS

@router.get("/preview/{report_id}")
def preview_report(
    report_id: str,
    site_id: Optional[int] = Query(None),
    vendor_id: Optional[int] = Query(None),
    limit: int = Query(25, ge=5, le=100),
    db: Session = Depends(get_db)
):
    # Generates preview tabular data
    headers, rows = generate_report_data(report_id, db, site_id, vendor_id, limit=limit)
    return {
        "report_id": report_id,
        "title": next((r["name"] for r in REPORT_DEFINITIONS if r["id"] == report_id), "Report"),
        "headers": headers,
        "rows": rows[:limit],
        "total_rows": len(rows)
    }

@router.get("/download/{report_id}")
def download_report(
    report_id: str,
    format: str = Query("xlsx", pattern="^(csv|xlsx)$"),
    site_id: Optional[int] = Query(None),
    vendor_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    headers, rows = generate_report_data(report_id, db, site_id, vendor_id, limit=10000)
    report_name = next((r["name"] for r in REPORT_DEFINITIONS if r["id"] == report_id), "Report")
    safe_filename = report_id.replace("_", "-")

    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(headers)
        for r in rows:
            writer.writerow(r)
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=phillip_{safe_filename}.csv"}
        )
    else:
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = report_name[:31]
        ws.append(headers)
        for r in rows:
            ws.append(r)
        stream = io.BytesIO()
        wb.save(stream)
        stream.seek(0)
        return StreamingResponse(
            stream,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=phillip_{safe_filename}.xlsx"}
        )

def generate_report_data(report_id: str, db: Session, site_id: Optional[int], vendor_id: Optional[int], limit: int = 10000):
    if report_id == "asset_register":
        headers = ["Asset ID", "Hostname", "Model", "Vendor", "Serial Number", "Location", "Status", "Ownership", "IP Address", "VLAN"]
        q = db.query(Asset).filter(Asset.is_deleted == False)
        if site_id: q = q.filter(Asset.location_id == site_id)
        if vendor_id: q = q.filter(Asset.vendor_id == vendor_id)
        rows = [[a.asset_id, a.hostname, a.model.model_name if a.model else "", a.vendor.name if a.vendor else a.manufacturer, a.serial_number, a.location_display or "", a.operational_status, a.ownership_type, a.management_ip or "", a.vlan or ""] for a in q.limit(limit).all()]
        return headers, rows

    elif report_id == "rental_report":
        headers = ["Asset ID", "Hostname", "Model", "Provider", "Agreement Ref", "Rental Start", "Rental End", "Monthly Cost (HKD)", "Location"]
        q = db.query(Asset).filter(Asset.ownership_type.in_(["Rental", "Leased"]), Asset.is_deleted == False)
        rows = [[a.asset_id, a.hostname, a.model.model_name if a.model else "", a.rental_provider or "", a.rental_agreement_ref or "", str(a.rental_start_date or ""), str(a.rental_end_date or ""), float(a.monthly_rental_cost or 0), a.location_display or ""] for a in q.limit(limit).all()]
        return headers, rows

    elif report_id == "ownership_report":
        headers = ["Asset ID", "Hostname", "Ownership Type", "Manufacturer", "Model", "Purchase Price (HKD)", "Supplier", "Location"]
        q = db.query(Asset).filter(Asset.is_deleted == False)
        rows = [[a.asset_id, a.hostname, a.ownership_type, a.manufacturer, a.model.model_name if a.model else "", float(a.purchase_price or 0), a.supplier or "", a.location_display or ""] for a in q.limit(limit).all()]
        return headers, rows

    elif report_id == "contract_register":
        headers = ["Contract Number", "Contract Name", "Type", "Vendor", "Value (HKD)", "Start Date", "End Date", "Status", "SLA"]
        q = db.query(Contract)
        rows = [[c.contract_number, c.contract_name, c.contract_type, c.vendor.name if c.vendor else "", float(c.contract_value or 0), str(c.start_date), str(c.end_date), c.status, c.sla] for c in q.limit(limit).all()]
        return headers, rows

    elif report_id == "contract_expiration":
        headers = ["Contract Number", "Contract Name", "Vendor", "End Date", "Days Remaining", "Status", "SLA Level"]
        today = date.today()
        q = db.query(Contract).filter(Contract.end_date <= today + timedelta(days=90)).order_by(Contract.end_date.asc())
        rows = [[c.contract_number, c.contract_name, c.vendor.name if c.vendor else "", str(c.end_date), (c.end_date - today).days, c.status, c.sla] for c in q.limit(limit).all()]
        return headers, rows

    elif report_id == "warranty_expiration":
        headers = ["Asset ID", "Hostname", "Provider", "Reference No", "Expiration Date", "Status", "Coverage Level"]
        q = db.query(Warranty).order_by(Warranty.expiration_date.asc())
        rows = [[w.asset.asset_id if w.asset else "", w.asset.hostname if w.asset else "", w.provider, w.reference_no or "", str(w.expiration_date), w.status, w.support_coverage] for w in q.limit(limit).all()]
        return headers, rows

    elif report_id == "vendor_asset_report":
        headers = ["Vendor Code", "Vendor Name", "Category", "Manufacturer", "Total Assets Covered", "Support Contact", "Support Hotline"]
        q = db.query(Vendor)
        rows = [[v.vendor_code, v.name, v.category, v.manufacturer or "", len(v.assets), v.support_contact or "", v.support_hotline or ""] for v in q.limit(limit).all()]
        return headers, rows

    elif report_id == "site_inventory":
        headers = ["Site Code", "Site Name", "Type", "City", "Total Assets", "Contact Person", "Emergency Phone"]
        q = db.query(Location)
        rows = [[loc.code, loc.name, loc.type, loc.city, len(loc.assets), loc.contact_person or "", loc.contact_phone or ""] for loc in q.limit(limit).all()]
        return headers, rows

    elif report_id == "device_lifecycle":
        headers = ["Asset ID", "Hostname", "Operational Status", "Asset Condition", "Acquisition Date", "Deployment Date", "EOL Date"]
        q = db.query(Asset).filter(Asset.is_deleted == False)
        rows = [[a.asset_id, a.hostname, a.operational_status, a.asset_condition, str(a.acquisition_date or ""), str(a.deployment_date or ""), str(a.end_of_life_date or "")] for a in q.limit(limit).all()]
        return headers, rows

    elif report_id == "eol_eos_report":
        headers = ["Asset ID", "Hostname", "Model", "Manufacturer", "EOL Date", "EOS Date", "Recommended Replacement"]
        q = db.query(Asset).filter(Asset.is_deleted == False)
        rows = [[a.asset_id, a.hostname, a.model.model_name if a.model else "", a.manufacturer, str(a.end_of_life_date or ""), str(a.end_of_support_date or ""), ""] for a in q.limit(limit).all()]
        return headers, rows

    elif report_id == "maintenance_history":
        headers = ["Ticket No", "Asset Hostname", "Type", "Reported Date", "Technician", "Cost (HKD)", "Status", "Resolution"]
        q = db.query(MaintenanceRecord).order_by(MaintenanceRecord.created_at.desc())
        rows = [[m.ticket_number, m.asset.hostname if m.asset else "", m.maintenance_type, str(m.reported_date), m.technician, float(m.cost or 0), m.status, m.resolution or ""] for m in q.limit(limit).all()]
        return headers, rows

    elif report_id == "spare_parts_report":
        headers = ["Part Number", "Name", "Category", "Quantity On Hand", "Min Level", "Unit Cost (HKD)", "Location", "Status"]
        q = db.query(SparePart).order_by(SparePart.quantity.asc())
        rows = [[sp.part_number, sp.name, sp.category, sp.quantity, sp.min_stock_level, float(sp.unit_cost or 0), sp.stock_location, sp.status] for sp in q.limit(limit).all()]
        return headers, rows

    else:
        return ["Column 1"], [["No data"]]
