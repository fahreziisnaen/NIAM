import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

class Location(Base):
    """Site level: Headquarters, Data Centers, Branch Offices, DR Site"""
    __tablename__ = "locations"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)  # HK-DC1, HK-DC2, HK-HQ, HK-ADM, HK-KLN, HK-DR
    name = Column(String(200), nullable=False)
    type = Column(String(50), default="Data Center")  # Data Center, Headquarters, Branch Office, Disaster Recovery Site, Network Room
    country = Column(String(50), default="Hong Kong")
    city = Column(String(50), default="Hong Kong")
    address = Column(Text, nullable=True)
    contact_person = Column(String(100), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    contact_email = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    buildings = relationship("Building", back_populates="location", cascade="all, delete-orphan")
    assets = relationship("Asset", back_populates="location")
    vlans = relationship("VLAN", back_populates="location")

class Building(Base):
    __tablename__ = "buildings"
    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False)
    code = Column(String(50), nullable=False)
    name = Column(String(200), nullable=False)
    address = Column(Text, nullable=True)

    location = relationship("Location", back_populates="buildings")
    floors = relationship("Floor", back_populates="building", cascade="all, delete-orphan")

class Floor(Base):
    __tablename__ = "floors"
    id = Column(Integer, primary_key=True, index=True)
    building_id = Column(Integer, ForeignKey("buildings.id", ondelete="CASCADE"), nullable=False)
    floor_number = Column(String(20), nullable=False)
    floor_name = Column(String(100), nullable=True)

    building = relationship("Building", back_populates="floors")
    racks = relationship("Rack", back_populates="floor", cascade="all, delete-orphan")

class Rack(Base):
    __tablename__ = "racks"
    id = Column(Integer, primary_key=True, index=True)
    floor_id = Column(Integer, ForeignKey("floors.id", ondelete="CASCADE"), nullable=True)
    rack_name = Column(String(50), nullable=False, index=True)  # Rack A1, Rack A2, Rack B1, etc.
    rack_number = Column(String(50), nullable=True)
    room = Column(String(100), default="Server Room")  # Main Server Hall, MDF Room, IDF Closet
    total_u = Column(Integer, default=42)  # 42U rack
    power_feed = Column(String(50), default="", nullable=True)
    max_power_kw = Column(String(20), default="", nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    floor = relationship("Floor", back_populates="racks")
    assets = relationship("Asset", back_populates="rack")

