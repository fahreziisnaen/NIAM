# Phillip Securities Hong Kong – Network Infrastructure Asset Management System

An enterprise-grade, full-stack network infrastructure asset management platform custom-built for **Phillip Securities (Hong Kong) Limited**.

This production-ready system manages the company's complete network infrastructure inventory, hardware lifecycle, procurement records, vendor relationships, maintenance contracts, rental equipment, IP address management (IPAM), datacenter rack elevation layouts, and network topology across primary datacenters (**Mega-i Chai Wan**, **Equinix HK1**), **Central HQ (Exchange Square)**, branch offices, and **Disaster Recovery Site (Tsuen Wan)**.

---

## 1. Visual Reference & Design Compliance

The application strictly adheres to the corporate navy blue and white enterprise visual identity:
- **Vertical Sidebar**: `#0A192F` dark navy vertical navigation with `#1E60D5` active states and a subtle Hong Kong skyline watermark.
- **Top Header**: Phillip Securities grid **P** branding, application title, global search bar (`Search by SN, hostname, IP, or asset ID...`), notification bell (badge with live unread counter), and user profile avatar (`JD`).
- **Real-Time KPI Cards**:
  1. **Total Assets**: `1,248` (`↑ +2% vs last month`)
  2. **Company Owned**: `876` (`70.2% of inventory`)
  3. **Rental / Leased**: `372` (`29.8% of inventory`)
  4. **Active Contracts**: `32` (`Expiring soon: 8`)
- **Donut Chart**: Asset Distribution (Switches `42%`, Routers `22%`, Firewalls `15%`, Wireless `13%`, Others `8%`).
- **Attention Required**: Real-time alerts for contracts expiring within 90 days (`8`), warranties expiring within 90 days (`14`), and devices in maintenance (`6`).
- **Contract Timeline**: Smooth line chart showing contract and warranty renewal trends across Nov, Dec, Jan, Feb, and Mar.
- **Network Device Inventory Table**: Paginated modern table showing `NA-000123` to `NA-000128` (Palo Alto `PA-3220`, Cisco `C9300-48P`, Cisco `ISR4431`, Cisco `C9130AXI`, Huawei `S5735`, Fortinet `FortiGate 100F`) with operational status dots and ownership pills.
- **Quick Links & Key Information**: 2x2 action grid and facility summary with Victoria Harbour waterfront backdrop.

---

## 2. Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router, TypeScript, React 18)
- **Styling**: Tailwind CSS with enterprise corporate navy palette (`#0A192F`, `#1E60D5`)
- **Icons**: Lucide React
- **Data Visualization**: Recharts (Donut Pie Charts, Smooth Multi-line Charts)
- **Architecture**: Modular components, reactive state management, zero mock arrays (100% backend REST API integrated)

### Backend
- **Framework**: Python 3.11+ / FastAPI
- **ORM**: SQLAlchemy 2.0+ (Declarative 25+ Relational Model Architecture)
- **Data Validation**: Pydantic v2
- **Database Migrations**: Alembic
- **Security**: JWT Bearer Tokens, Bcrypt password hashing, Role-Based Access Control (RBAC), RFC 6238 TOTP Google Authenticator
- **Reporting Engine**: `openpyxl` (Native Excel `.xlsx`), CSV streaming, Printable HTML/PDF
- **Networking**: `httpx` & `requests` for outbound webhook/API dispatch

### Database & Storage
- **Primary Database**: PostgreSQL 16 (with SQLite zero-dependency fallback for standalone demonstration)
- **Document Storage**: Local filesystem abstraction with pluggable S3/MinIO cloud adapter

---

## 3. Application Navigation & Modules

All 11 modules and their respective sub-menus are fully functional:

