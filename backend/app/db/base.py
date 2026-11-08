from app.db.session import Base
from app.models.user import Role, Permission, User, UserRole, AuditLog, Notification, AlertSetting, AlertDispatchLog, AlertRule
from app.models.vendor import Vendor
from app.models.location import Location, Building, Floor, Rack
from app.models.contract import Contract, AssetContract, Warranty
from app.models.asset import DeviceCategory, DeviceModel, OwnershipType, Asset, NetworkInterface, AssetDocument, AssetHistory
from app.models.network import VLAN, IPAddress, NetworkConnection
from app.models.maintenance import MaintenanceRecord
from app.models.inventory import SparePart, SpareStockTransaction

