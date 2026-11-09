from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
import datetime

from app.db.session import get_db
from app.models.location import Location, Building, Floor, Rack
from app.models.asset import Asset
from app.schemas.location import (
    LocationCreate, LocationUpdate, LocationOut,
    BuildingCreate, BuildingUpdate, BuildingOut,
    FloorCreate, FloorUpdate, FloorOut,
    RackCreate, RackUpdate, RackOut,
    RackElevationOut, RackUnitItem
)

router = APIRouter(prefix="/locations", tags=["Location & Facility Management"])

# ==============================================================================
# Helper functions
# ==============================================================================

def format_location_out(loc: Location, db: Session) -> LocationOut:
    racks_out = []
    b_count = len(loc.buildings)
    f_count = sum(len(b.floors) for b in loc.buildings)

    for b in loc.buildings:
        for f in b.floors:
            for r in f.racks:
                asset_cnt = db.query(Asset).filter(Asset.rack_id == r.id, Asset.is_deleted == False).count()
                racks_out.append(RackOut(
                    id=r.id,
                    rack_name=r.rack_name,
                    rack_number=r.rack_number,
                    room=r.room,
                    total_u=r.total_u or 42,
                    power_feed=r.power_feed,
                    max_power_kw=r.max_power_kw,
                    floor_id=f.id,
                    floor_name=f.floor_number,
                    building_name=b.name,
                    location_name=loc.name,
                    location_code=loc.code,
                    asset_count=asset_cnt,
                    occupied_u=asset_cnt,
                    available_u=max(0, (r.total_u or 42) - asset_cnt),
                    utilization_pct=round((asset_cnt / (r.total_u or 42)) * 100, 1)
                ))

    asset_count = db.query(Asset).filter(Asset.location_id == loc.id, Asset.is_deleted == False).count()
    return LocationOut(
        id=loc.id,
        code=loc.code,
        name=loc.name,
        type=loc.type,
        country=loc.country,
        city=loc.city,
        address=loc.address,
        contact_person=loc.contact_person,
        contact_phone=loc.contact_phone,
        contact_email=loc.contact_email,
        created_at=loc.created_at,
        asset_count=asset_count,
        building_count=b_count,
        floor_count=f_count,
        rack_count=len(racks_out),
        racks=racks_out
    )

def format_rack_out(r: Rack, db: Session) -> RackOut:
    f = r.floor
    b = f.building if f else None
    loc = b.location if b else None

    asset_cnt = db.query(Asset).filter(Asset.rack_id == r.id, Asset.is_deleted == False).count()
    total_u = r.total_u or 42
    return RackOut(
        id=r.id,
        rack_name=r.rack_name,
        rack_number=r.rack_number,
        room=r.room,
        total_u=total_u,
        power_feed=r.power_feed,
        max_power_kw=r.max_power_kw,
        floor_id=r.floor_id,
        floor_name=f.floor_number if f else "—",
        building_name=b.name if b else "—",
        location_name=loc.name if loc else "—",
        location_code=loc.code if loc else "—",
        asset_count=asset_cnt,
        occupied_u=asset_cnt,
        available_u=max(0, total_u - asset_cnt),
        utilization_pct=round((asset_cnt / total_u) * 100, 1)
    )

# ==============================================================================
# 1. BUILDINGS CRUD (registered before /{id})
# ==============================================================================

@router.get("/buildings/all", response_model=List[BuildingOut])
def list_buildings(
    location_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Building)
    if location_id:
        query = query.filter(Building.location_id == location_id)
    buildings = query.all()

    results = []
    for b in buildings:
        f_cnt = len(b.floors)
        r_cnt = sum(len(f.racks) for f in b.floors)
        results.append(BuildingOut(
            id=b.id,
            code=b.code,
            name=b.name,
            address=b.address,
            location_id=b.location_id,
            location_name=b.location.name if b.location else "—",
            location_code=b.location.code if b.location else "—",
            floor_count=f_cnt,
            rack_count=r_cnt
        ))
    return results

