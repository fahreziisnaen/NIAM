import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

class SparePart(Base):
    __tablename__ = "spare_parts"
    id = Column(Integer, primary_key=True, index=True)
    part_number = Column(String(100), unique=True, nullable=False, index=True)  # SFP-10G-SR, PWR-C1-715WAC, etc.
    name = Column(String(200), nullable=False)
    category = Column(String(100), nullable=False)  # SFP Modules, Power Supplies, Network Modules, Transceivers, Cables, Optics, Spare Switches, Spare Routers, Spare Firewalls
    vendor_id = Column(Integer, ForeignKey("vendors.id", ondelete="SET NULL"), nullable=True)
    quantity = Column(Integer, default=0)
    min_stock_level = Column(Integer, default=5)
    unit_cost = Column(Numeric(10, 2), default=0.00)
    currency = Column(String(10), default="HKD")
    stock_location = Column(String(100), default="HK-DC1 Storage Room B")  # HK-DC1, HK-DC2, Central HQ Spares Locker
    status = Column(String(50), default="In Stock")  # In Stock, Low Stock, Out of Stock
    compatibility = Column(String(255), nullable=True)  # Compatible with Cisco C9300, Nexus 9K
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    vendor = relationship("Vendor", back_populates="spare_parts")
    transactions = relationship("SpareStockTransaction", back_populates="spare_part", cascade="all, delete-orphan")

class SpareStockTransaction(Base):
    __tablename__ = "spare_stock_transactions"
    id = Column(Integer, primary_key=True, index=True)
    spare_part_id = Column(Integer, ForeignKey("spare_parts.id", ondelete="CASCADE"), nullable=False)
    transaction_type = Column(String(50), nullable=False)  # Check-in, Check-out, Site Transfer, Inventory Count
    quantity = Column(Integer, nullable=False)
    destination_asset_id = Column(Integer, ForeignKey("assets.id", ondelete="SET NULL"), nullable=True)
    technician = Column(String(100), default="IT Logistics")
    reference_ticket = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    spare_part = relationship("SparePart", back_populates="transactions")