| Module | Route / Sub-menu | Description |
|---|---|---|
| **1. Dashboard** | `/` (`dashboard`) | Executive real-time KPI overview, donut distribution, timeline chart, inventory table, and quick actions. |
| **2. Assets** | `/assets`<br>• All Assets<br>• Network Devices<br>• Asset Categories<br>• Asset Models<br>• Asset Ownership | Hardware registry with multi-field search, column toggles, export, and **7-Tab Asset Detail Profile**. Filters by Deployed, Category architecture, Model EOL/EOS lifecycle, and Rental capitalization. |
| **3. Contracts** | `/contracts`<br>• All Contracts<br>• Rental Agreements<br>• Maintenance Contracts<br>• Support Contracts<br>• Contract Expiration | Purchase contracts, rental agreements, maintenance SLAs, software subscriptions, and 90/60/30/7-day expiration alerts. |
| **4. Vendors** | `/vendors` | Vendor master database for Cisco, Palo Alto, Fortinet, Huawei, Juniper, Aruba, HKT, Equinix, and PCCW with "Add Vendor" modal. |
| **5. Locations** | `/locations`<br>• Sites<br>• Buildings<br>• Floors<br>• Data Centers<br>• Racks | Hierarchical facility tracker: Country → Site → Building → Floor → Room → 42U Visual Rack Elevation with dual PDU telemetry. |
| **6. Topology** | `/topology` | Interactive network relationship graph linking Core Switches, NGFWs, Edge Routers, and Wi-Fi APs with Zoom controls and "Add Connection" modal. |
| **7. IPAM** | `/ipam` | IPv4/IPv6 address allocations, subnet planner, VLAN tags, duplicate IP conflict validation, and "Assign IP Address" modal. |
| **8. Maintenance** | `/maintenance` | Preventive, corrective, and emergency repair tickets, downtime tracking, root cause resolutions, and "New Work Order" modal. |
| **9. Spare Parts** | `/spares` | Buffer stock of SFP+ transceivers, optics, power supplies, cables, check-in/check-out ledger, and "Add Spare Part" modal. |
| **10. Reports** | `/reports`<br>• Asset Register<br>• Rental Report<br>• Contract Register<br>• EOL/EOS Report | 12 regulatory and operations reports with live preview and downloadable Excel (`.xlsx`) & CSV formats + PDF printing. |
| **11. Settings** | `/settings`<br>• User Management<br>• Roles & Permissions<br>• Audit Logs<br>• System Configuration | User provisioning, Role-Based Access Control (RBAC) matrix, immutable audit logs, and Alert Gateway configuration. |

---

## 4. Asset Detail Profile (7-Tab Specification)

Clicking the **Eye** icon or table row on any asset opens its comprehensive 7-tab profile modal:
- **Tab 1 – Overview**: Asset ID (`NA-000123`), Hostname (`FW-01-HK`), Serial Number, Asset Tag, Hardware specs, Operational status, Datacenter placement.
- **Tab 2 – Technical Details**: Management IP, MAC Address, Operating System, Firmware Version, Configured physical & virtual interfaces.
- **Tab 3 – Contracts & Warranty**: Linked enterprise contracts, SLA response levels, warranty expiration dates, and rental terms.
- **Tab 4 – Network Relationships**: Uplink/downlink interconnects, neighbor hostnames, port channels, and bandwidth.
- **Tab 5 – Maintenance History**: Complete repair ledger with ticket numbers, technicians dispatched, root causes, and costs.
- **Tab 6 – Documents**: Uploaded datasheets, configuration backups (`running_config.cfg`), and warranty certificates.
- **Tab 7 – Audit History**: Immutable chronological audit log of field changes, previous values, new values, and user identities.

---

## 5. Authentication & Two-Factor Authentication (2FA)

The system supports enterprise authentication using **Username and Password**, with **Email being completely optional**:

| Role | Username | Email (Optional) | Password | 2FA Capability |
|---|---|---|---|---|
| **SUPER ADMIN** | `admin` | `admin@phillip.com.hk` (or None) | `Phillip2026!` | Google Authenticator (TOTP) |
| **NETWORK ADMIN** | `netadmin` | `netadmin@phillip.com.hk` (or None) | `Phillip2026!` | Google Authenticator (TOTP) |
| **ASSET MANAGER** | `assetmgr` | `assetmgr@phillip.com.hk` (or None) | `Phillip2026!` | Google Authenticator (TOTP) |
| **CONTRACT MANAGER** | `contractmgr` | `contractmgr@phillip.com.hk` (or None) | `Phillip2026!` | Google Authenticator (TOTP) |
| **VIEWER** | `viewer` | `viewer@phillip.com.hk` (or None) | `Phillip2026!` | Google Authenticator (TOTP) |

### 2FA Google Authenticator Setup & QR Code
- Built-in RFC 6238 TOTP compliant authentication engine (`pyotp`).
- Self-contained, zero-dependency offline QR Code generator (`qrcode[pil]`).
- QR code is rendered directly in high-contrast corporate navy `#0A192F` and white via Base64 PNG Data URL.
- One-click copyable secret setup key fallback.
- Setup modal available directly from the User Profile dropdown and **Settings → User Management & 2FA**.
- When 2FA is active, login requests transition seamlessly to 6-digit TOTP validation before issuing JWT bearer tokens.

---

## 6. Mobile Responsiveness & Off-Canvas Navigation