@router.post("/buildings", response_model=BuildingOut)
def create_building(bldg_in: BuildingCreate, db: Session = Depends(get_db)):
    loc = db.query(Location).filter_by(id=bldg_in.location_id).first()
    if not loc:
        raise HTTPException(status_code=400, detail="Invalid location_id")

    bldg = Building(
        code=bldg_in.code.strip(),
        name=bldg_in.name.strip(),
        address=bldg_in.address or loc.address,
        location_id=loc.id
    )
    db.add(bldg)
    db.commit()
    db.refresh(bldg)

    # Automatically create default floor
    flr = Floor(
        building_id=bldg.id,
        floor_number="1/F",
        floor_name="Equipment Room"
    )
    db.add(flr)
    db.commit()

    return BuildingOut(
        id=bldg.id,
        code=bldg.code,
        name=bldg.name,
        address=bldg.address,
        location_id=bldg.location_id,
        location_name=loc.name,
        location_code=loc.code,
        floor_count=1,
        rack_count=0
    )

@router.put("/buildings/{id}", response_model=BuildingOut)
def update_building(id: int, bldg_in: BuildingUpdate, db: Session = Depends(get_db)):
    bldg = db.query(Building).filter_by(id=id).first()
    if not bldg:
        raise HTTPException(status_code=404, detail="Building not found")

    if bldg_in.code:
        bldg.code = bldg_in.code.strip()
    if bldg_in.name:
        bldg.name = bldg_in.name.strip()
    if bldg_in.address is not None:
        bldg.address = bldg_in.address
    if bldg_in.location_id:
        loc = db.query(Location).filter_by(id=bldg_in.location_id).first()
        if not loc:
            raise HTTPException(status_code=400, detail="Invalid location_id")
        bldg.location_id = bldg_in.location_id

    db.commit()
    db.refresh(bldg)

    f_cnt = len(bldg.floors)
    r_cnt = sum(len(f.racks) for f in bldg.floors)
    return BuildingOut(
        id=bldg.id,
        code=bldg.code,
        name=bldg.name,
        address=bldg.address,
        location_id=bldg.location_id,
        location_name=bldg.location.name if bldg.location else "—",
        location_code=bldg.location.code if bldg.location else "—",
        floor_count=f_cnt,
        rack_count=r_cnt
    )

@router.delete("/buildings/{id}")
def delete_building(id: int, db: Session = Depends(get_db)):
    bldg = db.query(Building).filter_by(id=id).first()
    if not bldg:
        raise HTTPException(status_code=404, detail="Building not found")
    
    # Check if racks have active assets
    for f in bldg.floors:
        for r in f.racks:
            cnt = db.query(Asset).filter(Asset.rack_id == r.id, Asset.is_deleted == False).count()
            if cnt > 0:
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot delete building '{bldg.name}' because rack '{r.rack_name}' contains {cnt} active assets. Relocate them first."
                )

    b_name = bldg.name
    db.delete(bldg)
    db.commit()
    return {"success": True, "message": f"Building '{b_name}' deleted successfully"}

# ==============================================================================
# 2. FLOORS CRUD (registered before /{id})
# ==============================================================================

@router.get("/floors/all", response_model=List[FloorOut])
def list_floors(
    building_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Floor)
    if building_id:
        query = query.filter(Floor.building_id == building_id)
    floors = query.all()

    results = []
    for flr in floors:
        b = flr.building
        loc = b.location if b else None
        results.append(FloorOut(
            id=flr.id,
            floor_number=flr.floor_number,
            floor_name=flr.floor_name,
            building_id=flr.building_id,
            building_name=b.name if b else "—",
            location_name=loc.name if loc else "—",
            location_code=loc.code if loc else "—",
            rack_count=len(flr.racks)
        ))
    return results

@router.post("/floors", response_model=FloorOut)
def create_floor(floor_in: FloorCreate, db: Session = Depends(get_db)):
    b = db.query(Building).filter_by(id=floor_in.building_id).first()
    if not b:
        raise HTTPException(status_code=400, detail="Invalid building_id")

    flr = Floor(
        building_id=b.id,
        floor_number=floor_in.floor_number.strip(),
        floor_name=floor_in.floor_name.strip() if floor_in.floor_name else f"Floor {floor_in.floor_number}"
    )
    db.add(flr)
    db.commit()
    db.refresh(flr)

    loc = b.location
    return FloorOut(
        id=flr.id,
        floor_number=flr.floor_number,
        floor_name=flr.floor_name,
        building_id=flr.building_id,
        building_name=b.name,
        location_name=loc.name if loc else "—",
        location_code=loc.code if loc else "—",
        rack_count=0
    )

