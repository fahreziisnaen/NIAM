# Phillip Securities Hong Kong – Network Asset Management System

An enterprise-grade, full-stack network infrastructure asset management platform custom-built for **Phillip Securities (Hong Kong) Limited**.

This production-ready system manages the company's complete network infrastructure inventory, hardware lifecycle, procurement records, vendor relationships, maintenance contracts, rental equipment, IP address management (IPAM), datacenter rack elevation layouts, and network topology across primary datacenters (**Mega-i Chai Wan**, **Equinix HK1**), **Central HQ (Exchange Square)**, branch offices, and **Disaster Recovery Site (Tsuen Wan)**.

Browser Title: `PSHK | Network Asset Management System`

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

## 2. Technology Stack & Security Baseline

### Frontend
- **Framework**: Next.js 14.2.35 (LTS Security Backport, App Router, TypeScript, React 18)
- **Styling**: Tailwind CSS with enterprise corporate navy palette (`#0A192F`, `#1E60D5`)
- **Icons**: Lucide React
- **Data Visualization**: Recharts (Donut Pie Charts, Smooth Multi-line Charts)
- **UI Components**: `SearchableSelect` with automatic live search whenever options count exceeds 10 items
- **Security Hardening**: Enterprise HTTP headers (`Strict-Transport-Security`, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`), disabled `X-Powered-By`, disabled SVG/AVIF execution in Image Optimization API

### Backend
- **Framework**: Python 3.11+ / FastAPI (`>=0.115.0`) & Uvicorn (`>=0.30.0`)
- **ORM**: SQLAlchemy 2.0+ (Declarative 25+ Relational Model Architecture)
- **Data Validation**: Pydantic v2 (`>=2.8.0`)
- **Database Migrations**: Alembic
- **Security & Cryptography**: `pyjwt>=2.15.1`, `bcrypt>=4.1.0`, `cryptography>=43.0.0`, Role-Based Access Control (RBAC), RFC 6238 TOTP Google Authenticator
- **File Upload Security**: `python-multipart>=0.0.33`, sanitized filenames (CWE-22 mitigation), whitelist extension validation, 25MB upload limit
- **Reporting & Data Export**: `openpyxl>=3.1.5` protected with `defusedxml>=0.7.1` (anti-XXE / XML bomb), CSV streaming, Printable HTML/PDF
- **Networking & Webhooks**: `httpx>=0.28.0` and `requests>=2.32.5` with SSRF destination validation

### Database & Storage
- **Primary Database**: PostgreSQL 16 (`postgres:16-alpine`, port bound locally to `127.0.0.1:5432`)
- **Document Storage**: Local filesystem abstraction with path traversal checks

---

## 3. Application Navigation & Interactive Modules

All 11 modules and their respective sub-menus are fully functional, responsive, and cross-linked:

| Module | Route / Sub-menu | Description & Interactive Features |
|---|---|---|
| **1. Dashboard** | `/` (`dashboard`) | Executive real-time KPI overview, donut distribution, timeline chart, inventory table, and quick actions. |
| **2. Assets** | `/assets`<br>• All Assets<br>• Network Devices<br>• Asset Categories<br>• Asset Models<br>• Asset Ownership | Hardware registry with multi-field search, column toggles, export, and **7-Tab Asset Detail Profile**. Filters by Deployed, Category architecture, Model EOL/EOS lifecycle, and Rental capitalization. |
| **3. Contracts** | `/contracts`<br>• All Contracts<br>• Rental Agreements<br>• Maintenance Contracts<br>• Support Contracts<br>• Contract Expiration | Purchase contracts, rental agreements, maintenance SLAs, software subscriptions, and 90/60/30/7-day expiration alerts. |
| **4. Vendors** | `/vendors` | Interactive vendor master directory with clickable cards opening the **Vendor Detail Modal** (contact details, support hotlines, contracts list, and all supplied assets). |
| **5. Locations** | `/locations`<br>• Sites<br>• Buildings<br>• Floors<br>• Data Centers<br>• Racks | Hierarchical facility tracker: Country → Site → Building → Floor → Room → 42U Visual Rack Elevation. **Every level is clickable** (Site Detail, Building Detail, and Rack Detail modals) with direct device inspection. |
| **6. Topology** | `/topology` | Interactive network relationship graph linking Core Switches, NGFWs, Edge Routers, and Wi-Fi APs with Zoom controls and "Add Connection" modal. |
| **7. IPAM** | `/ipam` | High-scalability IP address management supporting **>100 VLANs** with instant VLAN Quick-Jump (`SearchableSelect`), Range Quick-Filter chips (1-99, 100-199, etc.), Dual View Modes (Dense Table vs Visual Cards), and paginated IP allocation. |
| **8. Maintenance** | `/maintenance` | Preventive, corrective, and emergency repair tickets, downtime tracking, root cause resolutions, and "New Work Order" modal. |
| **9. Spare Parts** | `/spares` | Buffer stock of SFP+ transceivers, optics, power supplies, cables, check-in/check-out ledger, and "Add Spare Part" modal. |
| **10. Reports** | `/reports`<br>• Asset Register<br>• Rental Report<br>• Contract Register<br>• EOL/EOS Report | 12 regulatory and operations reports with live preview and downloadable Excel (`.xlsx`) & CSV formats + PDF printing. |
| **11. Settings** | `/settings`<br>• User Management<br>• Roles & Permissions<br>• Audit Logs<br>• System Configuration | User provisioning, Role-Based Access Control (RBAC) matrix, immutable audit logs, and Alert Gateway configuration (dual channel toggles for Email and API/WhatsApp). |

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

## 5. Authentication & Production Administrator Account

### A. Role Accounts & Credentials
The system provides role-based access control (RBAC). Email is strictly **optional**; users authenticate with their unique **Username** and **Password**:

| Role | Username | Default Demo Password | Recommended Primary Focus |
|---|---|---|---|
| **SUPER ADMIN** | `admin` | `Phillip2026!` *(Ganti di Production)* | Full system administration, user management, audit logs, alert gateway configuration. |
| **NETWORK ADMIN** | `netadmin` | `Phillip2026!` *(Ganti di Production)* | Core/Distribution/Access switches, firewalls, topology maps, IPAM, and maintenance. |
| **ASSET MANAGER** | `assetmgr` | `Phillip2026!` *(Ganti di Production)* | Asset lifecycle, procurement records, serial numbers, models, and locations. |
| **CONTRACT MANAGER** | `contractmgr` | `Phillip2026!` *(Ganti di Production)* | Master contracts, rental agreements, maintenance warranties, and renewals. |
| **VIEWER** | `viewer` | `Phillip2026!` *(Ganti di Production)* | Read-only inspection, compliance auditing, reporting exports. |

### B. Setting Production Admin Password Before First Deployment
Before running the initial database creation, define your custom credentials in `.env`:
```ini
INITIAL_ADMIN_USERNAME=admin
INITIAL_ADMIN_PASSWORD=PasswordRahasiaAnda2026!
INITIAL_ADMIN_EMAIL=noc@phillip.com.hk
```
When Docker starts, the backend will initialize the database and immediately set your chosen password.

### C. Changing Password via Web UI (Kapan Saja)
1. Login to the application as `admin`.
2. Click your **User Profile Avatar / Settings** in the top right header.
3. Under **Change Password**, provide your current password and desired new password (min. 6 characters).
4. Click **Save Changes** — the password is immediately hashed with `bcrypt` and saved.

### D. Resetting Admin Password via Docker CLI (Jika Lupa Password)
You can reset the admin password directly from the server terminal without touching code:
```bash
# Non-interactive:
docker exec -it phillip_backend python reset_admin_password.py "PasswordBaruAnda123!"

# Interactive (password is hidden as you type):
docker exec -it phillip_backend python reset_admin_password.py
```

### E. Two-Factor Authentication (2FA / Google Authenticator)
- Built-in RFC 6238 TOTP compliant authentication engine (`pyotp`).
- Self-contained, zero-dependency offline QR Code generator (`qrcode[pil]`).
- QR code is rendered directly in corporate navy `#0A192F` and white via Base64 PNG Data URL.
- One-click copyable secret setup key fallback.
- Setup modal available directly from the User Profile dropdown and **Settings → User Management & 2FA**.

---

## 6. Interactive Notifications & Alert Gateway (Email & API)

### A. Clickable Notification Detail Modal
Clicking any alert from the notification bell popover opens the **Notification Detail Modal**:
- Real-time severity badges (*Critical/Danger, Warning, Info*).
- Full event description, timestamp, and linked resource (Contract ID, Asset ID, or Maintenance Ticket).
- Direct one-click navigation to the linked record.

### B. Outbound Alert Dispatch to Email & API Gateway
NOC operators can immediately dispatch alerts directly from the notification modal:
- **Email Channel**: Formatted enterprise HTML & plaintext notification sent to NOC email distribution lists.
- **API Webhook Channel (WhatsApp / SMS Gateway)**:
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
- **Independent Channel Activation Toggles**:
  - Operators can choose to activate **Email only**, **API/WhatsApp only**, or **both channels simultaneously**.
  - Centralized gateway configuration in **Settings → System Configuration** with an integrated **"Send Test Alert"** button and live dispatch audit logs.

---

## 7. Security Hardening & Vulnerability (CVE) Mitigations

The codebase has undergone comprehensive security hardening against recent known vulnerabilities:

1. **Next.js & PostCSS Upgrades:**
   - Next.js updated to `14.2.35` (mitigates `CVE-2026-96889`, `CVE-2026-94482`, and `GHSA-p293-qw3h-jr36`).
   - PostCSS overridden to `8.5.32` (mitigates `GHSA-6g55-p6wh-862q` and `GHSA-r28c-9q8g-f849` arbitrary file disclosure).
2. **Backend Library Pinning:**
   - `python-multipart>=0.0.33` (mitigates `CVE-2026-42561` DoS and `CVE-2026-24486` file write).
   - `pyjwt>=2.15.1` (mitigates `CVE-2026-102268` critical signature bypass / algorithm confusion).
   - `requests>=2.32.5` (mitigates `CVE-2024-35195` TLS state leak and `CVE-2024-47081` credential leak).
   - `defusedxml>=0.7.1` (protects `openpyxl` against XML bombs and external entity attacks).
3. **CWE-22 (Path Traversal Protection on Document Uploads):**
   - Strictly sanitizes filenames (`sanitize_filename`), strips path separators (`../`), enforces whitelist extensions (`.pdf`, `.docx`, `.xlsx`, `.png`, etc.), and caps file sizes at 25MB.
4. **CWE-942 (CORS Hardening):**
   - Eliminates permissive wildcard `*` with credentials. Origins are restricted to trusted domains defined via `settings.BACKEND_CORS_ORIGINS` / `CORS_ORIGINS`.
5. **CWE-918 (SSRF Mitigation on Alert Webhooks):**
   - Validates webhook URLs to block cloud metadata endpoints (`169.254.169.254`) and loopback/private addresses.
6. **Container & Database Isolation:**
   - PostgreSQL port `5432` is bound strictly to `127.0.0.1:5432` to prevent internet exposure.

---

## 8. Quick Start & Execution

### Option A: Production Docker Compose Deployment (Recommended)

To deploy the entire production stack (PostgreSQL 16 + FastAPI + Next.js 14) in isolated containers:

```bash
# 1. Clone repository & copy environment configuration
git clone https://github.com/fahreziisnaen/NIAM.git
cd "NIAM"
cp .env.example .env

# 2. Adjust .env for Production:
#    - APP_ENV=production
#    - SEED_DEMO_DATA=false (clean database)
#    - SHOW_DEMO_CREDENTIALS=false
#    - INITIAL_ADMIN_PASSWORD=YourSecurePassword
#    - POSTGRES_PASSWORD=YourDbPassword
#    - SECRET_KEY=YourLongRandomSecretKey
nano .env

# 3. Build and launch all services in background
docker compose up -d --build

# 4. Check container status
docker compose ps
```

- Web Application: `http://localhost:3000` (or your domain/reverse proxy)
- Backend API Docs: `http://localhost:8000/api/v1/docs`

#### How to Update Production Containers:
```bash
git pull origin main
docker compose up -d --build
```

---

### Option B: Local Direct Execution (Development)

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
npm ci
npm run build
npm run start -- -p 3000
```
- Frontend Web Application: `http://localhost:3000`

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
