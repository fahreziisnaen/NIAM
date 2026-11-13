import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Date, Numeric, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.db.session import Base

class DeviceCategory(Base):
    __tablename__ = "device_categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)  # Switch, Router, Firewall, Wireless AP, Controller, Load Balancer, Other
    code = Column(String(50), unique=True, nullable=False)
    icon = Column(String(50), default="Server")
    description = Column(String(255), nullable=True)

    models = relationship("DeviceModel", back_populates="category")
    assets = relationship("Asset", back_populates="category")

class DeviceModel(Base):
    __tablename__ = "device_models"
    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(100), unique=True, nullable=False, index=True)  # C9300-48P, ISR4431, PA-3220, FortiGate 100F, S5735-L48T4S, C9130AXI
    manufacturer = Column(String(100), nullable=False, index=True)  # Cisco, Palo Alto, Fortinet, Huawei, Aruba, Juniper
    category_id = Column(Integer, ForeignKey("device_categories.id", ondelete="SET NULL"), nullable=True)
    hardware_revision = Column(String(50), default="V01")
    total_ports = Column(Integer, default=48)
    rack_units = Column(Integer, default=1)
    end_of_life_date = Column(Date, nullable=True)
    end_of_support_date = Column(Date, nullable=True)
    description = Column(Text, nullable=True)

    category = relationship("DeviceCategory", back_populates="models")
    assets = relationship("Asset", back_populates="model")

class OwnershipType(Base):
    __tablename__ = "ownership_types"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False)  # COMPANY, RENTAL, LEASED, VENDOR, CUSTOMER
    name = Column(String(100), nullable=False)  # Company Owned, Rental, Leased, Vendor Provided, Customer Owned
    description = Column(String(255), nullable=True)

    assets = relationship("Asset", back_populates="ownership")