@router.put("/floors/{id}", response_model=FloorOut)
def update_floor(id: int, floor_in: FloorUpdate, db: Session = Depends(get_db)):
    flr = db.query(Floor).filter_by(id=id).first()
    if not flr:
        raise HTTPException(status_code=404, detail="Floor not found")

    if floor_in.floor_number:
        flr.floor_number = floor_in.floor_number.strip()
    if floor_in.floor_name:
        flr.floor_name = floor_in.floor_name.strip()
    if floor_in.building_id:
        b = db.query(Building).filter_by(id=floor_in.building_id).first()
        if not b:
            raise HTTPException(status_code=400, detail="Invalid building_id")
        flr.building_id = floor_in.building_id

    db.commit()
    db.refresh(flr)

    b = flr.building
    loc = b.location if b else None
    return FloorOut(
        id=flr.id,
        floor_number=flr.floor_number,
        floor_name=flr.floor_name,
        building_id=flr.building_id,
        building_name=b.name if b else "—",
        location_name=loc.name if loc else "—",
        location_code=loc.code if loc else "—",
        rack_count=len(flr.racks)
    )

@router.delete("/floors/{id}")
def delete_floor(id: int, db: Session = Depends(get_db)):
    flr = db.query(Floor).filter_by(id=id).first()
    if not flr:
        raise HTTPException(status_code=404, detail="Floor not found")

    for r in flr.racks:
        cnt = db.query(Asset).filter(Asset.rack_id == r.id, Asset.is_deleted == False).count()
        if cnt > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete floor because rack '{r.rack_name}' contains {cnt} installed assets."
            )

    f_num = flr.floor_number
    db.delete(flr)
    db.commit()
    return {"success": True, "message": f"Floor '{f_num}' deleted successfully"}

# ==============================================================================
# 3. RACKS CRUD & 42U ELEVATION (registered before /{id})
# ==============================================================================

@router.get("/racks", response_model=List[RackOut])
def list_all_racks(
    floor_id: Optional[int] = Query(None),
    location_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Rack)
    if floor_id:
        query = query.filter(Rack.floor_id == floor_id)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Rack.rack_name.ilike(s),
                Rack.rack_number.ilike(s),
                Rack.room.ilike(s)
            )
        )
    racks = query.all()

    results = []
    for r in racks:
        f = r.floor
        b = f.building if f else None
        loc = b.location if b else None

        if location_id and loc and loc.id != location_id:
            continue

        asset_cnt = db.query(Asset).filter(Asset.rack_id == r.id, Asset.is_deleted == False).count()
        total_u = r.total_u or 42
        results.append(RackOut(
            id=r.id,
            rack_name=r.rack_name,
            rack_number=r.rack_number,
            room=r.room,
            total_u=total_u,
            power_feed=r.power_feed,
            max_power_kw=r.max_power_kw,
            floor_id=r.floor_id,
            floor_name=f.floor_number if f else "—",
            building_name=b.name if b else "—",
            location_name=loc.name if loc else "—",
            location_code=loc.code if loc else "—",
            asset_count=asset_cnt,
            occupied_u=asset_cnt,
            available_u=max(0, total_u - asset_cnt),
            utilization_pct=round((asset_cnt / total_u) * 100, 1)
        ))
    return results

