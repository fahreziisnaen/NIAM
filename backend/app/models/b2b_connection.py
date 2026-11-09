import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Date
from app.db.session import Base

class B2BConnection(Base):
    __tablename__ = "b2b_connections"

    id = Column(Integer, primary_key=True, index=True)
    profile_name = Column(String(100), unique=True, nullable=False, index=True)  # B2B Connection Profile
    company_name = Column(String(150), nullable=False, index=True)               # B2B Company Name
    connection_type = Column(String(20), nullable=False, index=True)             # VPN / Metro
    
    # VPN specific field
    vpn_peer_ip = Column(String(50), nullable=True)                              # VPN Peer IP
    
    # Metro specific fields
    metro_circuit_id = Column(String(100), nullable=True, index=True)           # Metro Circuit ID
    metro_vlan_id = Column(Integer, nullable=True)                               # Metro VlanID (IT Dept use only)
    metro_registration_owner = Column(String(50), nullable=True)                # Metro Registration Owner (PSHK / B2B Company)
    
    # Contract expiration
    contract_expiry_date = Column(Date, nullable=True, index=True)               # Contract Expiry Date (Provided by B2B Team)
    
    # Additional operational fields
    bandwidth = Column(String(50), nullable=True)                                # e.g. 1 Gbps, 100 Mbps
    status = Column(String(30), default="Active", index=True)                    # Active, Expiring Soon, Expired, Suspended, Provisioning
    service_type = Column(String(50), nullable=True)                            # FIX Protocol, Market Data Feed, Order Routing, Custody
    contact_person = Column(String(100), nullable=True)                          # B2B Team / Partner PIC
    contact_email = Column(String(100), nullable=True)                           # Partner Contact Email
    notes = Column(Text, nullable=True)                                          # IT Dept routing remarks, BGP ASN, etc.
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