class Asset(Base):
    __tablename__ = "assets"
    id = Column(Integer, primary_key=True, index=True)

    # 1. Identification
    asset_id = Column(String(50), unique=True, nullable=False, index=True)  # NA-000123
    hostname = Column(String(100), unique=True, nullable=False, index=True)  # FW-01-HK
    serial_number = Column(String(100), unique=True, nullable=False, index=True)  # 8F3D1A00234
    asset_tag = Column(String(100), unique=True, nullable=True)
    device_name = Column(String(150), nullable=True)
    description = Column(Text, nullable=True)

    # 2. Hardware
    manufacturer = Column(String(100), nullable=False, index=True)  # Palo Alto, Cisco, Huawei, Fortinet
    vendor_id = Column(Integer, ForeignKey("vendors.id", ondelete="SET NULL"), nullable=True)
    model_id = Column(Integer, ForeignKey("device_models.id", ondelete="SET NULL"), nullable=True)
    hardware_revision = Column(String(50), default="1.0")
    category_id = Column(Integer, ForeignKey("device_categories.id", ondelete="SET NULL"), nullable=True)
    device_type = Column(String(50), default="Network Device")
    device_role = Column(String(50), default="Core / Edge")  # Core, Distribution, Access, Perimeter, Edge, Internal

    # 3. Ownership & Rental
    ownership_type_id = Column(Integer, ForeignKey("ownership_types.id", ondelete="SET NULL"), nullable=True)
    ownership_type = Column(String(50), default="Company Owned")  # Company Owned, Rental, Leased, Vendor Provided, Customer Owned
    rental_provider = Column(String(150), nullable=True)  # e.g. HKT Enterprise Solutions, PCCW, Cisco Capital
    rental_agreement_ref = Column(String(100), nullable=True)
    rental_start_date = Column(Date, nullable=True)
    rental_end_date = Column(Date, nullable=True)
    monthly_rental_cost = Column(Numeric(10, 2), default=0.00)
    total_rental_cost = Column(Numeric(12, 2), default=0.00)
    return_conditions = Column(Text, nullable=True)
    return_date = Column(Date, nullable=True)
    renewal_status = Column(String(50), default="Standard Renewal Option")

    # 4. Procurement
    po_number = Column(String(100), nullable=True)
    purchase_date = Column(Date, nullable=True)
    purchase_price = Column(Numeric(12, 2), default=0.00)
    currency = Column(String(10), default="HKD")
    supplier = Column(String(150), nullable=True)
    invoice_number = Column(String(100), nullable=True)
    procurement_reference = Column(String(100), nullable=True)

    # 5. Technical Information
    management_ip = Column(String(50), nullable=True, index=True)
    mac_address = Column(String(50), nullable=True)
    firmware_version = Column(String(100), default="10.2.4-h2")
    operating_system = Column(String(100), default="PAN-OS / Cisco IOS-XE")
    software_version = Column(String(100), nullable=True)
    device_config_ref = Column(String(255), nullable=True)
    management_protocol = Column(String(50), default="SSH / HTTPS / SNMPv3")

    # 6. Location
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="SET NULL"), nullable=True)
    building_id = Column(Integer, ForeignKey("buildings.id", ondelete="SET NULL"), nullable=True)
    floor_id = Column(Integer, ForeignKey("floors.id", ondelete="SET NULL"), nullable=True)
    rack_id = Column(Integer, ForeignKey("racks.id", ondelete="SET NULL"), nullable=True)
    rack_position = Column(String(50), nullable=True)  # e.g. U36-U38, U20, Ceiling
    location_display = Column(String(100), nullable=True)  # HK-DC1 / Rack A1

    # 7. Network Configuration
    vlan = Column(String(50), nullable=True)
    subnet = Column(String(50), nullable=True)
    default_gateway = Column(String(50), nullable=True)
    network_segment = Column(String(100), nullable=True)
    connected_device = Column(String(100), nullable=True)
    uplink_port = Column(String(100), nullable=True)
    interface_info = Column(Text, nullable=True)

    # 8. Lifecycle
    acquisition_date = Column(Date, nullable=True)
    deployment_date = Column(Date, nullable=True)
    operational_status = Column(String(50), default="Deployed", index=True)  # In Stock, Deployed, In Maintenance, Under Repair, Reserved, Returned to Vendor, Decommissioned, Disposed
    asset_condition = Column(String(50), default="Operational")  # Operational, Minor Issue, Maintenance Required, End of Life
    end_of_life_date = Column(Date, nullable=True)
    end_of_support_date = Column(Date, nullable=True)
    decommission_date = Column(Date, nullable=True)

    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    vendor = relationship("Vendor", back_populates="assets")
    model = relationship("DeviceModel", back_populates="assets")
    category = relationship("DeviceCategory", back_populates="assets")
    ownership = relationship("OwnershipType", back_populates="assets")
    location = relationship("Location", back_populates="assets")
    rack = relationship("Rack", back_populates="assets")

    contract_associations = relationship("AssetContract", back_populates="asset", cascade="all, delete-orphan")
    warranties = relationship("Warranty", back_populates="asset", cascade="all, delete-orphan")
    interfaces = relationship("NetworkInterface", back_populates="asset", cascade="all, delete-orphan")
    maintenance_records = relationship("MaintenanceRecord", back_populates="asset", cascade="all, delete-orphan")
    documents = relationship("AssetDocument", back_populates="asset", cascade="all, delete-orphan")
    history = relationship("AssetHistory", back_populates="asset", cascade="all, delete-orphan")

class NetworkInterface(Base):
    __tablename__ = "network_interfaces"
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(50), nullable=False)  # GigabitEthernet1/0/1, TenGigE0/0/0, eth0
    mac_address = Column(String(50), nullable=True)
    ip_address = Column(String(50), nullable=True)
    speed_gbps = Column(String(20), default="10 Gbps")
    duplex = Column(String(20), default="Full")
    vlan_id = Column(Integer, nullable=True)
    status = Column(String(20), default="Up")  # Up, Down, Admin Down
    uplink_target = Column(String(100), nullable=True)
    uplink_port = Column(String(50), nullable=True)

    asset = relationship("Asset", back_populates="interfaces")

class AssetDocument(Base):
    __tablename__ = "asset_documents"
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=True)
    contract_id = Column(Integer, ForeignKey("contracts.id", ondelete="CASCADE"), nullable=True)
    document_type = Column(String(100), default="Datasheet")  # Datasheet, Purchase Invoice, Purchase Order, Warranty Certificate, Rental Agreement, Configuration Backup, Supporting Document
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size_kb = Column(Integer, default=0)
    uploaded_by = Column(String(100), default="System Admin")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    asset = relationship("Asset", back_populates="documents")

class AssetHistory(Base):
    __tablename__ = "asset_history"
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)
    action = Column(String(50), default="STATUS_CHANGE")  # CREATED, STATUS_CHANGE, LOCATION_CHANGE, MAINTENANCE, FIRMWARE_UPDATE
    field_name = Column(String(100), nullable=True)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    changed_by = Column(String(100), default="Admin User")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    asset = relationship("Asset", back_populates="history")

