from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.session import get_db
from app.models.network import NetworkConnection
from app.models.asset import Asset
from app.schemas.network import ConnectionCreate, ConnectionUpdate, ConnectionOut

router = APIRouter(prefix="/topology", tags=["Network Topology"])

@router.get("")
def get_network_topology(db: Session = Depends(get_db)):
    connections = db.query(NetworkConnection).all()

    # Collect unique asset IDs involved in connections
    asset_ids = set()
    for c in connections:
        asset_ids.add(c.source_asset_id)
        asset_ids.add(c.target_asset_id)

    # If few connections, include top core devices
    if len(asset_ids) < 12:
        top_assets = db.query(Asset).filter(Asset.is_deleted == False).limit(12).all()
        for a in top_assets:
            asset_ids.add(a.id)

    assets = db.query(Asset).filter(Asset.id.in_(list(asset_ids))).all()

    nodes = []
    for a in assets:
        nodes.append({
            "id": a.id,
            "asset_id": a.asset_id,
            "hostname": a.hostname,
            "model": a.model.model_name if a.model else "Device",
            "manufacturer": a.manufacturer,
            "category": a.category.name if a.category else "Network Device",
            "device_role": a.device_role or "",
            "management_ip": a.management_ip,
            "location": a.location_display or "",
            "status": a.operational_status or "Operational",
            "ownership": a.ownership_type
        })

    edges = []
    for c in connections:
        src = db.query(Asset).filter(Asset.id == c.source_asset_id).first()
        tgt = db.query(Asset).filter(Asset.id == c.target_asset_id).first()
        edges.append({
            "id": c.id,
            "source": c.source_asset_id,
            "source_hostname": src.hostname if src else f"Node {c.source_asset_id}",
            "source_port": c.source_port,
            "target": c.target_asset_id,
            "target_hostname": tgt.hostname if tgt else f"Node {c.target_asset_id}",
            "target_port": c.target_port,
            "connection_type": c.connection_type,
            "bandwidth": c.bandwidth_gbps,
            "status": c.status,
            "notes": c.notes
        })

    return {
        "nodes": nodes,
        "edges": edges,
        "total_nodes": len(nodes),
        "total_edges": len(edges)
    }

@router.get("/connections", response_model=List[ConnectionOut])
def list_connections(db: Session = Depends(get_db)):
    connections = db.query(NetworkConnection).order_by(NetworkConnection.id.desc()).all()
    results = []
    for c in connections:
        src = db.query(Asset).filter(Asset.id == c.source_asset_id).first()
        tgt = db.query(Asset).filter(Asset.id == c.target_asset_id).first()
        results.append(ConnectionOut(
            id=c.id,
            source_asset_id=c.source_asset_id,
            source_port=c.source_port,
            target_asset_id=c.target_asset_id,
            target_port=c.target_port,
            connection_type=c.connection_type,
            bandwidth_gbps=c.bandwidth_gbps,
            status=c.status,
            notes=c.notes,
            created_at=c.created_at,
            source_hostname=src.hostname if src else f"Asset #{c.source_asset_id}",
            source_model=src.model.model_name if (src and src.model) else "",
            source_ip=src.management_ip if src else "",
            target_hostname=tgt.hostname if tgt else f"Asset #{c.target_asset_id}",
            target_model=tgt.model.model_name if (tgt and tgt.model) else "",
            target_ip=tgt.management_ip if tgt else ""
        ))
    return results

@router.get("/devices")
def list_connectable_devices(db: Session = Depends(get_db)):
    """List assets eligible to connect via topology links (switches, routers, servers, firewalls)"""
    assets = db.query(Asset).filter(Asset.is_deleted == False).order_by(Asset.hostname).all()
    return [{
        "id": a.id,
        "asset_id": a.asset_id,
        "hostname": a.hostname,
        "management_ip": a.management_ip or "N/A",
        "category": a.category.name if a.category else "Hardware",
        "model": a.model.model_name if a.model else "",
        "operational_status": a.operational_status or "Operational"
    } for a in assets]

@router.post("/connections", response_model=ConnectionOut)
def create_connection(conn_in: ConnectionCreate, db: Session = Depends(get_db)):
    if conn_in.source_asset_id == conn_in.target_asset_id:
        raise HTTPException(status_code=400, detail="Source and Target device cannot be the same device")

    src = db.query(Asset).filter(Asset.id == conn_in.source_asset_id).first()
    tgt = db.query(Asset).filter(Asset.id == conn_in.target_asset_id).first()
    if not src or not tgt:
        raise HTTPException(status_code=400, detail="Invalid source or target asset ID")

    conn = NetworkConnection(**conn_in.dict())
    db.add(conn)
    db.commit()
    db.refresh(conn)

    return ConnectionOut(
        id=conn.id,
        source_asset_id=conn.source_asset_id,
        source_port=conn.source_port,
        target_asset_id=conn.target_asset_id,
        target_port=conn.target_port,
        connection_type=conn.connection_type,
        bandwidth_gbps=conn.bandwidth_gbps,
        status=conn.status,
        notes=conn.notes,
        created_at=conn.created_at,
        source_hostname=src.hostname,
        source_model=src.model.model_name if src.model else "",
        source_ip=src.management_ip,
        target_hostname=tgt.hostname,
        target_model=tgt.model.model_name if tgt.model else "",
        target_ip=tgt.management_ip
    )

@router.put("/connections/{id}", response_model=ConnectionOut)
def update_connection(id: int, conn_in: ConnectionUpdate, db: Session = Depends(get_db)):
    conn = db.query(NetworkConnection).filter(NetworkConnection.id == id).first()
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")

    update_data = conn_in.dict(exclude_unset=True)
    if "source_asset_id" in update_data and "target_asset_id" in update_data:
        if update_data["source_asset_id"] == update_data["target_asset_id"]:
            raise HTTPException(status_code=400, detail="Source and Target device cannot be the same device")

    for field, val in update_data.items():
        setattr(conn, field, val)

    db.commit()
    db.refresh(conn)

    src = db.query(Asset).filter(Asset.id == conn.source_asset_id).first()
    tgt = db.query(Asset).filter(Asset.id == conn.target_asset_id).first()

    return ConnectionOut(
        id=conn.id,
        source_asset_id=conn.source_asset_id,
        source_port=conn.source_port,
        target_asset_id=conn.target_asset_id,
        target_port=conn.target_port,
        connection_type=conn.connection_type,
        bandwidth_gbps=conn.bandwidth_gbps,
        status=conn.status,
        notes=conn.notes,
        created_at=conn.created_at,
        source_hostname=src.hostname if src else "",
        source_model=src.model.model_name if (src and src.model) else "",
        source_ip=src.management_ip if src else "",
        target_hostname=tgt.hostname if tgt else "",
        target_model=tgt.model.model_name if (tgt and tgt.model) else "",
        target_ip=tgt.management_ip if tgt else ""
    )

@router.delete("/connections/{id}")
def delete_connection(id: int, db: Session = Depends(get_db)):
    conn = db.query(NetworkConnection).filter(NetworkConnection.id == id).first()
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")
    db.delete(conn)
    db.commit()
    return {"success": True, "message": "Connection removed successfully"}
