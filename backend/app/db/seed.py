import os
import datetime
from datetime import timedelta
import random
from sqlalchemy.orm import Session
from app.db.session import SessionLocal, Base, engine
import app.db.base  # ensure all models are registered
from app.core.security import get_password_hash
from app.models.user import User, Role, Permission, UserRole, AuditLog, Notification
from app.models.vendor import Vendor
from app.models.location import Location, Building, Floor, Rack
from app.models.contract import Contract, AssetContract, Warranty
from app.models.asset import DeviceCategory, DeviceModel, OwnershipType, Asset, NetworkInterface, AssetDocument, AssetHistory
from app.models.network import VLAN, IPAddress, NetworkConnection
from app.models.maintenance import MaintenanceRecord
from app.models.inventory import SparePart, SpareStockTransaction

def seed_database():
    print("[DB SEED] Creating all tables in database...")
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    # Check if already seeded
    if db.query(User).filter_by(username="admin").first():
        print("[DB SEED] Database already populated. Ensuring baseline alert rules and settings are active...")
        from app.api.v1.alerts import seed_default_rules, get_or_create_alert_settings
        seed_default_rules(db)
        get_or_create_alert_settings(db)
        seed_demo = os.getenv("SEED_DEMO_DATA", "false").lower() in ["true", "1", "yes"]
        if seed_demo:
            from app.db.seed_b2b import seed_b2b_connections
            seed_b2b_connections(db)
        db.close()
        return

    seed_demo = os.getenv("SEED_DEMO_DATA", "false").lower() in ["true", "1", "yes"]
    print(f"[DB SEED] Initializing database baseline (seed_demo={seed_demo})...")

    # 1. ROLES & PERMISSIONS
    role_names = [
        ("SUPER_ADMIN", "Full application administrator with system configuration access"),
        ("NETWORK_ADMIN", "Manages network assets, IPAM, and topology"),
        ("ASSET_MANAGER", "Manages asset inventory, ownership, and locations"),
        ("CONTRACT_MANAGER", "Manages vendor contracts, leases, and warranties"),
        ("VIEWER", "Read-only access across all inventory modules")
    ]
    roles_dict = {}
    for r_name, r_desc in role_names:
        role = Role(name=r_name, description=r_desc)
        db.add(role)
        roles_dict[r_name] = role
    db.flush()

    # 2. INITIAL ADMIN USER ONLY
    admin_uname = os.getenv("INITIAL_ADMIN_USERNAME", "admin").strip()
    admin_pwd = os.getenv("INITIAL_ADMIN_PASSWORD", "Phillip2026!").strip()
    admin_email = os.getenv("INITIAL_ADMIN_EMAIL", "admin@phillip.com.hk").strip()
    admin_full_name = os.getenv("INITIAL_ADMIN_FULL_NAME", "Administrator").strip()

    admin_usr = User(
        username=admin_uname,
        email=admin_email,
        hashed_password=get_password_hash(admin_pwd),
        full_name=admin_full_name,
        title="System Administrator",
        department="IT Infrastructure",
        is_active=True,
        is_superuser=True
    )
    db.add(admin_usr)
    db.flush()
    db.add(UserRole(user_id=admin_usr.id, role_id=roles_dict["SUPER_ADMIN"].id))
    db.flush()

    created_users = [admin_usr]

    # 3. OWNERSHIP TYPES (Standard baseline categories)
    ownership_data = [
        ("COMPANY", "Company Owned", "Fully capitalized asset owned by enterprise"),
        ("RENTAL", "Rental", "Short-to-medium term leased equipment from vendor or telco partner"),
        ("LEASED", "Leased", "Capital/operating financial lease with buyout option"),
        ("VENDOR", "Vendor Provided", "Hardware supplied under Managed Services agreement"),
        ("CUSTOMER", "Customer Owned", "Colocated DMA/HFT gateway owned by institutional client")
    ]
    ownership_dict = {}
    for code, name, desc in ownership_data:
        ot = OwnershipType(code=code, name=name, description=desc)
        db.add(ot)
        ownership_dict[code] = ot
    db.flush()

    # 4. DEVICE CATEGORIES (Standard baseline hardware categories)
    cat_raw = [
        ("Switch", "SW", "Server", "Layer 2/3 Enterprise & Top-of-Rack Switches"),
        ("Router", "RT", "Route", "Core Backbone, WAN Aggregation, and BGP Edge Routers"),
        ("Firewall", "FW", "Shield", "Next-Generation Firewalls (NGFW) & Threat Prevention"),
        ("Wireless", "AP", "Wifi", "Wi-Fi 6/6E Enterprise Access Points and Controllers"),
        ("Others", "OTH", "Cpu", "Application Delivery Controllers, Console Servers, Taps")
    ]
    categories_dict = {}
    for name, code, icon, desc in cat_raw:
        c = DeviceCategory(name=name, code=code, icon=icon, description=desc)
        db.add(c)
        categories_dict[name] = c
    db.flush()

    # 5. INITIALIZE AUTOMATED ALERT RULES & SETTINGS
    from app.api.v1.alerts import seed_default_rules, get_or_create_alert_settings
    seed_default_rules(db)
    get_or_create_alert_settings(db)

    # Clean production check: if demo dataset is disabled, commit baseline and exit!
    if not seed_demo:
        db.commit()
        db.close()
        print("[DB SEED] Production clean baseline initialized successfully. (SEED_DEMO_DATA=false: Zero demo users, zero vendors, zero locations, zero assets, zero dump data).")
        return

    print("[DB SEED] Populating demo reference dataset...")

    # Optional demo users
    demo_users_data = [
        ("netadmin", "netadmin@phillip.com.hk", "Phillip2026!", "John Zhang", "Lead Network Architect", "Network Engineering", False, "NETWORK_ADMIN"),
        ("assetmgr", "assetmgr@phillip.com.hk", "Phillip2026!", "Kelvin Chan", "IT Asset & Procurement Lead", "IT Operations", False, "ASSET_MANAGER"),
        ("contractmgr", "contractmgr@phillip.com.hk", "Phillip2026!", "Grace Liu", "Senior Vendor & Contract Manager", "Finance & Vendor Management", False, "CONTRACT_MANAGER"),
        ("viewer", "viewer@phillip.com.hk", "Phillip2026!", "Auditor Guest", "Compliance & Audit Specialist", "Internal Audit", False, "VIEWER")
    ]
    for uname, email, pwd, name, title, dept, is_super, r_name in demo_users_data:
        usr = User(
            username=uname,
            email=email,
            hashed_password=get_password_hash(pwd),
            full_name=name,
            title=title,
            department=dept,
            is_active=True,
            is_superuser=is_super
        )
        db.add(usr)
        db.flush()
        db.add(UserRole(user_id=usr.id, role_id=roles_dict[r_name].id))
        created_users.append(usr)
    db.flush()

    # 4. VENDORS (14 vendors matching KPI)
    vendors_raw = [
        ("VND-001", "Palo Alto Networks", "Security", "Palo Alto", "Simon Lee", "hk-sales@paloaltonetworks.com", "+852 3965 2000", "Tower 1, Times Square, Causeway Bay", "Active"),
        ("VND-002", "Cisco Systems HK", "Network Hardware", "Cisco", "David Cheung", "cisco-hk@cisco.com", "+852 2588 3333", "Great Eagle Centre, Wanchai", "Active"),
        ("VND-003", "Huawei Technologies HK", "Network Hardware", "Huawei", "Ming Chen", "hkenterprise@huawei.com", "+852 3719 3388", "Kowloon Bay, Hong Kong", "Active"),
        ("VND-004", "Fortinet HK", "Security", "Fortinet", "Ada Tsang", "hk_support@fortinet.com", "+852 3959 1000", "One Island South, Wong Chuk Hang", "Active"),
        ("VND-005", "Aruba / HPE Hong Kong", "Wireless & Access", "Aruba", "Chris Lau", "hpe-hk@hpe.com", "+852 3071 8000", "Two Harbourfront, Hung Hom", "Active"),
        ("VND-006", "Juniper Networks HK", "Network Hardware", "Juniper", "Kevin Ho", "juniper-hk@juniper.net", "+852 2587 6666", "Sun Hung Kai Centre, Wanchai", "Active"),
        ("VND-007", "HKT Enterprise Solutions", "Telecom & Rental", "HKT", "Marcus Kwok", "commercial@hkt.com", "+852 10088", "PCCW Tower, Taikoo Place, Quarry Bay", "Active"),
        ("VND-008", "PCCW Global", "IP Transit & Colocation", "PCCW", "Jennifer Ng", "global-carrier@pccwglobal.com", "+852 2888 2888", "Telecom House, 3 Gloucester Rd, Wanchai", "Active"),
        ("VND-009", "SUNeVision (Mega-i)", "Data Center Operator", "SUNeVision", "Gary Tang", "dc-ops@sunevision.com", "+852 2828 8688", "MEGA-i, 399 Chai Wan Rd, Chai Wan", "Active"),
        ("VND-010", "Equinix Hong Kong", "Data Center Operator", "Equinix", "Vincent Wu", "hk-sales@equinix.com", "+852 2970 7788", "HK1 / HK2, Sha Tin & Tsuen Wan", "Active"),
        ("VND-011", "Dell Technologies HK", "Server & Storage", "Dell", "Eric Poon", "dell-hk@dell.com", "+852 2969 3111", "Exchange Square, Central", "Active"),
        ("VND-012", "Arista Networks HK", "High Frequency Trading Switches", "Arista", "Brian Tong", "sales-hk@arista.com", "+852 3975 3000", "Two International Finance Centre, Central", "Active"),
        ("VND-013", "Check Point Software HK", "Firewall & Endpoint", "Check Point", "William Tam", "hkinfo@checkpoint.com", "+852 3965 5000", "Sino Plaza, Causeway Bay", "Active"),
        ("VND-014", "F5 Networks Hong Kong", "Application Delivery & WAF", "F5", "Samuel Chiu", "hk_inquiry@f5.com", "+852 3970 8888", "One Taikoo Place, Quarry Bay", "Active")
    ]
    vendors_dict = {}
    for code, name, cat, mfg, contact, email, phone, addr, st in vendors_raw:
        v = Vendor(
            vendor_code=code,
            name=name,
            category=cat,
            manufacturer=mfg,
            primary_contact=contact,
            email=email,
            phone=phone,
            address=addr,
            country="Hong Kong",
            support_contact=f"{contact} (TAC Duty Lead)",
            support_email=email,
            support_hotline=phone,
            website=f"https://www.{mfg.lower().replace(' ', '')}.com",
            status=st,
            notes="Authorized Enterprise Partner with Level 1/2 Local Support SLA"
        )
        db.add(v)
        vendors_dict[mfg] = v
    db.flush()

    # 5. LOCATIONS & SITES (6 sites matching KPI)
    sites_raw = [
        ("HK-DC1", "Mega-i Chai Wan Data Center", "Data Center", "MEGA-i, 399 Chai Wan Rd, Chai Wan, HK"),
        ("HK-DC2", "Equinix HK1 Data Center", "Data Center", "Equinix HK1, Western Centre, Des Voeux Rd W, HK"),
        ("HK-HQ", "Exchange Square Central HQ", "Headquarters", "11/F & 12/F, Two Exchange Square, Central, HK"),
        ("HK-ADM", "Admiralty Branch Office", "Branch Office", "Lippo Centre Tower 2, Admiralty, HK"),
        ("HK-KLN", "Kowloon TST Branch", "Branch Office", "Miramar Tower, Nathan Rd, Tsim Sha Tsui, KLN"),
        ("HK-DR", "Tsuen Wan Disaster Recovery Site", "Disaster Recovery Site", "CDW Building, Castle Peak Rd, Tsuen Wan, NT")
    ]
    locations_dict = {}
    racks_list = []
    for code, name, l_type, addr in sites_raw:
        loc = Location(
            code=code,
            name=name,
            type=l_type,
            country="Hong Kong",
            city="Hong Kong",
            address=addr,
            contact_person="Operations Control Centre (OCC)",
            contact_phone="+852 2277 6688",
            contact_email=f"occ.{code.lower()}@phillip.com.hk"
        )
        db.add(loc)
        db.flush()
        locations_dict[code] = loc

        bldg = Building(location_id=loc.id, code=f"{code}-B1", name=f"{name} Main Building", address=addr)
        db.add(bldg)
        db.flush()

        flr = Floor(building_id=bldg.id, floor_number="7/F" if "DC" in code else "11/F", floor_name="Primary Network Hall")
        db.add(flr)
        db.flush()

        for r_name in ["Rack A1", "Rack A2", "Rack B1", "Rack B2", "Rack C1"]:
            r = Rack(
                floor_id=flr.id,
                rack_name=r_name,
                rack_number=f"{code}-{r_name.replace(' ', '')}",
                room="Main Server Hall" if "DC" in code else "MDF Room",
                total_u=42,
                power_feed="Dual A+B 32A Redundant Feed"
            )
            db.add(r)
            racks_list.append((code, r_name, r))
    db.flush()

    # 6. DEVICE MODELS
    models_raw = [
        # Switches
        ("C9300-48P", "Cisco", "Switch", "V02", 48, 1, "Catalyst 9300 48-port PoE+ Core & Access Switch"),
        ("Nexus 93180YC", "Cisco", "Switch", "V03", 48, 1, "Nexus 9300 100G Spine-Leaf Datacenter Switch"),
        ("S5735-L48T4S", "Huawei", "Switch", "A1", 48, 1, "CloudEngine S5735 Gigabit Enterprise Switch"),
        ("EX4300-48T", "Juniper", "Switch", "Rev 2", 48, 1, "EX4300 48-Port 10G Uplink Enterprise Switch"),
        ("Arista 7050SX3", "Arista", "Switch", "V01", 48, 1, "Low-latency 10/25G SFP28 Trading Switch"),
        # Routers
        ("ISR4431", "Cisco", "Router", "V01", 8, 1, "Integrated Services Router 4431 Multi-Service WAN Gateway"),
        ("ASR1001-X", "Cisco", "Router", "V02", 6, 1, "Aggregation Services Router 1001-X 20Gbps BGP Edge"),
        ("SRX345", "Juniper", "Router", "Rev 4", 16, 1, "SRX Services Gateway High-Performance Branch Router"),
        ("AR6280", "Huawei", "Router", "B1", 12, 2, "NetEngine AR6280 Enterprise Core Router"),
        # Firewalls
        ("PA-3220", "Palo Alto", "Firewall", "1.1", 12, 2, "Palo Alto PA-3220 Next-Gen High-Availability Firewall"),
        ("PA-5220", "Palo Alto", "Firewall", "2.0", 20, 3, "Palo Alto PA-5220 High-Throughput Perimeter Firewall"),
        ("FortiGate 100F", "Fortinet", "Firewall", "V2", 22, 1, "FortiGate 100F Secure SD-WAN & Enterprise Firewall"),
        ("FortiGate 200F", "Fortinet", "Firewall", "V1", 26, 1, "FortiGate 200F High Density NGFW Security Appliance"),
        ("Quantum 6200", "Check Point", "Firewall", "R81", 10, 1, "Check Point Quantum 6200 Threat Prevention Appliance"),
        # Wireless
        ("C9130AXI", "Cisco", "Wireless", "V01", 2, 1, "Catalyst 9130AX Series Wi-Fi 6 Enterprise Access Point"),
        ("AP-555", "Aruba", "Wireless", "Rev 1", 2, 1, "Aruba 555 Series Unified Wi-Fi 6 Campus AP"),
        ("AP-505", "Aruba", "Wireless", "Rev 2", 2, 1, "Aruba 505 Series Campus Access Point"),
        # Others
        ("BIG-IP i4800", "F5", "Others", "v16", 8, 1, "F5 BIG-IP i4800 Local Traffic Manager / SSL Orchestrator"),
        ("Opengear OM2224", "Cisco", "Others", "V03", 24, 1, "Out-of-band Console Terminal Gateway")
    ]
    models_dict = {}
    for m_name, mfg, cat, rev, ports, u, desc in models_raw:
        dm = DeviceModel(
            model_name=m_name,
            manufacturer=mfg,
            category_id=categories_dict[cat].id,
            hardware_revision=rev,
            total_ports=ports,
            rack_units=u,
            end_of_life_date=datetime.date(2029, 12, 31),
            end_of_support_date=datetime.date(2031, 12, 31),
            description=desc
        )
        db.add(dm)
        models_dict[m_name] = dm
    db.flush()

    # 8. CONTRACTS (32 active contracts matching KPI, with 8 expiring within 90 days)
    today = datetime.date(2025, 11, 7)
    contracts_list = []
    
    contract_templates = [
        ("CT-2023-PAN-01", "Palo Alto Threat Prevention & WildFire 24x7 Support", "Hardware Support Contract", "Palo Alto", 480000, today - timedelta(days=600), today + timedelta(days=45), "Expiring Soon", "24x7x4 Critical TAC"),
        ("CT-2024-CSC-02", "Cisco SMARTnet Enterprise Campus Core Agreement", "Maintenance Contract", "Cisco", 1250000, today - timedelta(days=300), today + timedelta(days=62), "Expiring Soon", "24x7x4 On-site Parts & Labor"),
        ("CT-2023-HKT-03", "HKT Metro Ethernet & Leased Switch Rental Pack A", "Rental Agreement", "HKT", 380000, today - timedelta(days=330), today + timedelta(days=28), "Expiring Soon", "8x5xNBD Replacement"),
        ("CT-2024-FTN-04", "Fortinet Enterprise Security Fabric Subscription", "Software Subscription", "Fortinet", 240000, today - timedelta(days=270), today + timedelta(days=80), "Expiring Soon", "24x7 Firmware & Signatures"),
        ("CT-2024-HWA-05", "Huawei Enterprise Care Support Package", "Maintenance Contract", "Huawei", 310000, today - timedelta(days=280), today + timedelta(days=55), "Expiring Soon", "24x7x4 Spare Delivery"),
        ("CT-2023-ARU-06", "Aruba Central Cloud Wireless Management License", "Software Subscription", "Aruba", 185000, today - timedelta(days=320), today + timedelta(days=15), "Expiring Soon", "Cloud SLA 99.99%"),
        ("CT-2024-JNP-07", "Juniper Care Core Plus Hardware Maintenance", "Maintenance Contract", "Juniper", 420000, today - timedelta(days=310), today + timedelta(days=73), "Expiring Soon", "24x7x4 Mission Critical"),
        ("CT-2024-EQX-08", "Equinix Cross Connect & Rental Cabinet Switch SLA", "Rental Agreement", "Equinix", 650000, today - timedelta(days=340), today + timedelta(days=38), "Expiring Soon", "Tier 3+ Datacenter 99.999%"),
    ]
    # Add 24 more contracts to reach 32 active contracts
    for i in range(9, 33):
        v_key = random.choice(list(vendors_dict.keys()))
        c_type = random.choice(["Purchase Contract", "Rental Agreement", "Leasing Agreement", "Maintenance Contract", "Hardware Support Contract", "Software Subscription", "Managed Service Agreement"])
        end_d = today + timedelta(days=random.randint(120, 750))
        contract_templates.append((
            f"CT-2024-GEN-{i:02d}",
            f"{v_key} Corporate Network Infrastructure SLA Bundle #{i}",
            c_type,
            v_key,
            random.randint(150000, 950000),
            today - timedelta(days=random.randint(100, 400)),
            end_d,
            "Active",
            "24x7x4 TAC Support + Hardware Replacement"
        ))

    created_contracts = []
    for num, name, c_type, v_name, val, s_d, e_d, st, sla in contract_templates:
        v_obj = vendors_dict.get(v_name, list(vendors_dict.values())[0])
        c = Contract(
            contract_number=num,
            contract_name=name,
            contract_type=c_type,
            vendor_id=v_obj.id,
            contract_owner="IT Infrastructure Team",
            start_date=s_d,
            end_date=e_d,
            contract_value=val,
            currency="HKD",
            payment_terms="Annual Advance / Net 30",
            sla=sla,
            support_level="Tier-1 Financial Enterprise SLA",
            renewal_terms="Automatic 12-month extension with 60 days prior written notice",
            status=st,
            document_url=f"/uploads/contracts/{num}.pdf",
            notes="Active contract registered with Finance & IT Operations"
        )
        db.add(c)
        created_contracts.append(c)
    db.flush()

    # 9. ASSETS CREATION (Exact 1,248 assets with exact KPI breakdown)
    # Target:
    # Total: 1,248
    # Company Owned: 876
    # Rental / Leased: 372
    # Categories: Switches 42% (524), Routers 22% (275), Firewalls 15% (187), Wireless 13% (162), Others 8% (100)
    # Deployed: 1,242, In Maintenance: 6
    
    # 6 Reference items that match the screenshot:
    reference_assets = [
        {
            "asset_id": "NA-000123",
            "hostname": "FW-01-HK",
            "model_name": "PA-3220",
            "manufacturer": "Palo Alto",
            "vendor_name": "Palo Alto",
            "serial_number": "8F3D1A00234",
            "location_code": "HK-DC1",
            "rack_name": "Rack A1",
            "status": "Deployed",
            "ownership": "Company Owned",
            "category": "Firewall",
            "mgmt_ip": "10.200.10.1",
            "mac": "00:1B:17:00:23:4A",
            "vlan": "VLAN 100",
            "subnet": "10.200.10.0/24"
        },
        {
            "asset_id": "NA-000124",
            "hostname": "SW-01-HK",
            "model_name": "C9300-48P",
            "manufacturer": "Cisco",
            "vendor_name": "Cisco",
            "serial_number": "FGL23456789",
            "location_code": "HK-DC1",
            "rack_name": "Rack A2",
            "status": "Deployed",
            "ownership": "Company Owned",
            "category": "Switch",
            "mgmt_ip": "10.200.10.2",
            "mac": "F4:BD:9E:23:45:67",
            "vlan": "VLAN 100",
            "subnet": "10.200.10.0/24"
        },
        {
            "asset_id": "NA-000125",
            "hostname": "RT-01-HK",
            "model_name": "ISR4431",
            "manufacturer": "Cisco",
            "vendor_name": "Cisco",
            "serial_number": "FGL98765432",
            "location_code": "HK-ADM",
            "rack_name": "Rack A1",
            "status": "Deployed",
            "ownership": "Company Owned",
            "category": "Router",
            "mgmt_ip": "10.200.20.1",
            "mac": "F4:BD:9E:98:76:54",
            "vlan": "VLAN 200",
            "subnet": "10.200.20.0/24"
        },
        {
            "asset_id": "NA-000126",
            "hostname": "AP-01-HK",
            "model_name": "C9130AXI",
            "manufacturer": "Cisco",
            "vendor_name": "Cisco",
            "serial_number": "FGL11223344",
            "location_code": "HK-HQ",
            "rack_name": "Rack A1",
            "status": "Deployed",
            "ownership": "Company Owned",
            "category": "Wireless",
            "mgmt_ip": "10.200.30.15",
            "mac": "F4:BD:9E:11:22:33",
            "vlan": "VLAN 300",
            "subnet": "10.200.30.0/24"
        },
        {
            "asset_id": "NA-000127",
            "hostname": "SW-02-HK",
            "model_name": "S5735-L48T4S",
            "manufacturer": "Huawei",
            "vendor_name": "Huawei",
            "serial_number": "2102356789",
            "location_code": "HK-HQ",
            "rack_name": "Rack B1",
            "status": "In Maintenance",
            "ownership": "Rental",
            "category": "Switch",
            "mgmt_ip": "10.200.30.2",
            "mac": "E4:68:A3:21:02:35",
            "vlan": "VLAN 300",
            "subnet": "10.200.30.0/24"
        },
        {
            "asset_id": "NA-000128",
            "hostname": "FW-02-HK",
            "model_name": "FortiGate 100F",
            "manufacturer": "Fortinet",
            "vendor_name": "Fortinet",
            "serial_number": "FGT100F2210001",
            "location_code": "HK-DC2",
            "rack_name": "Rack B1",
            "status": "Deployed",
            "ownership": "Rental",
            "category": "Firewall",
            "mgmt_ip": "10.200.40.1",
            "mac": "70:4C:A5:22:10:00",
            "vlan": "VLAN 100",
            "subnet": "10.200.40.0/24"
        }
    ]

    total_target = 1248
    company_owned_target = 876
    rental_target = 372

    cat_counts = {
        "Switch": 524,
        "Router": 275,
        "Firewall": 187,
        "Wireless": 162,
        "Others": 100
    }

    # Model catalog per category
    category_models = {
        "Switch": ["C9300-48P", "Nexus 93180YC", "S5735-L48T4S", "EX4300-48T", "Arista 7050SX3"],
        "Router": ["ISR4431", "ASR1001-X", "SRX345", "AR6280"],
        "Firewall": ["PA-3220", "PA-5220", "FortiGate 100F", "FortiGate 200F", "Quantum 6200"],
        "Wireless": ["C9130AXI", "AP-555", "AP-505"],
        "Others": ["BIG-IP i4800", "Opengear OM2224"]
    }

    # Plan how many items in each category are company vs rental
    # Total rental needed: 372. Total company needed: 876.
    all_asset_specs = []

    # Insert reference 6 first:
    all_asset_specs.extend(reference_assets)

    # Remaining counts needed:
    current_company = sum(1 for a in reference_assets if a["ownership"] == "Company Owned")
    current_rental = sum(1 for a in reference_assets if a["ownership"] == "Rental")
    current_in_maintenance = sum(1 for a in reference_assets if a["status"] == "In Maintenance")

    remaining_cat_counts = {
        "Switch": 524 - sum(1 for a in reference_assets if a["category"] == "Switch"),
        "Router": 275 - sum(1 for a in reference_assets if a["category"] == "Router"),
        "Firewall": 187 - sum(1 for a in reference_assets if a["category"] == "Firewall"),
        "Wireless": 162 - sum(1 for a in reference_assets if a["category"] == "Wireless"),
        "Others": 100 - sum(1 for a in reference_assets if a["category"] == "Others")
    }

    remaining_rental_needed = rental_target - current_rental
    remaining_company_needed = company_owned_target - current_company
    remaining_maintenance_needed = 6 - current_in_maintenance  # 5 more needed to total 6 in maintenance!

    site_codes = ["HK-DC1", "HK-DC2", "HK-HQ", "HK-ADM", "HK-KLN", "HK-DR"]
    rack_names = ["Rack A1", "Rack A2", "Rack B1", "Rack B2", "Rack C1"]

    asset_num_seq = 129
    # Build list of category tokens
    cat_pool = []
    for cat_name, cnt in remaining_cat_counts.items():
        cat_pool.extend([cat_name] * cnt)

    random.seed(42)  # Deterministic seed for reproducible testing
    random.shuffle(cat_pool)

    # Determine which ones will be rental vs company
    rental_indices = set(random.sample(range(len(cat_pool)), remaining_rental_needed))
    maintenance_indices = set(random.sample(range(len(cat_pool)), remaining_maintenance_needed))

    for idx, cat_name in enumerate(cat_pool):
        a_id = f"NA-{asset_num_seq:06d}"
        asset_num_seq += 1

        is_rental = idx in rental_indices
        own_type = "Rental" if is_rental else "Company Owned"

        is_maint = idx in maintenance_indices
        op_status = "In Maintenance" if is_maint else "Deployed"

        m_name = random.choice(category_models[cat_name])
        dm_obj = models_dict[m_name]
        mfg = dm_obj.manufacturer
        v_name = mfg if mfg in vendors_dict else "Cisco"

        site_c = random.choice(site_codes)
        r_name = random.choice(rack_names)
        
        prefix = "SW" if cat_name == "Switch" else "RT" if cat_name == "Router" else "FW" if cat_name == "Firewall" else "AP" if cat_name == "Wireless" else "DEV"
        hostname = f"{prefix}-{idx+10:04d}-{site_c[3:]}"
        sn = f"{mfg[:3].upper()}{random.randint(10000000, 99999999)}"

        all_asset_specs.append({
            "asset_id": a_id,
            "hostname": hostname,
            "model_name": m_name,
            "manufacturer": mfg,
            "vendor_name": v_name,
            "serial_number": sn,
            "location_code": site_c,
            "rack_name": r_name,
            "status": op_status,
            "ownership": own_type,
            "category": cat_name,
            "mgmt_ip": f"10.{random.randint(100, 220)}.{random.randint(1, 250)}.{random.randint(2, 254)}",
            "mac": f"00:{random.randint(10, 99):02X}:{random.randint(10, 99):02X}:{random.randint(10, 99):02X}:{random.randint(10, 99):02X}:{random.randint(10, 99):02X}",
            "vlan": f"VLAN {random.choice([10, 100, 200, 300, 400])}",
            "subnet": "10.200.10.0/24"
        })

    # Batch insert assets
    print(f"[DB SEED] Generating {len(all_asset_specs)} enterprise network assets...")
    db_assets = []
    
    # Warranties expiring soon target: 14 warranties expiring within 90 days
    warranties_expiring_soon_count = 0
    target_expiring_warranties = 14

    for spec in all_asset_specs:
        loc = locations_dict[spec["location_code"]]
        # find matching rack
        matched_rack = None
        for s_code, r_n, r_obj in racks_list:
            if s_code == spec["location_code"] and r_n == spec["rack_name"]:
                matched_rack = r_obj
                break
        if not matched_rack:
            matched_rack = racks_list[0][2]

        m_obj = models_dict[spec["model_name"]]
        c_obj = categories_dict[spec["category"]]
        o_obj = ownership_dict["RENTAL" if spec["ownership"] == "Rental" else "COMPANY"]
        v_obj = vendors_dict.get(spec["vendor_name"], list(vendors_dict.values())[0])

        is_rent = spec["ownership"] == "Rental"
        rent_prov = "HKT Enterprise Solutions" if is_rent else None
        rent_m_cost = 4500.00 if is_rent else 0.00
        rent_start = today - timedelta(days=200) if is_rent else None
        rent_end = today + timedelta(days=165) if is_rent else None

        asset = Asset(
            asset_id=spec["asset_id"],
            hostname=spec["hostname"],
            serial_number=spec["serial_number"],
            asset_tag=f"PSHK-{spec['asset_id'].replace('NA-', '')}",
            device_name=f"{m_obj.model_name} ({spec['hostname']})",
            description=f"Phillip Securities HK production network {spec['category'].lower()} deployed at {loc.name}",
            manufacturer=spec["manufacturer"],
            vendor_id=v_obj.id,
            model_id=m_obj.id,
            hardware_revision=m_obj.hardware_revision,
            category_id=c_obj.id,
            device_type="Network Infrastructure",
            device_role="Core Datacenter Backbone" if "DC" in spec["location_code"] else "Access / Edge",
            ownership_type_id=o_obj.id,
            ownership_type=spec["ownership"],
            rental_provider=rent_prov,
            rental_agreement_ref="RA-2024-HKT-99" if is_rent else None,
            rental_start_date=rent_start,
            rental_end_date=rent_end,
            monthly_rental_cost=rent_m_cost,
            total_rental_cost=rent_m_cost * 24 if is_rent else 0.00,
            return_conditions="Return in operational condition with original rack ears and power supplies",
            return_date=rent_end if is_rent else None,
            renewal_status="Under Active Contract",
            po_number=f"PO-2024-{random.randint(1000, 9999)}",
            purchase_date=today - timedelta(days=random.randint(100, 1000)),
            purchase_price=random.randint(35000, 280000) if not is_rent else 0.00,
            currency="HKD",
            supplier=v_obj.name,
            invoice_number=f"INV-{random.randint(10000, 99999)}",
            management_ip=spec["mgmt_ip"],
            mac_address=spec["mac"],
            firmware_version="17.9.4a" if "Cisco" in spec["manufacturer"] else "10.2.7-h3" if "Palo" in spec["manufacturer"] else "7.2.5",
            operating_system="Cisco IOS-XE" if "Cisco" in spec["manufacturer"] else "PAN-OS" if "Palo" in spec["manufacturer"] else "FortiOS",
            management_protocol="SSHv2 / HTTPS / SNMPv3",
            location_id=loc.id,
            rack_id=matched_rack.id,
            rack_position=f"U{random.randint(10, 38)}",
            location_display=f"{spec['location_code']} / {spec['rack_name']}",
            vlan=spec["vlan"],
            subnet=spec["subnet"],
            default_gateway="10.200.10.1",
            network_segment="Core Trading Backbone",
            uplink_port="Te1/0/1",
            acquisition_date=today - timedelta(days=random.randint(200, 800)),
            deployment_date=today - timedelta(days=random.randint(100, 600)),
            operational_status=spec["status"],
            asset_condition="Good" if spec["status"] == "Deployed" else "Maintenance Required",
            end_of_life_date=datetime.date(2029, 12, 31),
            end_of_support_date=datetime.date(2031, 12, 31)
        )
        db_assets.append(asset)

    db.bulk_save_objects(db_assets)
    db.flush()

    # Re-fetch the saved assets so we have their generated IDs
    saved_assets = db.query(Asset).order_by(Asset.id).all()
    print(f"[DB SEED] Successfully committed {len(saved_assets)} assets.")

    # 10. ASSOCIATE CONTRACTS AND WARRANTIES
    print("[DB SEED] Generating contracts, warranties, and maintenance records...")
    
    # Contract associations: link contracts to assets based on realistic vendor, category, and ownership matching
    asset_contracts = []
    warranties = []
    maintenance_records = []
    
    # Categorize saved assets for realistic contract linking
    cisco_assets = [a for a in saved_assets if a.manufacturer == 'Cisco']
    palo_assets = [a for a in saved_assets if a.manufacturer == 'Palo Alto']
    aruba_assets = [a for a in saved_assets if a.manufacturer == 'Aruba']
    fortinet_assets = [a for a in saved_assets if a.manufacturer == 'Fortinet']
    juniper_assets = [a for a in saved_assets if a.manufacturer == 'Juniper']
    huawei_assets = [a for a in saved_assets if a.manufacturer == 'Huawei']
    checkpoint_assets = [a for a in saved_assets if a.manufacturer == 'Check Point']
    f5_assets = [a for a in saved_assets if a.manufacturer == 'F5']
    arista_assets = [a for a in saved_assets if a.manufacturer == 'Arista']
    rental_assets = [a for a in saved_assets if a.ownership_type in ['Rental', 'Leased']]
    mega_i_assets = [a for a in saved_assets if a.location and 'DC1' in (a.location.code or '')]
    pccw_assets = [a for a in saved_assets if a.location and 'DC2' in (a.location.code or '')]

    contracts_by_idx = {i: c for i, c in enumerate(created_contracts)}

    def link_contract(c_idx, asset_list, note='Hardware Support & SLA Coverage'):
        if c_idx in contracts_by_idx:
            c = contracts_by_idx[c_idx]
            for a in asset_list:
                asset_contracts.append(AssetContract(asset_id=a.id, contract_id=c.id, coverage_notes=note))

    # Realistically distribute devices across contracts
    link_contract(0, palo_assets[:38], '24x7 WildFire Cloud Threat Prevention')
    link_contract(23, palo_assets[38:], '24x7x4hr Mission Critical TAC & Spare Delivery')
    link_contract(1, cisco_assets[:240], 'Cisco SMARTnet 24x7x4 On-site Parts & Labor')
    link_contract(22, cisco_assets[240:], 'Cisco Edge Switching & Wi-Fi SLA Coverage')
    link_contract(2, rental_assets[:38], 'HKT Leased CPE Router & Metro Switch Rental')
    link_contract(11, rental_assets[38:72], 'HKT Enterprise Network Infrastructure Maintenance')
    link_contract(19, rental_assets[72:100], 'HKT Dedicated Internet Access Hardware Support')
    link_contract(3, fortinet_assets[:48], 'FortiCare 24x7 Security Fabric Subscription')
    link_contract(20, fortinet_assets[48:], 'FortiGate Secure SD-WAN Appliance Lease')
    link_contract(4, huawei_assets[:60], 'Huawei Care 24x7x4 Mission Critical Support')
    link_contract(24, huawei_assets[60:115], 'Huawei Enterprise Campus Switching Support')
    link_contract(29, huawei_assets[115:], 'Huawei Leased Switch & Router Agreement')
    link_contract(5, aruba_assets[:72], 'Aruba Central Cloud Management & Firmware Subscription')
    link_contract(14, aruba_assets[72:94], 'Aruba Foundation Care 24x7x4hr Replacement')
    link_contract(17, aruba_assets[94:], 'Aruba Campus Switching Purchase & Warranty')
    link_contract(6, juniper_assets[:98], 'Juniper Care 24x7x4hr Mission Critical Core Support')
    link_contract(16, juniper_assets[98:], 'Juniper EX Series Campus Switching Warranty')
    link_contract(7, rental_assets[100:152], 'Equinix HK1/HK2 Leased Cabinet Switch & Interconnect SLA')
    link_contract(27, rental_assets[152:190], 'Equinix Facility Switching Infrastructure Maintenance')
    link_contract(28, rental_assets[190:222], 'Equinix Datacenter Cross-Connect & Patch Lease')
    link_contract(8, checkpoint_assets[:18], 'Check Point Direct Support & Quantum Threat Prevention')
    link_contract(26, checkpoint_assets[18:], 'Check Point Perimeter Gateway Lease')
    link_contract(9, f5_assets[:12], 'F5 Premium Plus 24x7 Support & DNS Services')
    link_contract(21, f5_assets[12:23], 'F5 Advanced WAF & Bot Defense Subscription')
    link_contract(25, f5_assets[23:33], 'F5 Global Traffic Management License')
    link_contract(31, f5_assets[33:], 'F5 SSL Orchestration & DDoS Protection')
    link_contract(10, arista_assets[:20], 'Enterprise Spine-and-Leaf High Speed Fabric Agreement')
    link_contract(12, arista_assets[20:40], 'Datacenter Low-Latency Core Switching SLA')
    link_contract(13, arista_assets[40:60], 'Trading Network Fabric Leaf Switch Lease')
    link_contract(18, arista_assets[60:80], 'Out-of-Band Management & Compute Node Purchase')
    link_contract(15, (pccw_assets[:28] if len(pccw_assets) >= 28 else saved_assets[:28]), 'PCCW Global Tier-1 BGP IP Transit & Edge Gateway SLA')
    link_contract(30, (mega_i_assets[:46] if len(mega_i_assets) >= 46 else saved_assets[28:74]), 'MEGA-i Carrier-Neutral Meet-Me-Room Managed SLA')

    # Distribute 14 warranties expiring within 90 days
    warranties_expiring_soon_count = 0

    for idx, asset in enumerate(saved_assets):
        # Warranty
        if warranties_expiring_soon_count < 14 and idx % 80 == 0:
            exp_date = today + timedelta(days=random.randint(12, 85))  # within 90 days!
            w_status = "Expiring Soon"
            warranties_expiring_soon_count += 1
        else:
            exp_date = today + timedelta(days=random.randint(120, 900))
            w_status = "Active"

        w = Warranty(
            asset_id=asset.id,
            provider=f"{asset.manufacturer} Corporate Care",
            reference_no=f"WAR-{asset.serial_number[:8]}",
            start_date=today - timedelta(days=365),
            expiration_date=exp_date,
            support_coverage="24x7x4hr Mission Critical TAC & On-site Hardware Replacement",
            status=w_status
        )
        warranties.append(w)

        # Maintenance records for items in maintenance or recent
        if asset.operational_status == "In Maintenance":
            m_rec = MaintenanceRecord(
                ticket_number=f"MNT-2025-{1000 + idx}",
                asset_id=asset.id,
                maintenance_type="Preventive Maintenance" if idx % 2 == 0 else "Emergency Repair",
                reported_date=datetime.datetime.utcnow() - timedelta(days=1),
                scheduled_date=datetime.datetime.utcnow() + timedelta(days=2),
                technician="Certified Senior Network Field Engineer",
                vendor_id=asset.vendor_id,
                description=f"Scheduled optics cleaning and dual power supply diagnostic for {asset.hostname}",
                root_cause="Minor fan vibration warning observed during routine telemetry inspection",
                resolution="Field technician dispatched with hot-swap fan module and SFP+ replacement",
                downtime_minutes=0,
                cost=3500.00,
                status="In Progress"
            )
            maintenance_records.append(m_rec)

    db.bulk_save_objects(asset_contracts)
    db.bulk_save_objects(warranties)
    db.bulk_save_objects(maintenance_records)
    db.flush()

    # 11. IP ADDRESS MANAGEMENT & VLANS
    vlans_data = [
        (10, "DMZ Perimeter VLAN", "10.200.10.0/24", "10.200.10.1", "Exterior facing DMZ firewall subnet"),
        (100, "Core Datacenter Backbone", "10.200.100.0/24", "10.200.100.1", "Transit network between core switches and routers"),
        (200, "Electronic Trading Network", "10.200.200.0/24", "10.200.200.1", "Ultra low latency DMA exchange gateways (HKEX / HKFE)"),
        (300, "Server Farm & Virtualization", "10.200.300.0/24", "10.200.300.1", "Enterprise VMware cluster and core application servers"),
        (400, "Out-of-band Management VLAN", "10.200.400.0/24", "10.200.400.1", "Dedicated IPMI, iLO, and network switch management")
    ]
    created_vlans = []
    for v_id, name, subnet, gw, desc in vlans_data:
        v = VLAN(
            vlan_id=v_id,
            name=name,
            subnet=subnet,
            gateway=gw,
            location_id=locations_dict["HK-DC1"].id,
            description=desc
        )
        db.add(v)
        created_vlans.append(v)
    db.flush()

    # Seed 60 sample IP records
    ip_records = []
    for i in range(1, 61):
        assigned_asset = saved_assets[i % len(saved_assets)] if i < 45 else None
        st = "Assigned" if assigned_asset else "Available" if i < 55 else "Reserved"
        ip_records.append(IPAddress(
            ip_address=f"10.200.100.{i}",
            ip_version="IPv4",
            subnet="10.200.100.0/24",
            vlan_id=created_vlans[1].id,
            status=st,
            asset_id=assigned_asset.id if assigned_asset else None,
            hostname=assigned_asset.hostname if assigned_asset else None,
            mac_address=assigned_asset.mac_address if assigned_asset else None,
            interface_name="GigabitEthernet1/0/1" if assigned_asset else None,
            description="Core backbone interface IP allocation" if assigned_asset else "Available pool address"
        ))
    db.bulk_save_objects(ip_records)
    db.flush()

    # 12. NETWORK TOPOLOGY CONNECTIONS
    connections = [
        # Core to Edge Firewalls
        (saved_assets[0].id, "Eth1/1", saved_assets[1].id, "Te1/0/48", "10G Fiber SFP+", "Active", "Primary Core-Firewall Trunk"),
        (saved_assets[5].id, "port1", saved_assets[1].id, "Te1/0/47", "10G Fiber SFP+", "Active", "Secondary DC2 Firewall Trunk"),
        # Core to Routers
        (saved_assets[1].id, "Te1/0/1", saved_assets[2].id, "GigabitEthernet0/0/0", "10G Fiber SFP+", "Active", "WAN Aggregation Uplink"),
        # Core to Huawei Switch
        (saved_assets[1].id, "Te1/0/2", saved_assets[4].id, "XGigabitEthernet0/0/1", "10G Fiber SFP+", "Active", "Distribution Link"),
        # Switch to Access Point
        (saved_assets[4].id, "GigabitEthernet0/0/12", saved_assets[3].id, "mGig1", "PoE+ 2.5G", "Active", "Executive Floor Wi-Fi AP Uplink")
    ]
    for src_id, s_port, tgt_id, t_port, c_type, st, notes in connections:
        conn = NetworkConnection(
            source_asset_id=src_id,
            source_port=s_port,
            target_asset_id=tgt_id,
            target_port=t_port,
            connection_type=c_type,
            bandwidth_gbps="10 Gbps",
            status=st,
            notes=notes
        )
        db.add(conn)
    db.flush()

    # 13. SPARE PARTS INVENTORY
    spares_raw = [
        ("SFP-10G-SR", "Cisco 10GBASE-SR SFP+ Transceiver Module", "SFP Modules", "Cisco", 45, 10, 1800.00, "HK-DC1 Spares Locker A"),
        ("SFP-10G-LR", "Cisco 10GBASE-LR Long Reach 10km SFP+", "SFP Modules", "Cisco", 18, 5, 3400.00, "HK-DC1 Spares Locker A"),
        ("PWR-C1-715WAC", "Cisco Catalyst 9300 715W AC Power Supply", "Power Supplies", "Cisco", 8, 3, 4200.00, "HK-DC2 Cabinet Spares"),
        ("PAN-PWR-3200-AC", "Palo Alto PA-3220 Redundant AC Power Supply", "Power Supplies", "Palo Alto", 6, 2, 5800.00, "HK-DC1 Spares Locker B"),
        ("FN-TRAN-SFP+SR", "Fortinet 10GE SFP+ SR Optical Transceiver", "Optics", "Fortinet", 24, 8, 1200.00, "Central HQ IT Storage"),
        ("QSFP-100G-SR4", "Arista 100GBASE-SR4 QSFP28 High-Speed Module", "Optics", "Arista", 12, 4, 8500.00, "Mega-i Cage 4 Spares"),
        ("CAB-LC-LC-10M", "Duplex LC-LC OM4 Multimode Fiber Patch Cord 10m", "Cables", "Cisco", 80, 20, 150.00, "All Sites Cable Trays"),
        ("SPARE-C9300-48P", "Cold Spare Cisco Catalyst 9300 48-port Switch Unit", "Spare Switches", "Cisco", 2, 1, 48000.00, "HK-DC1 Rapid Recovery Bay"),
        ("SPARE-FG100F", "Cold Spare Fortinet FortiGate 100F Appliance", "Spare Firewalls", "Fortinet", 1, 1, 28000.00, "HK-DC2 Rapid Recovery Bay")
    ]
    for p_num, name, cat, mfg, qty, min_l, cost, loc_s in spares_raw:
        v_obj = vendors_dict.get(mfg, list(vendors_dict.values())[0])
        sp = SparePart(
            part_number=p_num,
            name=name,
            category=cat,
            vendor_id=v_obj.id,
            quantity=qty,
            min_stock_level=min_l,
            unit_cost=cost,
            currency="HKD",
            stock_location=loc_s,
            status="In Stock" if qty > min_l else "Low Stock",
            compatibility=f"Compatible with enterprise {mfg} deployments"
        )
        db.add(sp)
    db.flush()

    # 14. INITIAL NOTIFICATIONS & AUDIT LOGS
    notifs = [
        ("Contract Expiration Warning", "Contract CT-2023-HKT-03 with HKT Enterprise Solutions expires in 28 days.", "Contract Expiration", "danger", "/contracts"),
        ("Warranty Renewal Required", "Warranty WAR-8F3D1A00 for Palo Alto FW-01-HK expires in 45 days.", "Warranty Expiration", "warning", "/assets/NA-000123"),
        ("Preventive Maintenance Scheduled", "Routine telemetry & optics diagnostics scheduled for Huawei SW-02-HK.", "Maintenance", "info", "/maintenance")
    ]
    for title, msg, cat, sev, link in notifs:
        n = Notification(
            user_id=created_users[0].id,
            title=title,
            message=msg,
            category=cat,
            severity=sev,
            is_read=False,
            link_url=link
        )
        db.add(n)

    audit_entry = AuditLog(
        user_id=created_users[0].id,
        user_email=admin_email,
        action="SYSTEM_INIT",
        entity_type="SYSTEM",
        entity_id="SYS-INIT-001",
        details="Network Asset Management System demo dataset initialized successfully.",
        ip_address="127.0.0.1"
    )
    db.add(audit_entry)
    db.commit()

    # 15. B2B CONNECTION PROFILES
    from app.db.seed_b2b import seed_b2b_connections
    seed_b2b_connections(db)

    db.close()
    print("[DB SEED] Demo dataset populated successfully.")

if __name__ == "__main__":
    seed_database()

