import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Date, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"
    id = Column(Integer, primary_key=True, index=True)
    ticket_number = Column(String(50), unique=True, nullable=False, index=True)  # MNT-2025-0891
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    maintenance_type = Column(String(50), nullable=False)  # Preventive Maintenance, Corrective Maintenance, Emergency Repair, Hardware Replacement, Firmware Upgrade
    reported_date = Column(DateTime, default=datetime.datetime.utcnow)
    scheduled_date = Column(DateTime, nullable=True)
    completion_date = Column(DateTime, nullable=True)
    technician = Column(String(100), default="Certified Network Engineer")
    vendor_id = Column(Integer, ForeignKey("vendors.id", ondelete="SET NULL"), nullable=True)
    description = Column(Text, nullable=False)
    root_cause = Column(Text, nullable=True)
    resolution = Column(Text, nullable=True)
    downtime_minutes = Column(Integer, default=0)
    cost = Column(Numeric(10, 2), default=0.00)
    currency = Column(String(10), default="HKD")
    status = Column(String(50), default="In Progress")  # Scheduled, In Progress, Completed, Cancelled
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    asset = relationship("Asset", back_populates="maintenance_records")
    vendor = relationship("Vendor")

