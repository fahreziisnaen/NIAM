from app.db.session import SessionLocal
from app.models.asset import Asset
from app.models.contract import Contract, AssetContract

def reassociate_contracts():
    db = SessionLocal()
    print("Clearing old asset_contracts...")
    db.query(AssetContract).delete()
    db.commit()

    assets = db.query(Asset).filter(Asset.is_deleted == False).all()
    contracts = db.query(Contract).order_by(Contract.id).all()
    print(f"Loaded {len(assets)} assets and {len(contracts)} contracts.")

    cisco_assets = [a for a in assets if a.manufacturer == 'Cisco']
    palo_assets = [a for a in assets if a.manufacturer == 'Palo Alto']
    aruba_assets = [a for a in assets if a.manufacturer == 'Aruba']
    fortinet_assets = [a for a in assets if a.manufacturer == 'Fortinet']
    juniper_assets = [a for a in assets if a.manufacturer == 'Juniper']
    huawei_assets = [a for a in assets if a.manufacturer == 'Huawei']
    checkpoint_assets = [a for a in assets if a.manufacturer == 'Check Point']
    f5_assets = [a for a in assets if a.manufacturer == 'F5']
    arista_assets = [a for a in assets if a.manufacturer == 'Arista']
    rental_assets = [a for a in assets if a.ownership_type in ['Rental', 'Leased']]
    mega_i_assets = [a for a in assets if a.location and 'DC1' in (a.location.code or '')]
    pccw_assets = [a for a in assets if a.location and 'DC2' in (a.location.code or '')]

    new_links = []
    def link(c_id, asset_list, note='Hardware Support & SLA Coverage'):
        for a in asset_list:
            new_links.append(AssetContract(asset_id=a.id, contract_id=c_id, coverage_notes=note))

    # 1: Palo Alto WildFire (38 firewalls)
    link(1, palo_assets[:38], '24x7 WildFire Cloud Threat Prevention')
    # 24: Palo Alto Secondary Support (remaining 32 firewalls)
    link(24, palo_assets[38:], '24x7x4hr Mission Critical TAC & Spare Delivery')

    # 2: Cisco SMARTnet Campus Core (240 devices)
    link(2, cisco_assets[:240], 'Cisco SMARTnet 24x7x4 On-site Parts & Labor')
    # 23: Cisco Edge & Access Hardware Support (remaining 240 devices)
    link(23, cisco_assets[240:], 'Cisco Edge Switching & Wi-Fi SLA Coverage')

    # 3: HKT Metro Ethernet & Leased Switch Rental Pack A (38 rental devices)
    link(3, rental_assets[:38], 'HKT Leased CPE Router & Metro Switch Rental')
    # 12: HKT Corporate Infrastructure (34 rental devices)
    link(12, rental_assets[38:72], 'HKT Enterprise Network Infrastructure Maintenance')
    # 20: HKT Hardware Support (28 rental devices)
    link(20, rental_assets[72:100], 'HKT Dedicated Internet Access Hardware Support')

    # 4: Fortinet Enterprise Security Fabric (48 firewalls)
    link(4, fortinet_assets[:48], 'FortiCare 24x7 Security Fabric Subscription')
    # 21: Fortinet SD-WAN Leasing Agreement (remaining 35 firewalls)
    link(21, fortinet_assets[48:], 'FortiGate Secure SD-WAN Appliance Lease')

    # 5: Huawei Enterprise Care Support Package (60 devices)
    link(5, huawei_assets[:60], 'Huawei Care 24x7x4 Mission Critical Support')
    # 25: Huawei Hardware Care (55 devices)
    link(25, huawei_assets[60:115], 'Huawei Enterprise Campus Switching Support')
    # 30: Huawei Rental Agreement (46 devices)
    link(30, huawei_assets[115:], 'Huawei Leased Switch & Router Agreement')

    # 6: Aruba Central Cloud Wireless Management License (72 wireless APs)
    link(6, aruba_assets[:72], 'Aruba Central Cloud Management & Firmware Subscription')
    # 15: Aruba Hardware Support (22 switches)
    link(15, aruba_assets[72:94], 'Aruba Foundation Care 24x7x4hr Replacement')
    # 18: Aruba Purchase Contract (remaining 15 switches)
    link(18, aruba_assets[94:], 'Aruba Campus Switching Purchase & Warranty')

    # 7: Juniper Care Core Plus Hardware Maintenance (98 devices)
    link(7, juniper_assets[:98], 'Juniper Care 24x7x4hr Mission Critical Core Support')
    # 17: Juniper Campus Switch Purchase (remaining 90 devices)
    link(17, juniper_assets[98:], 'Juniper EX Series Campus Switching Warranty')

    # 8: Equinix Cross Connect & Rental Cabinet Switch SLA (52 rental devices)
    link(8, rental_assets[100:152], 'Equinix HK1/HK2 Leased Cabinet Switch & Interconnect SLA')
    # 28: Equinix Maintenance (38 rental devices)
    link(28, rental_assets[152:190], 'Equinix Facility Switching Infrastructure Maintenance')
    # 29: Equinix Leasing Agreement (32 rental devices)
    link(29, rental_assets[190:222], 'Equinix Datacenter Cross-Connect & Patch Lease')

    # 9: Check Point Quantum Threat Prevention (18 devices)
    link(9, checkpoint_assets[:18], 'Check Point Direct Support & Quantum Threat Prevention')
    # 27: Check Point Leasing Agreement (remaining 16 devices)
    link(27, checkpoint_assets[18:], 'Check Point Perimeter Gateway Lease')

    # 10: F5 BIG-IP Application Delivery (12 devices)
    link(10, f5_assets[:12], 'F5 Premium Plus 24x7 Support & DNS Services')
    # 22: F5 Advanced WAF (11 devices)
    link(22, f5_assets[12:23], 'F5 Advanced WAF & Bot Defense Subscription')
    # 26: F5 DNS & GTM (10 devices)
    link(26, f5_assets[23:33], 'F5 Global Traffic Management License')
    # 32: F5 Application Security (remaining 10 devices)
    link(32, f5_assets[33:], 'F5 SSL Orchestration & DDoS Protection')

    # 11, 13, 14, 19: Dell Server Hardware Agreements (split 80 Arista/Appliance nodes)
    link(11, arista_assets[:20], 'Enterprise Spine-and-Leaf High Speed Fabric Agreement')
    link(13, arista_assets[20:40], 'Datacenter Low-Latency Core Switching SLA')
    link(14, arista_assets[40:60], 'Trading Network Fabric Leaf Switch Lease')
    link(19, arista_assets[60:80], 'Out-of-Band Management & Compute Node Purchase')

    # 16: PCCW Global Transit SLA (28 devices in DC2)
    link(16, (pccw_assets[:28] if len(pccw_assets) >= 28 else assets[:28]), 'PCCW Global Tier-1 BGP IP Transit & Edge Gateway SLA')

    # 31: SUNeVision Mega-i Managed SLA (46 devices in DC1)
    link(31, (mega_i_assets[:46] if len(mega_i_assets) >= 46 else assets[28:74]), 'MEGA-i Carrier-Neutral Meet-Me-Room Managed SLA')

    db.bulk_save_objects(new_links)
    db.commit()
    print(f"Successfully re-associated {len(new_links)} realistic asset-contract links across all 32 contracts!")

if __name__ == "__main__":
    reassociate_contracts()

