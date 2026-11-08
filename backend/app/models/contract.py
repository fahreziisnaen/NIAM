import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Date, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

class AssetContract(Base):
    __tablename__ = "asset_contracts"
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    contract_id = Column(Integer, ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False, index=True)
    coverage_notes = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    asset = relationship("Asset", back_populates="contract_associations")
    contract = relationship("Contract", back_populates="asset_associations")

class Contract(Base):
    __tablename__ = "contracts"
    id = Column(Integer, primary_key=True, index=True)
    contract_number = Column(String(100), unique=True, nullable=False, index=True)
    contract_name = Column(String(255), nullable=False)
    contract_type = Column(String(100), nullable=False)  # Purchase Contract, Rental Agreement, Leasing Agreement, Maintenance Contract, Hardware Support Contract, Software Subscription, Managed Service Agreement
    vendor_id = Column(Integer, ForeignKey("vendors.id", ondelete="SET NULL"), nullable=True)
    contract_owner = Column(String(100), default="IT Infrastructure Team")
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False, index=True)
    contract_value = Column(Numeric(12, 2), default=0.00)
    currency = Column(String(10), default="HKD")
    payment_terms = Column(String(100), default="Annual Advance / Net 30")
    sla = Column(String(100), default="24x7x4hr On-site Response")
    support_level = Column(String(100), default="Mission Critical Enterprise Support")
    renewal_terms = Column(Text, nullable=True)
    status = Column(String(50), default="Active")  # Active, Expiring Soon, Expired, Terminated
    document_url = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    vendor = relationship("Vendor", back_populates="contracts")
    asset_associations = relationship("AssetContract", back_populates="contract", cascade="all, delete-orphan")

class Warranty(Base):
    __tablename__ = "warranties"
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    provider = Column(String(100), nullable=False)  # Cisco SMARTnet, Palo Alto Premium Support, etc.
    reference_no = Column(String(100), nullable=True)
    start_date = Column(Date, nullable=False)
    expiration_date = Column(Date, nullable=False, index=True)
    support_coverage = Column(String(100), default="24x7x4 TAC Support + Next Business Day Replacement")
    status = Column(String(50), default="Active")  # Active, Expiring Soon, Expired
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    asset = relationship("Asset", back_populates="warranties")

