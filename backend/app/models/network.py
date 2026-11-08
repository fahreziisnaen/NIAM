import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.db.session import Base

class VLAN(Base):
    __tablename__ = "vlans"
    id = Column(Integer, primary_key=True, index=True)
    vlan_id = Column(Integer, unique=True, nullable=False, index=True)  # e.g. 100, 200, 300
    name = Column(String(100), nullable=False)  # Trading Network, Management VLAN, DMZ, Voice
    subnet = Column(String(50), nullable=False)  # 10.200.10.0/24
    gateway = Column(String(50), nullable=False)  # 10.200.10.1
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="SET NULL"), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    location = relationship("Location", back_populates="vlans")
    ip_addresses = relationship("IPAddress", back_populates="vlan")

class IPAddress(Base):
    __tablename__ = "ip_addresses"
    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String(50), unique=True, nullable=False, index=True)  # 10.200.10.25
    ip_version = Column(String(10), default="IPv4")  # IPv4, IPv6
    subnet = Column(String(50), nullable=False)  # 10.200.10.0/24
    vlan_id = Column(Integer, ForeignKey("vlans.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(20), default="Available", index=True)  # Available, Assigned, Reserved, Deprecated
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="SET NULL"), nullable=True)
    hostname = Column(String(100), nullable=True)
    mac_address = Column(String(50), nullable=True)
    interface_name = Column(String(50), nullable=True)
    description = Column(String(255), nullable=True)
    assigned_date = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    vlan = relationship("VLAN", back_populates="ip_addresses")

class NetworkConnection(Base):
    __tablename__ = "network_connections"
    id = Column(Integer, primary_key=True, index=True)
    source_asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    source_port = Column(String(50), nullable=False)  # Te1/0/1, Port 1, Eth1/1
    target_asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    target_port = Column(String(50), nullable=False)  # Te1/0/48, Uplink-01
    connection_type = Column(String(50), default="10G Fiber SFP+")  # 100G QSFP28, 40G QSFP+, 10G Fiber, 1G Copper, Trunk, Access, LAG
    bandwidth_gbps = Column(String(20), default="10 Gbps")
    status = Column(String(20), default="Active")  # Active, Standby, Degraded, Inactive
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    source_asset = relationship("Asset", foreign_keys=[source_asset_id])
    target_asset = relationship("Asset", foreign_keys=[target_asset_id])