The application features full mobile and tablet responsiveness:
- **Desktop (≥ 1024px)**: Preserves the standard fixed vertical dark navy `#0A192F` sidebar (224px / `w-56`).
- **Mobile & Tablet (< 1024px)**: Automatically switches to an off-canvas **Slide-Over Drawer** (`w-64`) with:
  - Touch-friendly hamburger button in the top white header.
  - Dark backdrop overlay with tap-to-dismiss.
  - Auto-closing when selecting any module or sub-menu.
- **Adaptive Header & Tables**:
  - Truncated titles on narrow viewports to prevent horizontal overflow.
  - Responsive search input and safe popover dimensions (`max-w-xs sm:w-80`).
  - Horizontal swipeable modern tables with scroll indicators.
  - Multi-tab asset profile modal with horizontal scrollable tab pills.

---

## 7. Interactive Notifications & Alert Gateway (Email & API)

### A. Clickable Notification Detail Modal
Clicking any alert from the notification bell popover opens the **Notification Detail Modal**:
- Real-time severity badges (*Critical/Danger, Warning, Info*).
- Full event description, timestamp, and linked resource (Contract ID, Asset ID, or Maintenance Ticket).
- Direct one-click navigation to the linked record.
- Mark as Read action.

### B. Outbound Alert Dispatch to Email & API Gateway
NOC operators can immediately dispatch alerts directly from the notification modal:
- **Email Channel**: Formatted enterprise HTML & plaintext notification sent to NOC email distribution lists.
- **API Webhook Channel (WhatsApp Gateway)**:
  - **Header**:
    ```http
    Authorization: Bearer <API_KEY>
    Content-Type: application/json
    ```
  - **Body JSON Format**:
    ```json
    {
      "id": "628123456789",
      "message": "Halo Dunia!",
      "from": "respon"
    }
    ```
- **Centralized Gateway Configuration**:
  - Manage default endpoint, Bearer API Key, target number (`id`), sender (`from`), and email recipients in **Settings → System Configuration**.
  - Includes an integrated **"Send Test Alert"** button with real-time delivery logs.

---

## 8. Quick Start & Execution

### Option A: Local Direct Execution (Currently Running)

#### 1. Backend (FastAPI)
```bash
cd backend
python -m pip install -r requirements.txt
python -m alembic upgrade head
python -m app.db.seed
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
- API Base URL: `http://127.0.0.1:8000`
- Swagger Interactive Documentation: `http://127.0.0.1:8000/api/v1/docs`

#### 2. Frontend (Next.js 14)
```bash
cd frontend
npm install
npm run build
npm run start -- -p 3000
```
- Frontend Web Application: `http://localhost:3000`

---

### Option B: Docker Compose Deployment

To deploy the entire production stack (PostgreSQL 16 + FastAPI + Next.js 14) in isolated containers:

```bash
# 1. Copy sample environment file
cp .env.example .env

# 2. Build and start all services
docker compose up -d --build

# 3. Check container status
docker compose ps
```

The database will be automatically initialized and seeded on first startup.

---

## 9. Automated Test Suite

A comprehensive automated test suite verifies all core functionality:

```bash
cd backend
python -m unittest tests/test_api.py
```

### Verified Test Cases:
- `test_01_health_check`: API service availability and version response.
- `test_02_dashboard_kpis`: Database count validation (1,248 assets, 876 company owned, 372 rental, 32 contracts, 14 vendors, 6 locations, 6 in maintenance, 14 expiring warranties).
- `test_03_assets_pagination_and_reference_item`: Verifies `NA-000123 FW-01-HK PA-3220` Palo Alto Deployed asset.
- `test_04_asset_detail_7_tabs`: Verifies all 7 tabs data structures (contracts, warranties, interfaces, maintenance, documents, audit, topology).
- `test_05_contracts_and_expirations`: Verifies contract count and expiration tracking.
- `test_06_vendors_directory`: Verifies 14 enterprise vendor records.
- `test_07_locations_hierarchy`: Verifies 6 sites and 42U rack layouts.
- `test_08_topology_graph`: Verifies network graph nodes and interconnect links.
- `test_09_ipam_vlans_and_addresses`: Verifies VLAN subnets and IP allocation.
- `test_10_reports_catalog`: Verifies all 12 regulatory reports definitions.
- `test_11_csv_export`: Verifies live streaming CSV export generation.

---

## 10. Complete Workflow Guide

For a thorough step-by-step user manual detailing every operational workflow across all 11 modules, consult:
👉 **[`USER_WORKFLOW_GUIDE.md`](./USER_WORKFLOW_GUIDE.md)**

---

## 11. Regulatory Notice & Disclaimer
This system uses realistic demonstration serial numbers, IP allocations, and contract identifiers for internal development and operational simulation. No actual customer account or confidential trading records from Phillip Securities Hong Kong are stored.