@router.get("/racks/{id}/elevation", response_model=RackElevationOut)
def get_rack_elevation(id: int, db: Session = Depends(get_db)):
    rack = db.query(Rack).filter_by(id=id).first()
    if not rack:
        raise HTTPException(status_code=404, detail="Rack not found")

    rack_out = format_rack_out(rack, db)
    total_u = rack.total_u or 42

    # Query all active assets assigned to this rack
    assets = db.query(Asset).filter(
        Asset.rack_id == rack.id,
        Asset.is_deleted == False
    ).all()

    # Map position to asset
    occupied_positions = {}
    for idx, a in enumerate(assets):
        pos_num = None
        if a.rack_position and str(a.rack_position).upper().startswith("U"):
            try:
                pos_num = int(str(a.rack_position)[1:].split("-")[0].strip())
            except Exception:
                pos_num = None
        
        # Fallback allocation if position string is non-standard
        if not pos_num or pos_num < 1 or pos_num > total_u or pos_num in occupied_positions:
            pos_num = (42 - (idx * 2)) % total_u
            if pos_num <= 0:
                pos_num = idx + 1

        occupied_positions[pos_num] = a

    # Build 1..total_u array (descending from total_u down to 1)
    unit_items: List[RackUnitItem] = []
    for u in range(total_u, 0, -1):
        if u in occupied_positions:
            ast = occupied_positions[u]
            unit_items.append(RackUnitItem(
                u_position=u,
                is_occupied=True,
                asset_id=ast.asset_id,
                hostname=ast.hostname,
                device_name=ast.device_name or f"{ast.manufacturer} {ast.hostname}",
                model_name=ast.model.model_name if ast.model else ast.device_name,
                manufacturer=ast.manufacturer,
                category=ast.category.name if ast.category else "Switch",
                operational_status=ast.operational_status,
                management_ip=ast.management_ip,
                rack_units=ast.model.rack_units if ast.model else 1
            ))
        else:
            unit_items.append(RackUnitItem(
                u_position=u,
                is_occupied=False
            ))

    return RackElevationOut(
        rack=rack_out,
        units=unit_items
    )

@router.get("/racks/{id}", response_model=RackOut)
def get_rack_detail(id: int, db: Session = Depends(get_db)):
    r = db.query(Rack).filter_by(id=id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Rack not found")
    return format_rack_out(r, db)

@router.post("/racks", response_model=RackOut)
def create_rack(rack_in: RackCreate, db: Session = Depends(get_db)):
    floor_id = rack_in.floor_id
    if not floor_id:
        default_floor = db.query(Floor).first()
        if not default_floor:
            raise HTTPException(status_code=400, detail="Please create a site, building, and floor before adding racks")
        floor_id = default_floor.id
    else:
        if not db.query(Floor).filter_by(id=floor_id).first():
            raise HTTPException(status_code=400, detail="Invalid floor_id")

    rack = Rack(
        floor_id=floor_id,
        rack_name=rack_in.rack_name.strip(),
        rack_number=rack_in.rack_number.strip() if rack_in.rack_number else f"RK-{rack_in.rack_name.replace(' ', '')}",
        room=rack_in.room or "Main Server Hall",
        total_u=rack_in.total_u or 42,
        power_feed=rack_in.power_feed or "Dual A+B Redundant (32A)",
        max_power_kw=rack_in.max_power_kw or "10kW"
    )
    db.add(rack)
    db.commit()
    db.refresh(rack)

    return format_rack_out(rack, db)

@router.put("/racks/{id}", response_model=RackOut)
def update_rack(id: int, rack_in: RackUpdate, db: Session = Depends(get_db)):
    rack = db.query(Rack).filter_by(id=id).first()
    if not rack:
        raise HTTPException(status_code=404, detail="Rack not found")

    if rack_in.rack_name:
        rack.rack_name = rack_in.rack_name.strip()
    if rack_in.rack_number:
        rack.rack_number = rack_in.rack_number.strip()
    if rack_in.room:
        rack.room = rack_in.room.strip()
    if rack_in.total_u is not None:
        rack.total_u = rack_in.total_u
    if rack_in.power_feed:
        rack.power_feed = rack_in.power_feed.strip()
    if rack_in.max_power_kw:
        rack.max_power_kw = rack_in.max_power_kw.strip()
    if rack_in.floor_id:
        if not db.query(Floor).filter_by(id=rack_in.floor_id).first():
            raise HTTPException(status_code=400, detail="Invalid floor_id")
        rack.floor_id = rack_in.floor_id

    db.commit()
    db.refresh(rack)
    return format_rack_out(rack, db)

@router.delete("/racks/{id}")
def delete_rack(id: int, db: Session = Depends(get_db)):
    rack = db.query(Rack).filter_by(id=id).first()
    if not rack:
        raise HTTPException(status_code=404, detail="Rack not found")

    asset_cnt = db.query(Asset).filter(Asset.rack_id == rack.id, Asset.is_deleted == False).count()
    if asset_cnt > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete rack '{rack.rack_name}' because {asset_cnt} active assets are installed in it. Please relocate assets first."
        )

    r_name = rack.rack_name
    db.delete(rack)
    db.commit()
    return {"success": True, "message": f"Rack '{r_name}' deleted successfully"}

