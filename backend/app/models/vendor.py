import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from app.db.session import Base

class Vendor(Base):
    __tablename__ = "vendors"
    id = Column(Integer, primary_key=True, index=True)
    vendor_code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(200), nullable=False, index=True)
    category = Column(String(100), default="Hardware Provider")  # Network Hardware, Security, Telecom, Cloud, Maintenance
    manufacturer = Column(String(100), nullable=True)  # Cisco, Palo Alto, Fortinet, Huawei, etc.
    primary_contact = Column(String(100), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    country = Column(String(50), default="Hong Kong")
    support_contact = Column(String(100), nullable=True)
    support_email = Column(String(255), nullable=True)
    support_hotline = Column(String(50), nullable=True)
    website = Column(String(255), nullable=True)
    status = Column(String(50), default="Active")  # Active, Preferred, Under Review, Inactive
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    assets = relationship("Asset", back_populates="vendor")
    contracts = relationship("Contract", back_populates="vendor")
    spare_parts = relationship("SparePart", back_populates="vendor")

