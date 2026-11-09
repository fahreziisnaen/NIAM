import sys
from app.db.session import SessionLocal
from app.models.asset import Asset, NetworkInterface, AssetDocument, AssetHistory
from app.models.contract import Contract, AssetContract, Warranty
from app.models.network import NetworkConnection, IPAddress, VLAN
from app.models.maintenance import MaintenanceRecord
from app.models.inventory import SparePart, SpareStockTransaction
from app.models.user import AuditLog, Notification

def purge_demo_data():
    """
    Purges all demo assets, contracts, maintenance logs, topology links,
    and IPAM dump records while preserving administrative user accounts,
    roles, permissions, categories, locations, and alert configurations.
    """
    db = SessionLocal()
    print("[Production Clean] Starting demo data purge...")

    try:
        # 1. Delete asset associations and contracts
        cnt_ac = db.query(AssetContract).delete()
        cnt_ct = db.query(Contract).delete()
        cnt_wr = db.query(Warranty).delete()
        print(f" -> Removed {cnt_ac} asset-contract links, {cnt_ct} contracts, {cnt_wr} warranties")

        # 2. Delete network topology & IPAM dump
        cnt_nc = db.query(NetworkConnection).delete()
        cnt_ip = db.query(IPAddress).delete()
        cnt_vl = db.query(VLAN).delete()
        print(f" -> Removed {cnt_nc} topology interconnects, {cnt_ip} IP addresses, {cnt_vl} VLANs")

        # 3. Delete maintenance and spare parts dump
        cnt_mr = db.query(MaintenanceRecord).delete()
        cnt_st = db.query(SpareStockTransaction).delete()
        cnt_sp = db.query(SparePart).delete()
        print(f" -> Removed {cnt_mr} maintenance records, {cnt_sp} spare parts ({cnt_st} transactions)")

        # 4. Delete assets and subordinate relations
        cnt_ni = db.query(NetworkInterface).delete()
        cnt_ad = db.query(AssetDocument).delete()
        cnt_ah = db.query(AssetHistory).delete()
        cnt_as = db.query(Asset).delete()
        print(f" -> Removed {cnt_as} demo assets (with {cnt_ni} interfaces, {cnt_ad} documents, {cnt_ah} history logs)")

        # 5. Clear audit and notifications
        cnt_nt = db.query(Notification).delete()
        print(f" -> Cleared {cnt_nt} demo notifications")

        db.commit()
        print("[Production Clean] SUCCESS: System is now 100% clean and ready for production asset onboarding!")
    except Exception as e:
        db.rollback()
        print(f"[Production Clean ERROR] Failed to clean demo data: {e}", file=sys.stderr)
        raise
    finally:
        db.close()

if __name__ == "__main__":
    purge_demo_data()