# ==============================================================================
# 4. SITES & DATA CENTERS (LOCATIONS)
# ==============================================================================

@router.get("", response_model=List[LocationOut])
def list_locations(
    type_filter: Optional[str] = Query(None, alias="type"),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Location)
    if type_filter:
        query = query.filter(Location.type == type_filter)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Location.name.ilike(s),
                Location.code.ilike(s),
                Location.address.ilike(s),
                Location.contact_person.ilike(s)
            )
        )
    locations = query.order_by(Location.code).all()
    return [format_location_out(loc, db) for loc in locations]

@router.post("", response_model=LocationOut)
def create_location(loc_in: LocationCreate, db: Session = Depends(get_db)):
    existing = db.query(Location).filter(Location.code == loc_in.code.strip().upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Location code '{loc_in.code}' already exists")
    
    loc = Location(
        code=loc_in.code.strip().upper(),
        name=loc_in.name.strip(),
        type=loc_in.type or "Data Center",
        country=loc_in.country or "Hong Kong",
        city=loc_in.city or "Hong Kong",
        address=loc_in.address,
        contact_person=loc_in.contact_person,
        contact_phone=loc_in.contact_phone,
        contact_email=loc_in.contact_email
    )
    db.add(loc)
    db.commit()
    db.refresh(loc)

    # Automatically create default primary building and floor so racks can be added immediately
    bldg = Building(
        location_id=loc.id,
        code=f"{loc.code}-B1",
        name=f"{loc.name} Main Building",
        address=loc.address
    )
    db.add(bldg)
    db.flush()

    flr = Floor(
        building_id=bldg.id,
        floor_number="1/F" if "DC" not in loc.type else "7/F",
        floor_name="Main Equipment Hall"
    )
    db.add(flr)
    db.commit()

    return format_location_out(loc, db)

@router.get("/{id}", response_model=LocationOut)
def get_location_detail(id: int, db: Session = Depends(get_db)):
    loc = db.query(Location).filter_by(id=id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")
    return format_location_out(loc, db)

@router.put("/{id}", response_model=LocationOut)
def update_location(id: int, loc_in: LocationUpdate, db: Session = Depends(get_db)):
    loc = db.query(Location).filter_by(id=id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")
    
    if loc_in.code and loc_in.code.strip().upper() != loc.code:
        conflict = db.query(Location).filter(Location.code == loc_in.code.strip().upper(), Location.id != id).first()
        if conflict:
            raise HTTPException(status_code=400, detail=f"Location code '{loc_in.code}' already in use")
        loc.code = loc_in.code.strip().upper()

    if loc_in.name:
        loc.name = loc_in.name.strip()
    if loc_in.type:
        loc.type = loc_in.type.strip()
    if loc_in.country:
        loc.country = loc_in.country.strip()
    if loc_in.city:
        loc.city = loc_in.city.strip()
    if loc_in.address is not None:
        loc.address = loc_in.address
    if loc_in.contact_person is not None:
        loc.contact_person = loc_in.contact_person
    if loc_in.contact_phone is not None:
        loc.contact_phone = loc_in.contact_phone
    if loc_in.contact_email is not None:
        loc.contact_email = loc_in.contact_email

    db.commit()
    db.refresh(loc)
    return format_location_out(loc, db)

@router.delete("/{id}")
def delete_location(id: int, db: Session = Depends(get_db)):
    loc = db.query(Location).filter_by(id=id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")
    
    # Check if assets are currently deployed here
    asset_cnt = db.query(Asset).filter(Asset.location_id == loc.id, Asset.is_deleted == False).count()
    if asset_cnt > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete location '{loc.name}' because {asset_cnt} active assets are deployed here. Reassign assets first."
        )

    loc_name = loc.name
    db.delete(loc)
    db.commit()
    return {"success": True, "message": f"Location '{loc_name}' deleted successfully"}
