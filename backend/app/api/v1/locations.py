from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.location import Location, Building, Floor, Rack
from app.models.asset import Asset
from app.schemas.location import LocationCreate, LocationOut, RackOut

router = APIRouter(prefix="/locations", tags=["Location & Datacenter Management"])

@router.get("", response_model=List[LocationOut])
def list_locations(db: Session = Depends(get_db)):
    locations = db.query(Location).all()
    results = []
    for loc in locations:
        racks_out = []
        for b in loc.buildings:
            for f in b.floors:
                for r in f.racks:
                    asset_cnt = db.query(Asset).filter(Asset.rack_id == r.id, Asset.is_deleted == False).count()
                    racks_out.append(RackOut(
                        id=r.id,
                        rack_name=r.rack_name,
                        rack_number=r.rack_number,
                        room=r.room,
                        total_u=r.total_u,
                        power_feed=r.power_feed,
                        asset_count=asset_cnt
                    ))

        asset_count = db.query(Asset).filter(Asset.location_id == loc.id, Asset.is_deleted == False).count()
        results.append(LocationOut(
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
            rack_count=len(racks_out),
            racks=racks_out
        ))
    return results

@router.get("/racks", response_model=List[RackOut])
def list_all_racks(db: Session = Depends(get_db)):
    racks = db.query(Rack).all()
    results = []
    for r in racks:
        asset_cnt = db.query(Asset).filter(Asset.rack_id == r.id, Asset.is_deleted == False).count()
        results.append(RackOut(
            id=r.id,
            rack_name=r.rack_name,
            rack_number=r.rack_number,
            room=r.room,
            total_u=r.total_u,
            power_feed=r.power_feed,
            asset_count=asset_cnt
        ))
    return results

