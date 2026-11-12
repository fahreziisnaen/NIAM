import os
import datetime
from datetime import date, timedelta
from sqlalchemy.orm import Session
from app.db.session import engine, SessionLocal, Base
from app.models.b2b_connection import B2BConnection

def seed_b2b_connections(db: Session = None):
    seed_demo = os.getenv("SEED_DEMO_DATA", "true").lower() in ["true", "1", "yes"]
    if not seed_demo:
        print("[B2B Seed] SEED_DEMO_DATA is false. Skipping B2B connections demo seed.")
        return

    close_at_end = False
    if db is None:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        close_at_end = True

    try:
        existing_count = db.query(B2BConnection).count()
        if existing_count > 0:
            print(f"[B2B Seed] Already {existing_count} B2B Connections in database. Skipping seed.")
            return

        print("[B2B Seed] Populating realistic B2B Connection Profiles for Phillip Securities HK...")
        today = date.today()

        sample_b2b = [
            {
                "profile_name": "B2B-HKEX-OCG-PRI",
                "company_name": "Hong Kong Exchanges and Clearing (HKEX)",
                "connection_type": "Metro",
                "vpn_peer_ip": None,
                "metro_circuit_id": "HKT-MTR-892110-OCG",
                "metro_vlan_id": 410,
                "metro_registration_owner": "PSHK",
                "contract_expiry_date": today + timedelta(days=245),
                "bandwidth": "1 Gbps",
                "status": "Active",
                "service_type": "HKEX Orion Central Gateway (OCG) Trading",
                "contact_person": "HKEX Participant Support",
                "contact_email": "support@hkex.com.hk",
                "notes": "Primary ultra-low latency direct trading link terminated on Core-SW-01-HK (Central HQ)."
            },
            {
                "profile_name": "B2B-HKEX-OMD-SEC",
                "company_name": "Hong Kong Exchanges and Clearing (HKEX)",
                "connection_type": "Metro",
                "vpn_peer_ip": None,
                "metro_circuit_id": "PCCW-MTR-40291-OMD",
                "metro_vlan_id": 412,
                "metro_registration_owner": "PSHK",
                "contract_expiry_date": today + timedelta(days=245),
                "bandwidth": "1 Gbps",
                "status": "Active",
                "service_type": "HKEX Orion Market Data (OMD) Feed",
                "contact_person": "HKEX Participant Support",
                "contact_email": "support@hkex.com.hk",
                "notes": "Secondary multicast market data feed terminated on Core-SW-02-HK."
            },
            {
                "profile_name": "B2B-BLOOMBERG-BPIPE",
                "company_name": "Bloomberg L.P.",
                "connection_type": "Metro",
                "vpn_peer_ip": None,
                "metro_circuit_id": "HKBN-MTR-671204-BBG",
                "metro_vlan_id": 520,
                "metro_registration_owner": "PSHK",
                "contract_expiry_date": today + timedelta(days=310),
                "bandwidth": "500 Mbps",
                "status": "Active",
                "service_type": "B-PIPE Real-time Market Data & EMSX",
                "contact_person": "Bloomberg Enterprise Support",
                "contact_email": "apac-support@bloomberg.net",
                "notes": "Direct carrier cross-connect at Mega-i Chai Wan Data Center."
            },
            {
                "profile_name": "B2B-HSBC-FIX-TRADING",
                "company_name": "HSBC Global Banking and Markets",
                "connection_type": "Metro",
                "vpn_peer_ip": None,
                "metro_circuit_id": "HKT-MTR-772910-HSBC",
                "metro_vlan_id": 615,
                "metro_registration_owner": "B2B Company",
                "contract_expiry_date": today + timedelta(days=35),
                "bandwidth": "100 Mbps",
                "status": "Expiring Soon",
                "service_type": "FIX 4.4 Institutional Equity Trading",
                "contact_person": "HSBC Connectivity Desk",
                "contact_email": "connectivity@hsbc.com.hk",
                "notes": "Circuit registered & paid by HSBC. PSHK terminates on Edge-FW-01."
            },
            {
                "profile_name": "B2B-MORGAN-STANLEY",
                "company_name": "Morgan Stanley Asia Ltd",
                "connection_type": "VPN",
                "vpn_peer_ip": "203.198.77.42",
                "metro_circuit_id": None,
                "metro_vlan_id": None,
                "metro_registration_owner": None,
                "contract_expiry_date": today + timedelta(days=180),
                "bandwidth": "100 Mbps",
                "status": "Active",
                "service_type": "Algorithmic DMA Order Routing",
                "contact_person": "MS Onboarding Team",
                "contact_email": "b2b-asia@morganstanley.com",
                "notes": "IPsec IKEv2 AES-256 with pre-shared key. Terminated on FortiGate-01."
            },
            {
                "profile_name": "B2B-GOLDMAN-SACHS",
                "company_name": "Goldman Sachs (Asia) L.L.C.",
                "connection_type": "Metro",
                "vpn_peer_ip": None,
                "metro_circuit_id": "HKT-MTR-994102-GS",
                "metro_vlan_id": 630,
                "metro_registration_owner": "PSHK",
                "contract_expiry_date": today + timedelta(days=420),
                "bandwidth": "1 Gbps",
                "status": "Active",
                "service_type": "FIX Drop Copy & Principal Clearing",
                "contact_person": "GS Electronic Trading",
                "contact_email": "et-support@gs.com",
                "notes": "Direct metro loop from Central HQ to Cheung Kong Center."
            },
            {
                "profile_name": "B2B-UBS-EQUITIES",
                "company_name": "UBS Securities Hong Kong Ltd",
                "connection_type": "VPN",
                "vpn_peer_ip": "165.225.104.18",
                "metro_circuit_id": None,
                "metro_vlan_id": None,
                "metro_registration_owner": None,
                "contract_expiry_date": today + timedelta(days=45),
                "bandwidth": "50 Mbps",
                "status": "Expiring Soon",
                "service_type": "FIX 4.2 Cross-Market Equities",
                "contact_person": "UBS FIX Support",
                "contact_email": "fix-asia@ubs.com",
                "notes": "Primary backup IPsec tunnel over HKBN commercial broadband."
            },
            {
                "profile_name": "B2B-STANCHART-CUSTODY",
                "company_name": "Standard Chartered Bank (Hong Kong)",
                "connection_type": "Metro",
                "vpn_peer_ip": None,
                "metro_circuit_id": "PCCW-MTR-553920-SCB",
                "metro_vlan_id": 750,
                "metro_registration_owner": "B2B Company",
                "contract_expiry_date": today + timedelta(days=500),
                "bandwidth": "200 Mbps",
                "status": "Active",
                "service_type": "SWIFT & Settlement Cash Management",
                "contact_person": "StanChart Institutional Ops",
                "contact_email": "ops.hk@sc.com",
                "notes": "Dedicated settlement backbone for HKD/USD clearing."
            },
            {
                "profile_name": "B2B-INTERACTIVE-BROKERS",
                "company_name": "Interactive Brokers LLC (Hong Kong)",
                "connection_type": "VPN",
                "vpn_peer_ip": "208.245.107.3",
                "metro_circuit_id": None,
                "metro_vlan_id": None,
                "metro_registration_owner": None,
                "contract_expiry_date": today + timedelta(days=290),
                "bandwidth": "100 Mbps",
                "status": "Active",
                "service_type": "US & Global Markets Order Routing",
                "contact_person": "IBKR Technical Desk",
                "contact_email": "b2b-api@interactivebrokers.com",
                "notes": "Direct API gateway routing for US equities & derivatives."
            },
            {
                "profile_name": "B2B-SGX-CONNECT",
                "company_name": "Singapore Exchange (SGX - Hong Kong PoP)",
                "connection_type": "Metro",
                "vpn_peer_ip": None,
                "metro_circuit_id": "EQUINIX-CX-10492-SGX",
                "metro_vlan_id": 880,
                "metro_registration_owner": "PSHK",
                "contract_expiry_date": today + timedelta(days=160),
                "bandwidth": "500 Mbps",
                "service_type": "SGX Titan Derivatives Trading Feed",
                "contact_person": "SGX Market Access",
                "contact_email": "marketaccess@sgx.com",
                "notes": "Terminated in Equinix HK1 Data Center via direct cross-connect."
            },
            {
                "profile_name": "B2B-CITADEL-SECURITIES",
                "company_name": "Citadel Securities Asia",
                "connection_type": "Metro",
                "vpn_peer_ip": None,
                "metro_circuit_id": "HKT-MTR-339182-CIT",
                "metro_vlan_id": 905,
                "metro_registration_owner": "PSHK",
                "contract_expiry_date": today - timedelta(days=10),
                "bandwidth": "1 Gbps",
                "status": "Expired",
                "service_type": "Equities Market Making & Liquidity Provision",
                "contact_person": "Citadel Trading Connectivity",
                "contact_email": "connectivity@citadelsecurities.com",
                "notes": "Under contract renewal by PSHK B2B business team."
            },
            {
                "profile_name": "B2B-FUTU-SECURITIES",
                "company_name": "Futu Securities International (Hong Kong)",
                "connection_type": "VPN",
                "vpn_peer_ip": "119.28.188.94",
                "metro_circuit_id": None,
                "metro_vlan_id": None,
                "metro_registration_owner": None,
                "contract_expiry_date": today + timedelta(days=365),
                "bandwidth": "100 Mbps",
                "status": "Active",
                "service_type": "Inter-Broker Margin Financing Peering",
                "contact_person": "Futu B2B Engineering",
                "contact_email": "tech-b2b@futuhk.com",
                "notes": "High-availability site-to-site VPN across Tencent Cloud Interconnect."
            }
        ]

        for item in sample_b2b:
            c = B2BConnection(**item)
            db.add(c)
        db.commit()
        print(f"[B2B Seed] Successfully seeded {len(sample_b2b)} B2B Connection Profiles!")

    finally:
        if close_at_end:
            db.close()

if __name__ == "__main__":
    seed_b2b_connections()

