# Phillip Securities Hong Kong – Network Asset Management System
## Standard Operating Procedures (SOP) & Comprehensive User Workflow Guide

---

### Document Overview
This document serves as the official, comprehensive operational manual for the **Phillip Securities (Hong Kong) Limited Network Asset Management System**. It provides step-by-step workflows for Network Operations Center (NOC) engineers, datacenter technicians, enterprise asset managers, procurement teams, contract administrators, and IT compliance auditors.

---

## Table of Contents
1. [System Access, Authentication & Two-Factor Authentication (2FA)](#1-system-access-authentication--two-factor-authentication-2fa)
2. [NOC Executive Dashboard & Daily Monitoring](#2-noc-executive-dashboard--daily-monitoring)
3. [Network Asset Lifecycle Management (The 7-Tab Profile)](#3-network-asset-lifecycle-management-the-7-tab-profile)
4. [Contract & Rental Agreement Management](#4-contract--rental-agreement-management)
5. [Vendor Master Directory Management](#5-vendor-master-directory-management)
6. [Datacenter Facilities & 42U Visual Rack Elevation](#6-datacenter-facilities--42u-visual-rack-elevation)
7. [Interactive Network Topology & Link Interconnects](#7-interactive-network-topology--link-interconnects)
8. [IP Address Management (IPAM) & Subnet Planner](#8-ip-address-management-ipam--subnet-planner)
9. [Maintenance Work Orders & Incident Remediation](#9-maintenance-work-orders--incident-remediation)
10. [Spare Parts Inventory & Buffer Stock Control](#10-spare-parts-inventory--buffer-stock-control)
11. [Regulatory Compliance Reporting & Data Export](#11-regulatory-compliance-reporting--data-export)
12. [Notification Center & Outbound Alert Gateway (Email & API)](#12-notification-center--outbound-alert-gateway-email--api)
13. [Mobile & Tablet On-Site Inspection Workflow](#13-mobile--tablet-on-site-inspection-workflow)
14. [Troubleshooting & Operational FAQ](#14-troubleshooting--operational-faq)
15. [Docker Compose Production Deployment & Operations](#15-docker-compose-production-deployment--operations)

---

## 1. System Access, Authentication & Two-Factor Authentication (2FA)

### 1.1 Web Application Access
Open a modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari) and navigate to the application URL:
- **Local Development**: `http://localhost:3000`
- **Internal Enterprise Portal**: `https://netassets.phillip.com.hk`

### 1.2 Enterprise Role Accounts & Credentials
The system provides role-based access control (RBAC). Email is strictly **optional**; users authenticate with their unique **Username** and **Password**:

| Role | Username | Default Password | Recommended Primary Focus |
|---|---|---|---|
| **Super Administrator** | `admin` | `Phillip2026!` | Full system administration, user management, audit logs, alert gateway configuration. |
| **Network Administrator** | `netadmin` | `Phillip2026!` | Core/Distribution/Access switches, firewalls, topology maps, IPAM, and maintenance. |
| **Asset Manager** | `assetmgr` | `Phillip2026!` | Asset lifecycle, procurement records, serial numbers, models, and locations. |
| **Contract Manager** | `contractmgr` | `Phillip2026!` | Master contracts, rental agreements, maintenance warranties, and renewals. |
| **Read-Only Auditor / Viewer** | `viewer` | `Phillip2026!` | Read-only inspection, compliance auditing, reporting exports. |

### 1.3 Step-by-Step Login Procedure
1. Navigate to the login screen (`/login`).
2. Enter your **Username** (e.g. `admin`).
3. Enter your **Password** (e.g. `Phillip2026!`).
4. Click **Sign In to Network Asset System**.
5. If **Two-Factor Authentication (2FA)** is enabled for your account, a second screen will appear requesting your 6-digit verification code.
6. Open your **Google Authenticator** app, locate the code for `Phillip Securities (admin)`, enter the 6-digit number, and click **Verify & Authenticate**.
7. Upon successful authentication, the system issues a secure JWT bearer token and redirects you directly to the **NOC Executive Dashboard**.

### 1.4 Setting Up Google Authenticator 2FA (First-Time Setup)
All operational staff are strongly recommended to bind their accounts to Google Authenticator:
1. Log in to the application.
2. In the top-right header, click your user initials (e.g., **JD / Admin**) or navigate to **Settings → User Management & 2FA**.
3. Select **Two-Factor Authentication (2FA)**.
4. A high-contrast corporate Navy (`#0A192F`) and White **QR Code** will be generated and displayed alongside a base32 manual setup key.
5. On your mobile phone, open **Google Authenticator** (or Microsoft Authenticator), tap **+**, and choose **Scan a QR code**.
6. Point your phone camera at the on-screen QR Code.
7. Enter the 6-digit code displayed in the mobile app into the **Verification Code** input field on screen.
8. Click **Confirm & Activate 2FA**.
9. A confirmation alert will appear, and 2FA will immediately protect all future login attempts.

---

## 2. NOC Executive Dashboard & Daily Monitoring

The **Dashboard** (`/`) is the central command center for real-time visibility into the health, capitalization, and lifecycle of all network infrastructure.

```
+---------------------------------------------------------------------------------------------------------+
| [P] Phillip Securities HK     Network Infrastructure Asset Management        [Search...]   (3) [JD Admin] |
+---------------------------------------------------------------------------------------------------------+
| Network Infrastructure Overview                                            * Last Updated: Live  [Refresh]
|                                                                                                         |
|  +------------------+  +------------------+  +------------------+  +------------------+                 |
|  |   Total Assets   |  |  Company Owned   |  |  Rental / Leased |  | Active Contracts |                 |
|  |      1,248       |  |       876        |  |       372        |  |        32        |                 |
|  |  +2% vs last mo  |  | 70.2% of total   |  | 29.8% of total   |  | Expiring soon: 8 |                 |
|  +------------------+  +------------------+  +------------------+  +------------------+                 |
|                                                                                                         |
|  +------------------------+  +------------------------+  +------------------------+                     |
|  |   Asset Distribution   |  |   Attention Required   |  |   Contract Timeline    |                     |
|  |  Donut Chart: Switches |  | Contracts <=90d:   [8] |  | Multi-month line chart |                     |
|  |  Routers, NGFW, APs    |  | Warranties <=90d: [14] |  | showing renewals vs    |                     |
|  |                        |  | In Maintenance:    [6] |  | warranty expirations   |                     |
|  +------------------------+  +------------------------+  +------------------------+                     |
|                                                                                                         |
|  +-------------------------------------------------------------------+  +----------------------------+  |
|  | Network Device Inventory (Real-Time Database Records)             |  | Quick Links & Facilities   |  |
|  | NA-000123 | FW-01-HK | PA-3220  | Palo Alto | Deployed | Company  |  | Topology | Contracts       |  |
|  | NA-000124 | SW-01-HK | C9300-48 | Cisco     | Deployed | Company  |  | Reports  | Export Data     |  |
|  +-------------------------------------------------------------------+  +----------------------------+  |
+---------------------------------------------------------------------------------------------------------+
```

### 2.1 Daily Morning NOC Checklist
Every morning at the start of shift, the duty engineer should execute the following 5-minute routine:
1. **Check Live KPI Cards**:
   - Verify **Total Assets** matches current baseline (`1,248`).
   - Check **Active Contracts** (`32`) and verify the `Expiring soon` counter.
2. **Review the "Attention Required" Card**:
   - **Contracts expiring within 90 days**: Click the red badge to jump to Contract Expirations.
   - **Warranties expiring within 90 days**: Identify assets needing manufacturer SmartNet or CarePack renewals.
   - **Devices under maintenance**: Confirm whether active maintenance windows are running or pending closure.
3. **Inspect the Contract Timeline Chart**:
   - Review projected expiration spikes for the upcoming quarter (Nov through Mar) to prepare procurement budgets.
4. **Quick Device Inventory Search**:
   - Use the global header search or the inventory filter box to quickly locate specific hostnames, serial numbers, or management IPs.

---

## 3. Network Asset Lifecycle Management (The 7-Tab Profile)

The **Assets** module manages physical and logical hardware across its complete operational lifecycle: Procurement → Deployment → Operation → Maintenance → Decommissioning.

### 3.1 Sub-Menu Navigation
In the left sidebar, click **Assets** to expand the sub-menu options:
- **All Assets**: Complete hardware catalog with global search, column filters, and export tools.
- **Network Devices**: Dedicated view for Switches, Routers, Firewalls, and Access Points.
- **Asset Categories**: Grouping by Core Switching, Edge Routing, Perimeter Security, Wireless LAN, and Out-of-Band Management.
- **Asset Models**: Manufacturer catalog with End-of-Life (EOL) and End-of-Support (EOS) lifespans.
- **Asset Ownership**: Financial capitalization classification (Company Owned vs. Rental vs. Leased).

### 3.2 Registering a New Asset (Step-by-Step)
To onboard a new network device received at the datacenter:
1. Navigate to **Assets → All Assets**.
2. Click the blue **+ Add Asset** button in the upper right.
3. Fill in the **Asset Registration Form**:
   - **Asset ID**: Enter internal barcode ID (e.g. `NA-000129`).
   - **Hostname**: Enter DNS hostname conforming to company naming standards (e.g. `SW-03-HK`).
   - **Serial Number**: Physical hardware S/N from vendor label (e.g. `FGL23456790`).
   - **Asset Tag**: Tamper-evident barcode sticker (e.g. `TAG-HK-9921`).
   - **Manufacturer & Vendor**: Select from master directory (e.g., `Cisco Systems`).
   - **Model & Category**: Choose hardware model (e.g. `Catalyst 9300-48P`, Category: `Switch`).
   - **Ownership Type**: Choose `Company Owned`, `Rental`, `Leased`, `Vendor Provided`, or `Customer Owned`.
     - *If Rental or Leased is selected*: The dedicated **Rental Provider & Distributor** section will automatically appear:
       - **Distributor / Rental Provider**: Select or type the authorized distributor (e.g., `HKT Enterprise Solutions`, `PCCW Solutions`, `SiS Technologies HK`, `Automated Systems HK`).
       - **Monthly Rental Cost (HKD)**: Input the monthly recurring lease cost (e.g., `4500`).
       - **Rental Agreement Ref**: Enter the contract reference number (e.g., `RA-2024-HKT-99`).
       > *Note*: The hardware manufacturer remains recorded as the **Principal** (e.g. Cisco or Huawei), while the commercial leasing firm is recorded as the **Distributor / Rental Provider**.
   - **Location**: Select Site (e.g. `Mega-i Chai Wan`), Building (`Mega-i Tower`), Floor (`18F`), Room (`Data Center Suite 1801`), Rack (`HK-DC1 / Rack A1`), and Rack Unit (`U14`).
   - **Technical Information**: Management IP (`10.200.1.25`), Subnet (`/24`), Default Gateway (`10.200.1.1`), Management Protocol (`SSHv2 / SNMPv3`).
   - **Procurement & Financials**: PO Number (`PO-2026-0881`), Purchase Date, Price, and Supplier.
   - **Lifecycle Dates**: Acquisition Date, Deployment Date, EOL / EOS dates.
4. Click **Save Asset**. The asset is immediately indexed and available for live query.

### 3.3 Exploring the 7-Tab Comprehensive Asset Detail Profile
Click the **Eye** icon or any row in the asset table to open the modal containing 7 dedicated tabs:

```
+---------------------------------------------------------------------------------------------------+
| Asset Profile: FW-01-HK (NA-000123)                                                [Edit] [Close] |
+---------------------------------------------------------------------------------------------------+
| [1. Overview] [2. Technical] [3. Contracts] [4. Topology] [5. Maintenance] [6. Docs] [7. Audit]    |
+---------------------------------------------------------------------------------------------------+
```

#### Tab 1: Overview
- **Core Identifiers**: Asset ID (`NA-000123`), Hostname (`FW-01-HK`), Serial Number (`8F3D1A00234`), Asset Tag (`TAG-HK-00123`).
- **Hardware Info**: Palo Alto Networks `PA-3220`, Next-Gen Firewall, 1U Rackmount.
- **Facility Placement**: Mega-i Chai Wan Data Center, Rack A1, Units U20-U21.
- **Operational Status**: `Deployed` (Green status indicator).
- **Ownership**: `Company Owned`.

#### Tab 2: Technical Details & Interfaces
- **Networking**: Management IP `10.200.1.10`, MAC Address `00:1B:17:00:3B:11`, Default Gateway `10.200.1.1`.
- **System Software**: Operating System `PAN-OS 11.0.2-h3`, Firmware rev `B01`.
- **Interface Table**:
  - `ethernet1/1` (WAN / PCCW Global Uplink - 10G SFP+)
  - `ethernet1/2` (WAN / HKT Redundant Transit - 10G SFP+)
  - `ethernet1/3` (Internal LAN Trunk to Core SW-01-HK - 10G LACP Port-Channel 1)
  - `mgmt0` (Out-of-band management interface - 1G RJ45)

#### Tab 3: Contracts, SLAs & Warranties
- **Associated Contracts**: Primary Maintenance Agreement `CTR-PA-2025-01`.
- **SLA Tier**: Critical Financial SLA (24x7x4 4-hour on-site hardware dispatch).
- **Warranty Dates**: Active coverage through `2027-12-31`.

#### Tab 4: Network Relationships & Interconnects
- Visual depiction of connected upstream routers and downstream core switches.
- Identifies partner interface, remote hostname (`SW-01-HK`), VLAN propagation, and port speed.

#### Tab 5: Maintenance History
- Complete chronological ledger of work orders, repairs, scheduled firmware patching, and component swaps.
- Displays ticket reference number, scheduled downtime window, engineer name, and resolution summary.

#### Tab 6: Configuration Backups & Documents
- Uploaded datasheets, architectural diagrams, signed purchase invoices, and configuration snapshots (`FW-01-HK_20261101.cfg`).
- One-click file download for emergency bare-metal disaster recovery.

#### Tab 7: Immutable Audit History
- Every change to this asset is tracked with exact timestamp, modified attribute name, previous value, updated value, and the operating user account ID.

---

## 4. Contract & Rental Agreement Management

Network uptime relies on active SLAs, vendor hardware support (Cisco SmartNet, Palo Alto Care), and leasing terms.

### 4.1 Sub-Menu Navigation
In the left sidebar, click **Contracts**:
- **All Contracts**: Master repository of all contractual documents.
- **Rental Agreements**: Filtered view for leased switches, rental DWDM optical gear, and test equipment.
- **Maintenance Contracts**: Vendor hardware replacement and software subscription agreements.
- **Support Contracts**: 24/7 engineering field support and emergency dispatch agreements.
- **Contract Expiration**: Expiration tracker segmented into **90-Day**, **60-Day**, **30-Day**, and **Expired** stages.

### 4.2 Creating a New Contract
1. Navigate to **Contracts → All Contracts**.
2. Click **+ Add Contract**.
3. Specify contract attributes:
   - **Contract Number**: Internal or vendor reference (e.g. `CTR-CISCO-2026-HQ`).
   - **Contract Name**: e.g., `Cisco SmartNet Core Switching Support HK HQ`.
   - **Contract Type**: Select `Maintenance Contract`, `Rental Agreement`, `Hardware Support`, `Software Subscription`, or `Managed Service Agreement`.
   - **Vendor**: Select vendor from directory (e.g. `Cisco Systems Hong Kong`).
   - **Contract Owner**: Responsible staff member (e.g., `John Doe`).
   - **Financials**: Contract Value (`HKD 450,000`), Payment Terms (`Quarterly in Advance`).
   - **SLA & Support Level**: Select `24x7x4 High Severity`, `8x5 NBD`, etc.
   - **Effective Period**: Start Date and End Date.
   - **Renewal Notice Period**: 90 days.
4. Click **Create Contract**.

### 4.3 Associating Covered Assets to a Contract
The system supports a **Many-to-Many** relationship:
1. Open the contract detail modal.
2. Under **Covered Assets**, click **+ Link Asset**.
3. Search and select devices (e.g. `SW-01-HK`, `SW-02-HK`, `RT-01-HK`).
4. Click **Confirm Association**. All linked devices will immediately reflect the contract and warranty coverage in their respective Asset Profiles.

### 4.4 Automated Contract Expiration Tracking
The system continuously evaluates active contracts against the current system date:
- **<= 90 Days**: Highlighted in Amber. Procurement initiates quote requests.
- **<= 30 Days**: Highlighted in Orange. Escalated to IT Director for signature.
- **<= 7 Days**: Highlighted in Red. Critical urgent renewal alert dispatched via Email and WhatsApp API.
- **Expired**: Flagged in Dark Red. Covered hardware loses SLA protection.

### 4.5 Inspecting Covered Assets & Navigating to Device Profiles
In the Contracts table, clicking either the **Covered Assets button** (e.g., `3 devices`) or the **Eye icon** opens the **Contract Details & Covered Assets Modal**. This displays:
- Complete contractual parameters (SLA tier, contract value in HKD, expiration countdown, and active status).
- An interactive inventory table of all network infrastructure devices covered under the agreement (Asset ID, Hostname, Model, Vendor, Serial Number, Datacenter Location, and Operational Status).
- Clicking any covered device row or clicking its **Profile** action button immediately opens that device's comprehensive **7-Tab Asset Detail Profile**.

---

## 5. Vendor Master Directory Management

Access via **Vendors** in the navigation menu.

### 5.1 Enterprise Architecture: Principal (OEM) vs Distributor & Rental Provider
In financial enterprise operations (especially in Hong Kong), network hardware is not always procured or rented directly from the original manufacturer. The system explicitly distinguishes between:

1. **Hardware Principal / OEM (Original Equipment Manufacturer)**:
   - *Examples*: Cisco Systems, Palo Alto Networks, Fortinet, Huawei Technologies, Juniper Networks, Arista Networks, Aruba / HPE.
   - *Role*: The entity that manufactures physical hardware, authors network operating systems (Cisco IOS-XE, PAN-OS, FortiOS), issues firmware patches, and dictates End-of-Life (EOL) / End-of-Support (EOS) lifecycles.
   - *System Mapping*: Recorded on each asset as `Manufacturer (Principal)` and hardware `DeviceModel`.

2. **Distributor / Authorized Reseller / Rental Provider (Non-Principal)**:
   - *Examples*: HKT Enterprise Solutions, PCCW Solutions, SiS Technologies HK, Automated Systems HK (ASL), Synnex Technology HK, Ingram Micro HK, HKBN Enterprise Solutions.
   - *Role*: Local authorized commercial partners that physically supply, lease, or rent equipment to Phillip Securities Hong Kong, invoice monthly rental charges (`monthly_rental_cost`), sign local Rental Agreements (`rental_agreement_ref`), and provide Level 1/2 field replacement support.
   - *System Mapping*: Recorded on each rental asset as `Rental Provider & Distributor`, linked in `AssetFormModal`, and associated in Master Contracts.

3. **Data Center & Colocation Operators**:
   - *Examples*: SUNeVision (Mega-i Chai Wan), Equinix Hong Kong (HK1, HK2).
   - *Role*: Facility colocation, 42U rack space, dual power feeds (PDU-A / PDU-B), and cross-connect patch facilities.

4. **Telecom Carriers & Transit Providers**:
   - *Examples*: HKT Limited, PCCW Global, China Telecom Global.
   - *Role*: WAN IP transit, market data feeds, and point-to-point leased circuits.

### 5.2 Vendor Records & Filter Chips
The Vendor Directory interface provides role filter chips (`All Vendors`, `Principal / OEM`, `Distributor & Rental`, `Carriers`, `Data Centers`) to isolate specific partner tiers.

Each vendor record tracks:
- Primary Business Contact, Technical Account Manager (TAM), 24/7 Hotline.
- Support portal URLs, SLA escalation matrices.
- Total active assets linked to this provider.
- Total active contracts and aggregated annual contract value.

---

## 6. Datacenter Facilities & 42U Visual Rack Elevation

Navigate to **Locations** in the navigation menu.

### 6.1 Facility Hierarchy
The system organizes physical assets in a strict relational hierarchy:
$$\text{Country (Hong Kong)} \longrightarrow \text{Site} \longrightarrow \text{Building} \longrightarrow \text{Floor} \longrightarrow \text{Data Center / Room} \longrightarrow \text{Rack (42U)}$$

**Core Production Sites**:
1. **Mega-i Chai Wan (HK-DC1)**: Primary production trading engines and external market feeds.
2. **Equinix HK1 Fo Tan (HK-DC2)**: High-speed cross-connects and secondary market access.
3. **Exchange Square Central (HQ)**: Trading floor, executive suites, and corporate LAN.
4. **Tsuen Wan Disaster Recovery (DR)**: Cold/Warm standby trading infrastructure.

### 6.2 42U Visual Rack Elevation Workflow
1. Navigate to **Locations → Racks**.
2. Select a target rack (e.g., `HK-DC1 / Rack A1`).
3. The visual interactive 42U cabinet renders on screen:
   - Displays unit slots from **U1 (bottom)** to **U42 (top)**.
   - Each installed device is color-coded by role (Firewall: Red/Orange, Core Switch: Navy, Access Switch: Light Blue, Router: Purple).
   - Occupied unit heights (1U, 2U, 4U) are accurately proportioned.
   - Hovering over any rack unit reveals device hostname, serial number, management IP, and power consumption.
   - Vacant slots are highlighted in light gray with instant **[Rack Device Here]** shortcut.
4. Review **PDU Power Telemetry**: Dual feed status (PDU-A / PDU-B) to prevent circuit overload.

---

## 7. Interactive Network Topology & Link Interconnects

Navigate to **Topology** in the navigation menu.

### 7.1 Visual Topology Canvas
The interactive topology module visualizes all network connections, uplinks, downlinks, and redundancy paths across Hong Kong infrastructure:
- **Nodes**: Represent Core Switches, Edge Routers, Next-Gen Firewalls, and Access Points.
- **Edges**: Solid lines represent active physical interconnects (labeled with port numbers, e.g., `SW-01-HK Te1/0/1 <--> FW-01-HK eth1/3`).
- **Interactive Controls**:
  - **Zoom In / Zoom Out / Reset View**: Scale the canvas to inspect dense trading floor clusters.
  - **Node Selection**: Clicking any node highlights all its active physical connections and displays an overview panel on the right.
  - **Add Connection**: Click **+ Add Connection** to register a new physical patch cable or fiber cross-connect between two devices.

---

## 8. IP Address Management (IPAM) & Subnet Planner

Navigate to **IPAM** in the navigation menu.

### 8.1 Subnet Planning & VLAN Overview
The IPAM module manages IPv4 and IPv6 address allocations, preventing duplicate IP conflicts and tracking subnet capacity:
- **VLAN 10 – Out-of-Band Management**: `10.200.1.0/24` (Mega-i OOB Network)
- **VLAN 20 – Core Infrastructure**: `10.200.2.0/24` (Inter-switch transit links)
- **VLAN 30 – Trading Floor Desks**: `10.100.10.0/23` (Exchange Square Traders)
- **VLAN 50 – DMZ & External Transit**: `192.168.100.0/24` (Public market feeds)

### 8.2 Assigning a Static IP Address
1. In the IPAM module, click **+ Assign IP Address**.
2. Enter the IP Address (e.g. `10.200.1.30`).
3. Select the Subnet / VLAN.
4. Enter the **Associated Hostname** and select the target **Asset ID**.
5. Specify the physical interface (e.g. `GigabitEthernet0/0/1`).
6. Enter DNS PTR record and description.
7. Click **Confirm Allocation**. If the IP is already allocated, the system displays a conflict warning and prevents duplication.

---

## 9. Maintenance Work Orders & Incident Remediation

Navigate to **Maintenance** in the navigation menu.

### 9.1 Creating a Work Order
1. Click **+ New Work Order**.
2. Fill in the maintenance ticket details:
   - **Ticket ID**: Auto-generated (e.g. `MNT-2026-0042`).
   - **Asset**: Select affected device (e.g. `NA-000127 Huawei S5735`).
   - **Maintenance Type**: Choose `Preventive Maintenance`, `Hardware Replacement`, `Firmware Upgrade`, or `Emergency Outage Repair`.
   - **Priority**: `Critical`, `High`, `Medium`, or `Low`.
   - **Scheduled Window**: Start date/time and estimated downtime duration (e.g., `30 minutes`).
   - **Assigned Engineer**: Select lead technician (e.g., `David Wong`).
   - **Vendor Support Ticket**: Enter vendor RMA or TAC case number (e.g. `SR-6988210`).
3. Click **Schedule Maintenance**.

### 9.2 Executing and Closing a Maintenance Order
1. When work begins, change ticket status to **In Progress**. The linked asset's operational status automatically updates to **In Maintenance**.
2. Upon completion of hardware swap or firmware patching, open the ticket.
3. Enter **Resolution Notes**, **Root Cause Analysis (RCA)**, and any replacement spare part serial numbers.
4. Mark ticket status as **Completed**.
5. The asset's status automatically transitions back to **Deployed**, and the complete record is permanently appended to **Tab 5 (Maintenance History)** of the asset profile.

---

## 10. Spare Parts Inventory & Buffer Stock Control

Navigate to **Spare Parts** in the navigation menu.

### 10.1 Managing Buffer Stock
To ensure zero downtime during transceiver or power supply failures, the system tracks cold spares stored in datacenter cabinets:
- **10G SFP+ Optical Transceivers** (SR / LR 850nm / 1310nm)
- **40G / 100G QSFP28 Modules**
- **Hot-swappable AC/DC Power Supply Units (PSU)**
- **Cat6A & Single-Mode LC-LC Fiber Patch Cables**

### 10.2 Check-Out / Check-In Procedure
1. When a technician retrieves a spare transceiver to replace a failed optic:
   - Open **Spare Parts & Inventory**.
   - Select the item (e.g., `SFP-10G-SR Cisco Compatible`).
   - Click **Check-Out Item**.
   - Input Quantity (`1`), target Asset ID (`SW-01-HK`), and Reason (`Failed port link`).
   - Submit. The remaining stock counter decrements in real-time.
2. If remaining stock falls below the **Reorder Threshold**, an automatic low-stock alert is generated in the notification center.

---

## 11. Regulatory Compliance Reporting & Data Export

Navigate to **Reports** in the navigation menu.

### 11.1 Catalog of 12 Enterprise Reports
The reporting engine provides real-time audit reports required by Hong Kong Securities and Futures Commission (SFC) technology risk management regulations:

1. **Complete Hardware Asset Register**: Full inventory listing with serials, IP addresses, models, and locations.
2. **Leased & Rental Equipment Ledger**: Complete rental audit tracking monthly lease expenditure and return commitments.
3. **Expiring Contracts & Warranties (90-Day Outlook)**: Proactive renewal forecast for financial controllers.
4. **End-of-Life (EOL) / End-of-Support (EOS) Technology Debt**: Hardware past vendor support dates needing capital replacement.
5. **Datacenter Space & 42U Rack Utilization**: Cabinet space capacity, power consumption, and available unit slots.
6. **Financial Asset Capitalization & Depreciation**: Purchase costs, net book values, and depreciation cycles.
7. **Vendor Performance & SLA Compliance**: Vendor SLA fulfillment rates and response times.
8. **IPAM Allocation & Utilization Audit**: Subnet pool consumption and static IP directory.
9. **Network Topology Dependency Matrix**: Critical uplink mapping and single points of failure.
10. **Maintenance & Incident Downtime Summary**: Annual MTTR (Mean Time to Repair) and outage logs.
11. **Spare Parts Stock Valuation**: On-hand inventory quantities, unit values, and replenishment requirements.
12. **User Access & Security Audit Trail**: User logins, 2FA activations, and permission change records.

### 11.2 Export Formats
Every report can be exported in multiple formats:
- **Microsoft Excel (`.xlsx`)**: Generated natively using `openpyxl` with corporate navy column headers, proper cell formatting, and auto-adjusted column widths.
- **CSV Format (`.csv`)**: Clean comma-delimited export formatted in UTF-8 for downstream ingestion into SIEM or ERP tools.
- **PDF / Print Preview**: Enterprise styled printable report with official corporate headers and page numbering.

---

## 12. Notification Center & Outbound Alert Gateway (Email & API)

### 12.1 Interactive In-App Notification Center
1. Click the **Notification Bell** icon in the top header.
2. The popover displays unread notifications categorized by severity:
   - 🔴 **Critical / Danger**: Contract expiring in ≤ 7 days, device emergency outage.
   - 🟡 **Warning**: Contract or warranty expiring in ≤ 90 days, low spare parts threshold.
   - 🔵 **Info**: System backup completed, routine maintenance scheduled.
3. Click any notification card. The **Notification Detail Modal** opens.
4. In the detail modal, click **View Associated Record** to navigate directly to the affected asset, contract, or maintenance ticket.
5. Click **Mark as Read** to clear the unread counter badge.

### 12.2 Dispatching Alerts to Email & API Gateway (WhatsApp / Webhook)
NOC operators can immediately push any critical notification to external escalation channels directly from the Notification Detail Modal or via automated background alerts.

```
+---------------------------------------------------------------------------------------------------+
| Outbound Alert Gateway Dispatch                                                                   |
+---------------------------------------------------------------------------------------------------+
|  [x] Send via Email                                                                               |
|      Recipient: noc-escalations@phillip.com.hk                                                   |
|                                                                                                   |
|  [x] Send via API Gateway (WhatsApp / Webhook)                                                    |
|      Target ID: 628123456789                                                                      |
|      Sender:    respon                                                                            |
|                                                                                                   |
|  Payload Preview:                                                                                 |
|  {                                                                                                |
|    "id": "628123456789",                                                                          |
|    "message": "[CRITICAL] Contract #CTR-PA-2025-01 for FW-01-HK expires in 7 days!",              |
|    "from": "respon"                                                                               |
|  }                                                                                                |
|                                                                                                   |
|                                                      [Cancel]  [Confirm & Dispatch Outbound Alert] |
+---------------------------------------------------------------------------------------------------+
```

#### Outbound API Specification
The gateway communicates with the enterprise messaging/WhatsApp server using the exact required specification:
- **HTTP Method**: `POST`
- **Request Headers**:
  ```http
  Authorization: Bearer <API_KEY>
  Content-Type: application/json
  ```
- **Body JSON Format**:
  ```json
  {
    "id": "628123456789",
    "message": "[CRITICAL] Contract #CTR-PA-2025-01 for FW-01-HK expires in 7 days!",
    "from": "respon"
  }
  ```

### 12.3 Configuring Default Gateway Settings in System Settings
Super Administrators can configure default API parameters in **Settings → System Configuration**:
1. Navigate to **Settings** and select **System Configuration**.
2. Locate the **Alert & Notification Gateway Integration** section.
3. Configure the following fields:
   - **Gateway Webhook API URL**: e.g., `https://api.gateway.internal/v1/send-message`
   - **Bearer API Key**: Enter your secret API token.
   - **Default Target ID (Phone / Channel)**: Default recipient identifier (e.g. `628123456789`).
   - **Default Sender Identity (`from`)**: e.g., `respon`.
   - **Default NOC Email Recipient**: e.g., `noc@phillip.com.hk`.
4. Click **Save Gateway Configuration**.
5. Click **Send Test Alert** to verify end-to-end connectivity. A live response card displays HTTP status code and response payload.

---

## 13. Mobile & Tablet On-Site Inspection Workflow

The system is fully responsive, optimized for field engineers conducting datacenter walkthroughs using an iPad, tablet, or smartphone:

```
+---------------------------------------------+
| [=] [P] Phillip HK - NetAssets   (3) [JD]   |
+---------------------------------------------+
|  Total Assets   Company Owned   Rental      |
|     1,248            876          372       |
|                                             |
|  Asset Inventory (Swipe to scroll)          |
|  +---------------------------------------+  |
|  | NA-000123 | FW-01-HK | PA-3220 | ... |  |
|  +---------------------------------------+  |
+---------------------------------------------+
```

### 13.1 Mobile Navigation Controls
- **Off-Canvas Slide-Over Drawer**: On screens smaller than 1024px, the dark navy sidebar collapses into a slide-out drawer.
- **Hamburger Button**: Tap the 3-bar icon `[=]` in the top header to reveal the navigation menu.
- **Auto-Close on Selection**: Tapping any navigation module or sub-menu automatically navigates and smoothly dismisses the drawer.
- **Backdrop Dismiss**: Tap anywhere on the dimmed background overlay to close the drawer.

### 13.2 Data Tables & Modal Profiles on Handheld Devices
- **Horizontal Swipeable Tables**: Inventory tables feature smooth touch scrolling so technicians can inspect all columns on small viewports without layout distortion.
- **Adaptive Modal Tabs**: The 7-tab Asset Profile features horizontally scrollable pill tabs, allowing one-thumb switching between *Overview*, *Technical*, *Contracts*, and *Audit History*.

---

## 14. Troubleshooting & Operational FAQ

### Q1: I forgot my password or need to reset 2FA.
> **Solution**: Contact a Super Administrator (`admin`). The administrator can navigate to **Settings → User Management**, click on your user account, reset your password, and temporarily deactivate 2FA to permit a fresh QR code binding.

### Q2: How do I export asset inventory for a financial audit?
> **Solution**: Navigate to **Reports → Complete Hardware Asset Register**, select desired date range and site filters, and click **Export Excel (.xlsx)**. The file downloads with full financial capitalization and procurement details.

### Q3: When I add a new asset, the Management IP says "Address already in use".
> **Solution**: The IPAM conflict prevention engine detected that the requested IP address is already bound to another active hostname. Navigate to **IPAM**, search the IP address, verify whether the existing device was decommissioned, release the IP if obsolete, or assign an alternate IP from the subnet pool.

### Q4: An outbound alert failed to dispatch via API.
> **Solution**: Navigate to **Settings → System Configuration**, review the **Alert & Notification Gateway Integration** section, check whether the API Key has expired, verify the target phone number format, and click **Send Test Alert** to inspect the exact HTTP error code returned by the gateway.

---

## 15. Docker Compose Production Deployment & Operations

### 15.1 Architecture Overview
The production deployment packages the full stack into 3 lightweight, production-grade Docker containers:
1. `phillip_postgres` (`postgres:16-alpine`): Stores all relational assets, contracts, IPAM, and alert rules.
2. `phillip_backend` (`python:3.11-slim`): FastAPI REST API server, runs auto-seed on startup, listens on port 8000.
3. `phillip_frontend` (`node:20-alpine`): Next.js 14 production runtime, listens on port 3000 and reverse-proxies API calls to `phillip_backend:8000`.

### 15.2 Step-by-Step Production Deployment
Run the following commands on your Linux Docker server (e.g., `dockerpshk`):

```bash
# 1. Update repository with latest commits
git pull origin main

# 2. Build images and launch all containers in detached mode
docker compose up -d --build

# 3. Verify all 3 services are running and healthy
docker compose ps
```

### 15.3 Container Health & Log Monitoring
To monitor real-time server output and startup initialization:
```bash
# Stream all logs
docker compose logs -f

# Inspect backend startup and database seeding logs specifically
docker compose logs -f backend

# Check PostgreSQL container health
docker compose exec db pg_isready -U postgres
```

### 15.4 Default Enterprise Credentials
Once containers are running, navigate to `http://<YOUR_SERVER_IP>:3000`:
- **Username**: `admin`
- **Password**: `Phillip2026!`
- **Initial Role**: Super Administrator (VP of Infrastructure & Security)

---

*Phillip Securities (Hong Kong) Limited — Internal Enterprise Documentation*  
*Version 1.0.0 — Production Ready*

