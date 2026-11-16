"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Globe,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  Server,
  Zap,
  Tag,
  Layers,
  ArrowUpRight,
  Shield,
  Activity,
  Eye,
  ExternalLink,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  FileSpreadsheet,
  Laptop,
  Check,
} from "lucide-react";
import { apiUrl } from "@/lib/api";
import { SearchableSelect } from "@/components/common/SearchableSelect";

interface IPAMViewProps {
  onSelectAsset?: (assetId: string) => void;
}

export function IPAMView({ onSelectAsset }: IPAMViewProps = {}) {
  const [vlans, setVlans] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [assignableAssets, setAssignableAssets] = useState<any[]>([]);
  const [selectedSubnet, setSelectedSubnet] = useState<string>("");
  const [selectedVlanId, setSelectedVlanId] = useState<number | null>(null);

  // High-Scale VLAN Fleet Management State (Optimized for 100+ VLANs)
  const [vlanSearch, setVlanSearch] = useState<string>("");
  const [vlanRangeFilter, setVlanRangeFilter] = useState<string>("ALL");
  const [vlanViewMode, setVlanViewMode] = useState<"cards" | "table">("cards");
  const [vlanCollapsed, setVlanCollapsed] = useState<boolean>(false);
  const [vlanPage, setVlanPage] = useState<number>(1);
  const [vlanPageSize, setVlanPageSize] = useState<number>(10);

  // IP Address Table Pagination State
  const [ipPage, setIpPage] = useState<number>(1);
  const [ipPageSize, setIpPageSize] = useState<number>(25);

  // IP Detail Modal State
  const [ipDetailModalOpen, setIpDetailModalOpen] = useState(false);
  const [selectedIpDetail, setSelectedIpDetail] = useState<any>(null);

  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [deviceTypeFilter, setDeviceTypeFilter] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  // Notifications
  const [toastSuccess, setToastSuccess] = useState<string | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);

  // Modals state
  const [vlanModalOpen, setVlanModalOpen] = useState<boolean>(false);
  const [editingVlan, setEditingVlan] = useState<any>(null);

  const [ipModalOpen, setIpModalOpen] = useState<boolean>(false);
  const [editingIp, setEditingIp] = useState<any>(null);

  const [assignModalOpen, setAssignModalOpen] = useState<boolean>(false);
  const [assignMode, setAssignMode] = useState<"standalone" | "asset">("standalone");
  const [batchModalOpen, setBatchModalOpen] = useState<boolean>(false);

  // Bulk Import State
  const [bulkModalOpen, setBulkModalOpen] = useState<boolean>(false);
  const [bulkText, setBulkText] = useState<string>("");
  const [bulkSubnet, setBulkSubnet] = useState<string>("");
  const [isBulkImporting, setIsBulkImporting] = useState<boolean>(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: "vlan" | "ip"; id: number; name: string } | null>(null);

  // VLAN Form
  const [vlanForm, setVlanForm] = useState({
    vlan_id: 1,
    name: "",
    subnet: "",
    gateway: "",
    description: "",
  });

  // Single IP Form (Add / Edit)
  const [ipForm, setIpForm] = useState({
    ip_address: "",
    subnet: "",
    vlan_id: 1,
    status: "Available",
    device_type: "Server VM",
    asset_id: null as number | null,
    hostname: "",
    mac_address: "",
    interface_name: "",
    description: "",
  });

  // Assign IP Form
  const [assignForm, setAssignForm] = useState({
    ip_address: "",
    hostname: "",
    device_type: "Server VM",
    asset_id: null as number | null,
    mac_address: "",
    interface_name: "",
    description: "",
  });
  const [assetSearch, setAssetSearch] = useState<string>("");

  // Batch Generation Form
  const [batchForm, setBatchForm] = useState({
    subnet: "",
    vlan_id: 1,
    start_host: 1,
    end_host: 50,
  });

  const getAuthToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("phillip_token") || "";
    }
    return "";
  };

  const getAuthHeaders = () => {
    const token = getAuthToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  };

  const notifySuccess = (msg: string) => {
    setToastSuccess(msg);
    setTimeout(() => setToastSuccess(null), 3500);
  };
  const notifyError = (msg: string) => {
    setToastError(msg);
    setTimeout(() => setToastError(null), 5000);
  };

  // Load VLANs and Assignable Assets
  const loadMasterData = async () => {
    try {
      const [vlanRes, astRes] = await Promise.all([
        fetch(apiUrl("/api/v1/ipam/vlans")),
        fetch(apiUrl("/api/v1/ipam/assets")),
      ]);
      const vlanData = await vlanRes.json();
      const astData = await astRes.json();

      setVlans(Array.isArray(vlanData) ? vlanData : []);
      setAssignableAssets(Array.isArray(astData) ? astData : []);

      if (Array.isArray(vlanData) && vlanData.length > 0 && !selectedSubnet) {
        setSelectedSubnet(vlanData[0].subnet);
        setSelectedVlanId(vlanData[0].id);
      }
      if (Array.isArray(astData) && astData.length > 0) {
        setAssignForm((f) => ({ ...f, asset_id: astData[0].id }));
      }
    } catch (e) {
      console.error("Error loading IPAM master data", e);
    }
  };

  // Load Addresses
  const loadAddresses = async () => {
    setLoading(true);
    let endpoint = `/api/v1/ipam/addresses?subnet=${encodeURIComponent(selectedSubnet)}`;
    if (statusFilter) endpoint += `&status=${encodeURIComponent(statusFilter)}`;
    if (deviceTypeFilter) endpoint += `&device_type=${encodeURIComponent(deviceTypeFilter)}`;
    if (search) endpoint += `&search=${encodeURIComponent(search)}`;

    try {
      const res = await fetch(apiUrl(endpoint));
      const data = await res.json();
      setAddresses(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error loading IP addresses", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMasterData();
  }, []);

  useEffect(() => {
    loadAddresses();
  }, [selectedSubnet, statusFilter, deviceTypeFilter, search]);

  // ============================================================================
  // VLAN CRUD Handlers
  // ============================================================================
  const openAddVlan = () => {
    setEditingVlan(null);
    setVlanForm({
      vlan_id: 1,
      name: "",
      subnet: "",
      gateway: "",
      description: "",
    });
    setVlanModalOpen(true);
  };

  const openEditVlan = (v: any) => {
    setEditingVlan(v);
    setVlanForm({
      vlan_id: v.vlan_id,
      name: v.name,
      subnet: v.subnet,
      gateway: v.gateway,
      description: v.description || "",
    });
    setVlanModalOpen(true);
  };

  const handleSaveVlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingVlan
        ? apiUrl(`/api/v1/ipam/vlans/${editingVlan.id}`)
        : apiUrl("/api/v1/ipam/vlans");
      const method = editingVlan ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(vlanForm),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to save VLAN");
      }

      setVlanModalOpen(false);
      notifySuccess(`VLAN ${vlanForm.vlan_id} ${editingVlan ? "updated" : "created"} successfully!`);
      loadMasterData();
    } catch (err: any) {
      notifyError(err.message);
    }
  };

  // ============================================================================
  // IP CRUD Handlers
  // ============================================================================
  const openAddIp = () => {
    setEditingIp(null);
    const activeVlan = vlans.find((v) => v.subnet === selectedSubnet);
    setIpForm({
      ip_address: "",
      subnet: selectedSubnet,
      vlan_id: activeVlan ? activeVlan.id : 1,
      status: "Available",
      device_type: "Server VM",
      asset_id: null,
      hostname: "",
      mac_address: "",
      interface_name: "",
      description: "",
    });
    setIpModalOpen(true);
  };

  const openEditIp = (rec: any) => {
    setEditingIp(rec);
    setIpForm({
      ip_address: rec.ip_address,
      subnet: rec.subnet,
      vlan_id: rec.vlan_id || 1,
      status: rec.status,
      device_type: rec.device_type || (rec.asset_id ? "Network Hardware" : "Server VM"),
      asset_id: rec.asset_id || null,
      hostname: rec.hostname || "",
      mac_address: rec.mac_address || "",
      interface_name: rec.interface_name || "",
      description: rec.description || "",
    });
    setIpModalOpen(true);
  };

  const handleSaveIp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingIp
        ? apiUrl(`/api/v1/ipam/addresses/${editingIp.id}`)
        : apiUrl("/api/v1/ipam/addresses");
      const method = editingIp ? "PUT" : "POST";

      const payload = {
        ...ipForm,
        asset_id: ipForm.asset_id ? Number(ipForm.asset_id) : null,
      };

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to save IP address record");
      }

      setIpModalOpen(false);
      notifySuccess(`IP address ${ipForm.ip_address} ${editingIp ? "updated" : "created"} successfully!`);
      loadAddresses();
      loadMasterData();
    } catch (err: any) {
      notifyError(err.message);
    }
  };

  // ============================================================================
  // IP Assignment Handlers
  // ============================================================================
  const openAssignModalForIp = (ipAddr?: string) => {
    setAssignMode("standalone");
    setAssignForm({
      ip_address: ipAddr || "",
      hostname: "",
      device_type: "Server VM",
      asset_id: assignableAssets.length > 0 ? assignableAssets[0].id : null,
      mac_address: "",
      interface_name: "",
      description: "",
    });
    setAssetSearch("");
    setAssignModalOpen(true);
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        ip_address: assignForm.ip_address.trim(),
        hostname: assignMode === "asset" ? "" : assignForm.hostname.trim(),
        device_type: assignMode === "asset" ? "Network Hardware" : assignForm.device_type,
        asset_id: assignMode === "asset" ? (assignForm.asset_id ? Number(assignForm.asset_id) : null) : null,
        mac_address: assignForm.mac_address.trim() || undefined,
        interface_name: assignForm.interface_name.trim() || undefined,
        description: assignForm.description.trim() || undefined,
      };

      const res = await fetch(apiUrl("/api/v1/ipam/assign"), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Assignment failed");
      }

      setAssignModalOpen(false);
      notifySuccess(`IP ${assignForm.ip_address} successfully assigned!`);
      loadAddresses();
      loadMasterData();
    } catch (err: any) {
      notifyError(err.message);
    }
  };

  // ============================================================================
  // Bulk Import Handlers (Excel / CSV)
  // ============================================================================
  const parseBulkText = () => {
    if (!bulkText.trim()) return [];
    const lines = bulkText.split("\n");
    const parsed: any[] = [];
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#") || line.toLowerCase().startsWith("ip address")) continue;
      // Split by tab or comma
      const cols = line.includes("\t")
        ? line.split("\t").map((c) => c.trim())
        : line.split(",").map((c) => c.trim());

      if (cols.length >= 1 && cols[0]) {
        const ip = cols[0];
        const hostname = cols[1] || "";
        const deviceType = cols[2] || (hostname ? "Server VM" : "");
        const description = cols[3] || "";
        const mac = cols[4] || "";

        parsed.push({
          ip_address: ip,
          hostname: hostname,
          device_type: deviceType || "Server VM",
          description: description,
          mac_address: mac,
        });
      }
    }
    return parsed;
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseBulkText();
    if (parsed.length === 0) {
      notifyError("No valid IP records detected for import.");
      return;
    }

    setIsBulkImporting(true);
    try {
      const activeVlan = vlans.find((v) => v.subnet === (bulkSubnet || selectedSubnet));
      const items = parsed.map((p) => ({
        ip_address: p.ip_address,
        subnet: bulkSubnet || selectedSubnet,
        vlan_id: activeVlan ? activeVlan.id : undefined,
        hostname: p.hostname || undefined,
        device_type: p.device_type || "Server VM",
        mac_address: p.mac_address || undefined,
        description: p.description || undefined,
        status: p.hostname ? "Assigned" : "Available",
      }));

      const res = await fetch(apiUrl("/api/v1/ipam/addresses/bulk-import"), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ items }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Bulk import failed");
      }

      const data = await res.json();
      setBulkModalOpen(false);
      setBulkText("");
      notifySuccess(data.message || `Successfully imported ${data.total} IP records!`);
      loadAddresses();
      loadMasterData();
    } catch (err: any) {
      notifyError(err.message);
    } finally {
      setIsBulkImporting(false);
    }
  };

  // Release IP Handler
  const handleReleaseIp = async (ipAddr: string) => {
    if (!confirm(`Are you sure you want to release IP ${ipAddr}? It will be marked Available.`)) {
      return;
    }
    try {
      const res = await fetch(apiUrl(`/api/v1/ipam/release?ip_address=${encodeURIComponent(ipAddr)}`), {
        method: "POST",
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to release IP");
      }

      notifySuccess(`IP ${ipAddr} has been released to Available pool!`);
      loadAddresses();
      loadMasterData();
    } catch (err: any) {
      notifyError(err.message);
    }
  };

  // Batch IP Generation Handler
  const handleBatchGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const activeVlan = vlans.find((v) => v.subnet === selectedSubnet);
      const url = apiUrl(
        `/api/v1/ipam/addresses/batch?subnet=${encodeURIComponent(
          batchForm.subnet
        )}&vlan_id=${activeVlan ? activeVlan.id : 1}&start_host=${batchForm.start_host}&end_host=${batchForm.end_host}`
      );

      const res = await fetch(url, {
        method: "POST",
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Batch generation failed");
      }

      const data = await res.json();
      setBatchModalOpen(false);
      notifySuccess(data.message || "IP range generated successfully!");
      loadAddresses();
      loadMasterData();
    } catch (err: any) {
      notifyError(err.message);
    }
  };

  // Delete Confirmation Handler
  const confirmDelete = (type: "vlan" | "ip", id: number, name: string) => {
    setItemToDelete({ type, id, name });
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    try {
      const endpoint =
        itemToDelete.type === "vlan"
          ? `/api/v1/ipam/vlans/${itemToDelete.id}`
          : `/api/v1/ipam/addresses/${itemToDelete.id}`;

      const res = await fetch(apiUrl(endpoint), {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Deletion failed");
      }

      setDeleteModalOpen(false);
      setItemToDelete(null);
      notifySuccess(`${itemToDelete.name} deleted successfully!`);
      loadMasterData();
      loadAddresses();
    } catch (err: any) {
      setDeleteModalOpen(false);
      notifyError(err.message);
    }
  };

  // Subnet Stats Calculation
  const totalInSubnet = addresses.length;
  const assignedCount = addresses.filter((a) => a.status === "Assigned").length;
  const availableCount = addresses.filter((a) => a.status === "Available").length;
  const reservedCount = addresses.filter((a) => a.status === "Reserved").length;
  const utilizationPct = totalInSubnet > 0 ? Math.round((assignedCount / totalInSubnet) * 100) : 0;

  // Filtered Assets for dropdown
  const filteredAssets = assignableAssets.filter((a) => {
    if (!assetSearch) return true;
    const q = assetSearch.toLowerCase();
    return (
      a.hostname.toLowerCase().includes(q) ||
      a.asset_id.toLowerCase().includes(q) ||
      a.management_ip.toLowerCase().includes(q)
    );
  });

  // Currently Active VLAN
  const currentVlan = useMemo(() => {
    return vlans.find((v) => v.subnet === selectedSubnet) || vlans[0] || null;
  }, [vlans, selectedSubnet]);

  // Filtered VLANs for High-Scale Fleet (100+ VLANs)
  const filteredVlans = useMemo(() => {
    let result = vlans;

    // Filter by range
    if (vlanRangeFilter !== "ALL") {
      if (vlanRangeFilter === "1-99") {
        result = result.filter((v) => v.vlan_id >= 1 && v.vlan_id <= 99);
      } else if (vlanRangeFilter === "100-199") {
        result = result.filter((v) => v.vlan_id >= 100 && v.vlan_id <= 199);
      } else if (vlanRangeFilter === "200-299") {
        result = result.filter((v) => v.vlan_id >= 200 && v.vlan_id <= 299);
      } else if (vlanRangeFilter === "300-399") {
        result = result.filter((v) => v.vlan_id >= 300 && v.vlan_id <= 399);
      } else if (vlanRangeFilter === "400+") {
        result = result.filter((v) => v.vlan_id >= 400);
      }
    }

    // Filter by search query (VLAN ID, name, subnet, gateway, description)
    if (vlanSearch.trim()) {
      const q = vlanSearch.toLowerCase().trim();
      result = result.filter((v) => {
        return (
          String(v.vlan_id).includes(q) ||
          v.name.toLowerCase().includes(q) ||
          v.subnet.toLowerCase().includes(q) ||
          v.gateway.toLowerCase().includes(q) ||
          (v.description && v.description.toLowerCase().includes(q))
        );
      });
    }

    return result;
  }, [vlans, vlanSearch, vlanRangeFilter]);

  // Paginated VLANs for Grid & Table
  const totalVlanPages = Math.ceil(filteredVlans.length / vlanPageSize) || 1;
  const paginatedVlans = useMemo(() => {
    if (vlanPageSize === -1) return filteredVlans;
    const start = (vlanPage - 1) * vlanPageSize;
    return filteredVlans.slice(start, start + vlanPageSize);
  }, [filteredVlans, vlanPage, vlanPageSize]);

  // Reset VLAN page when filter changes
  useEffect(() => {
    setVlanPage(1);
  }, [vlanSearch, vlanRangeFilter, vlanPageSize]);

  // IP Address Table Pagination
  const totalIpPages = Math.ceil(addresses.length / ipPageSize) || 1;
  const paginatedAddresses = useMemo(() => {
    if (ipPageSize === -1) return addresses;
    const start = (ipPage - 1) * ipPageSize;
    return addresses.slice(start, start + ipPageSize);
  }, [addresses, ipPage, ipPageSize]);

  // Reset IP page when filter changes
  useEffect(() => {
    setIpPage(1);
  }, [selectedSubnet, statusFilter, deviceTypeFilter, search, ipPageSize]);

  const renderDeviceTypeBadge = (type?: string, assetId?: number | null) => {
    const t = type || (assetId ? "Network Hardware" : "Server VM");
    if (t.includes("Hardware") || t.includes("Asset") || assetId) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <Server className="w-2.5 h-2.5 text-blue-600" />
          <span>Hardware Asset</span>
        </span>
      );
    }
    if (t.includes("VM") || t.includes("Server")) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
          <Layers className="w-2.5 h-2.5 text-purple-600" />
          <span>Server VM</span>
        </span>
      );
    }
    if (t.includes("Endpoint") || t.includes("PC")) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
          <Laptop className="w-2.5 h-2.5 text-slate-600" />
          <span>Endpoint</span>
        </span>
      );
    }
    if (t.includes("Printer")) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <Tag className="w-2.5 h-2.5 text-amber-600" />
          <span>Printer</span>
        </span>
      );
    }
    if (t.includes("VIP") || t.includes("Gateway")) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
          <Shield className="w-2.5 h-2.5 text-teal-600" />
          <span>VIP / Gateway</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
        <span>{t}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      {toastSuccess && (
        <div className="flex items-center space-x-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastSuccess}</span>
        </div>
      )}
      {toastError && (
        <div className="flex items-center space-x-2 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium animate-fadeIn">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{toastError}</span>
        </div>
      )}

      {/* Top Header with Quick Jump & Global Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            IP Address Management (IPAM) & Subnet Planner
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Centrally manage IPv4/IPv6 address allocations, 802.1Q VLANs, default gateways, and dynamic hardware device assignments.
          </p>
        </div>

        {/* Global Action Buttons & Quick Jump */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Jump Combobox for High-Scale VLAN fleets */}
          <div className="w-64 sm:w-72">
            <SearchableSelect
              options={vlans.map((v) => ({
                value: v.id,
                label: `VLAN ${v.vlan_id} — ${v.name}`,
                subLabel: `${v.subnet} (GW: ${v.gateway}) [${v.ip_count} IPs]`,
              }))}
              value={selectedVlanId}
              onChange={(val) => {
                const target = vlans.find((v) => Number(v.id) === Number(val));
                if (target) {
                  setSelectedVlanId(target.id);
                  setSelectedSubnet(target.subnet);
                }
              }}
              placeholder="⚡ Quick Jump to any VLAN..."
              searchPlaceholder="Type VLAN ID or name..."
              searchThreshold={10}
            />
          </div>

          <button
            onClick={() => {
              loadMasterData();
              loadAddresses();
            }}
            className="p-2 bg-white rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer shadow-sm transition-all"
            title="Refresh IPAM Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
          </button>

          <button
            onClick={openAddVlan}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Tag className="w-4 h-4 text-slate-500" />
            <span>Add VLAN</span>
          </button>

          <button
            onClick={() => {
              setBatchForm((f) => ({ ...f, subnet: selectedSubnet }));
              setBatchModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Layers className="w-4 h-4 text-slate-500" />
            <span>Generate Pool</span>
          </button>

          <button
            onClick={() => openAssignModalForIp()}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#1E60D5] hover:bg-blue-700 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Assign IP to Asset</span>
          </button>
        </div>
      </div>

      {/* High-Scale 802.1Q VLAN Fleet & Subnet Section */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        {/* Section Header with Quick Search, Filter Range, View Switcher & Collapse */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-900">802.1Q VLAN Fleet & Subnets</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {vlans.length} VLANs Configured
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Switch active subnet by clicking a card or searching below
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Search */}
            <div className="relative w-44 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search VLAN or subnet..."
                value={vlanSearch}
                onChange={(e) => setVlanSearch(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {vlanSearch && (
                <button
                  type="button"
                  onClick={() => setVlanSearch("")}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* View Mode Toggle: Cards vs Table */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setVlanViewMode("cards")}
                className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  vlanViewMode === "cards" ? "bg-white text-blue-600 shadow-xs" : "text-slate-500 hover:text-slate-700"
                }`}
                title="Cards Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setVlanViewMode("table")}
                className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  vlanViewMode === "table" ? "bg-white text-blue-600 shadow-xs" : "text-slate-500 hover:text-slate-700"
                }`}
                title="Table View (Optimized for 100+ VLANs)"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Table</span>
              </button>
            </div>

            {/* Collapse Toggle */}
            <button
              type="button"
              onClick={() => setVlanCollapsed((prev) => !prev)}
              className="px-2.5 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
              title={vlanCollapsed ? "Expand VLAN list" : "Collapse VLAN list to focus on IP table"}
            >
              {vlanCollapsed ? (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-semibold">Expand</span>
                </>
              ) : (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-semibold">Collapse</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Range Filter Chips */}
        {!vlanCollapsed && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              <span>Range:</span>
            </span>
            {[
              { id: "ALL", label: `All (${vlans.length})` },
              { id: "1-99", label: "1-99 Infra/Mgmt" },
              { id: "100-199", label: "100-199 Core" },
              { id: "200-299", label: "200-299 Trading" },
              { id: "300-399", label: "300-399 Server/DMZ" },
              { id: "400+", label: "400+ Branch/B2B" },
            ].map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setVlanRangeFilter(chip.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                  vlanRangeFilter === chip.id
                    ? "bg-blue-600 text-white font-bold shadow-xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}

        {/* Collapsed Sticky Banner */}
        {vlanCollapsed ? (
          <div className="p-3 bg-gradient-to-r from-blue-50/90 via-slate-50 to-white rounded-xl border border-blue-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-3">
              <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-blue-600 text-white shadow-xs">
                VLAN {currentVlan?.vlan_id || "Active"}
              </span>
              <div>
                <span className="font-bold text-slate-900">{currentVlan?.name || "Selected Subnet"}</span>
                <span className="text-slate-400 mx-2">•</span>
                <span className="font-mono text-blue-600 font-semibold">{selectedSubnet}</span>
                <span className="text-slate-400 mx-2">•</span>
                <span className="text-slate-500">GW: {currentVlan?.gateway || "-"}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setVlanCollapsed(false)}
              className="text-[11px] text-blue-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Browse All {vlans.length} VLANs</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : vlanViewMode === "cards" ? (
          /* Cards Grid Mode with Pagination */
          <div className="space-y-3">
            {filteredVlans.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                No VLANs matching filter &quot;{vlanSearch || vlanRangeFilter}&quot;.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {paginatedVlans.map((v) => {
                  const isSelected = selectedSubnet === v.subnet;
                  return (
                    <div
                      key={v.id}
                      onClick={() => {
                        setSelectedSubnet(v.subnet);
                        setSelectedVlanId(v.id);
                      }}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "bg-white border-blue-600 ring-2 ring-blue-500/20 shadow-md"
                          : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            VLAN {v.vlan_id}
                          </span>
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditVlan(v);
                              }}
                              className="p-1 text-slate-400 hover:text-blue-600 rounded"
                              title="Edit VLAN"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmDelete("vlan", v.id, `VLAN ${v.vlan_id} (${v.name})`);
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              title="Delete VLAN"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <h3 className="text-xs font-bold text-slate-900 mt-2 truncate">{v.name}</h3>
                        <p className="text-[11px] font-mono text-slate-500 mt-0.5">{v.subnet}</p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">GW: {v.gateway}</span>
                        <span className="font-bold text-blue-600">{v.ip_count} IPs</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls for VLAN Cards */}
            {filteredVlans.length > vlanPageSize && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                <span>
                  Showing {Math.min((vlanPage - 1) * vlanPageSize + 1, filteredVlans.length)} to{" "}
                  {Math.min(vlanPage * vlanPageSize, filteredVlans.length)} of {filteredVlans.length} VLANs
                </span>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <span>Show:</span>
                    <select
                      value={vlanPageSize}
                      onChange={(e) => setVlanPageSize(Number(e.target.value))}
                      className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-700"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={-1}>All</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    disabled={vlanPage === 1}
                    onClick={() => setVlanPage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="px-2 font-medium">Page {vlanPage} of {totalVlanPages}</span>
                  <button
                    type="button"
                    disabled={vlanPage === totalVlanPages}
                    onClick={() => setVlanPage((p) => Math.min(totalVlanPages, p + 1))}
                    className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Dense Table Mode for 100+ VLANs */
          <div className="space-y-3">
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">Status</th>
                    <th className="py-2.5 px-3">VLAN ID</th>
                    <th className="py-2.5 px-3">VLAN Name</th>
                    <th className="py-2.5 px-3">Subnet CIDR</th>
                    <th className="py-2.5 px-3">Default Gateway</th>
                    <th className="py-2.5 px-3 text-center">Configured IPs</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedVlans.map((v) => {
                    const isSelected = selectedSubnet === v.subnet;
                    return (
                      <tr
                        key={v.id}
                        onClick={() => {
                          setSelectedSubnet(v.subnet);
                          setSelectedVlanId(v.id);
                        }}
                        className={`hover:bg-blue-50/50 transition-colors cursor-pointer ${
                          isSelected ? "bg-blue-50/80 font-medium" : ""
                        }`}
                      >
                        <td className="py-2 px-3 text-center">
                          {isSelected ? (
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block shadow-xs" title="Currently Selected"></span>
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-slate-300 inline-block"></span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-blue-600">
                          VLAN {v.vlan_id}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-800">
                          {v.name}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-600">
                          {v.subnet}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-500">
                          {v.gateway}
                        </td>
                        <td className="py-2 px-3 text-center font-bold text-slate-700">
                          {v.ip_count} IPs
                        </td>
                        <td className="py-2 px-3 text-right space-x-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditVlan(v);
                            }}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded"
                            title="Edit VLAN"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDelete("vlan", v.id, `VLAN ${v.vlan_id} (${v.name})`);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="Delete VLAN"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls for VLAN Table */}
            {filteredVlans.length > vlanPageSize && (
              <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
                <span>
                  Showing {Math.min((vlanPage - 1) * vlanPageSize + 1, filteredVlans.length)} to{" "}
                  {Math.min(vlanPage * vlanPageSize, filteredVlans.length)} of {filteredVlans.length} VLANs
                </span>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <span>Show:</span>
                    <select
                      value={vlanPageSize}
                      onChange={(e) => setVlanPageSize(Number(e.target.value))}
                      className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-700"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={-1}>All</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    disabled={vlanPage === 1}
                    onClick={() => setVlanPage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="px-2 font-medium">Page {vlanPage} of {totalVlanPages}</span>
                  <button
                    type="button"
                    disabled={vlanPage === totalVlanPages}
                    onClick={() => setVlanPage((p) => Math.min(totalVlanPages, p + 1))}
                    className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Subnet Utilization Bar & Key Stats */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Subnet: <span className="font-mono text-blue-600">{selectedSubnet}</span>
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live address allocation ledger for active subnet pool
            </p>
          </div>

          <div className="flex items-center space-x-6 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Total Pool</span>
              <span className="font-bold text-slate-800">{totalInSubnet} IPs</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Assigned</span>
              <span className="font-bold text-blue-600">{assignedCount}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Available</span>
              <span className="font-bold text-emerald-600">{availableCount}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Utilization</span>
              <span
                className={`font-bold ${
                  utilizationPct > 80 ? "text-rose-600" : utilizationPct > 50 ? "text-amber-600" : "text-emerald-600"
                }`}
              >
                {utilizationPct}%
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              utilizationPct > 80 ? "bg-rose-500" : utilizationPct > 50 ? "bg-amber-500" : "bg-blue-600"
            }`}
            style={{ width: `${Math.min(utilizationPct, 100)}%` }}
          />
        </div>
      </div>

      {/* Filter and Table Tools */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by IP, hostname, MAC, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>

        {/* Status Filter, Device Type Filter and Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Assigned">Assigned</option>
            <option value="Reserved">Reserved</option>
          </select>

          <select
            value={deviceTypeFilter}
            onChange={(e) => setDeviceTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Device Types</option>
            <option value="Server VM">💻 Server VM</option>
            <option value="Endpoint / PC User">🖥️ Endpoint / PC User</option>
            <option value="Network Hardware">🖧 Hardware Asset</option>
            <option value="Printer / Peripheral">🖨️ Printer / Peripheral</option>
            <option value="Gateway / VIP">🌐 Gateway / VIP</option>
            <option value="Other">Other</option>
          </select>

          <button
            onClick={() => {
              setBulkSubnet(selectedSubnet);
              setBulkText("");
              setBulkModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl shadow-xs cursor-pointer transition-colors"
            title="Import IP data from Excel / CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Import Excel</span>
          </button>

          <button
            onClick={openAddIp}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>New IP</span>
          </button>
        </div>
      </div>

      {/* IP Address Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-5 py-3.5">IP Address</th>
              <th className="px-5 py-3.5">Subnet / Mask</th>
              <th className="px-5 py-3.5 text-center">Status</th>
              <th className="px-5 py-3.5">Assigned Device & Type</th>
              <th className="px-5 py-3.5">Interface</th>
              <th className="px-5 py-3.5 font-mono">MAC Address</th>
              <th className="px-5 py-3.5">Description</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedAddresses.map((ip) => (
              <tr key={ip.id} className="hover:bg-slate-50/60 transition-colors">
                {/* IP Address */}
                <td className="px-5 py-3.5">
                  <div
                    onClick={() => {
                      setSelectedIpDetail(ip);
                      setIpDetailModalOpen(true);
                    }}
                    className="font-mono font-bold text-slate-900 text-xs hover:text-blue-600 hover:underline cursor-pointer flex items-center gap-1.5"
                    title="Click to view IP allocation details"
                  >
                    <span>{ip.ip_address}</span>
                    <Eye className="w-3 h-3 text-slate-400" />
                  </div>
                  <span className="text-[10px] text-slate-400 block">{ip.ip_version || "IPv4"}</span>
                </td>

                {/* Subnet */}
                <td className="px-5 py-3.5 font-mono text-[11px] text-slate-600">{ip.subnet}</td>

                {/* Status */}
                <td className="px-5 py-3.5 text-center">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      ip.status === "Assigned"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : ip.status === "Available"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {ip.status}
                  </span>
                </td>

                {/* Assigned Hostname & Device Type */}
                <td className="px-5 py-3.5">
                  {ip.hostname ? (
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {ip.asset_id && onSelectAsset ? (
                          <span
                            onClick={() => onSelectAsset(ip.hostname || ip.asset_id)}
                            className="font-bold text-slate-900 hover:text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                            title="Click to view linked asset profile"
                          >
                            <span>{ip.hostname}</span>
                            <ExternalLink className="w-3 h-3 text-blue-600" />
                          </span>
                        ) : (
                          <span className="font-bold text-slate-900">{ip.hostname}</span>
                        )}
                        {renderDeviceTypeBadge(ip.device_type, ip.asset_id)}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {ip.asset_id ? (
                          <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                            Asset #{ip.asset_id}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">
                            Non-Asset (Standalone)
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">Unassigned</span>
                  )}
                </td>

                {/* Interface */}
                <td className="px-5 py-3.5 font-mono text-[11px] text-slate-600">
                  {ip.interface_name || "—"}
                </td>

                {/* MAC */}
                <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">
                  {ip.mac_address || "—"}
                </td>

                {/* Description */}
                <td className="px-5 py-3.5 text-slate-500 max-w-xs truncate">{ip.description || "—"}</td>

                {/* Actions */}
                <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                  {ip.status === "Available" ? (
                    <button
                      onClick={() => openAssignModalForIp(ip.ip_address)}
                      className="px-2 py-1 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors inline-block"
                      title="Assign this IP"
                    >
                      Assign
                    </button>
                  ) : ip.status === "Assigned" ? (
                    <button
                      onClick={() => handleReleaseIp(ip.ip_address)}
                      className="px-2 py-1 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded transition-colors inline-block"
                      title="Release IP to Available"
                    >
                      Release
                    </button>
                  ) : null}

                  <button
                    onClick={() => {
                      setSelectedIpDetail(ip);
                      setIpDetailModalOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100 transition-colors inline-block cursor-pointer"
                    title="View IP Details"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => openEditIp(ip)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100 transition-colors inline-block cursor-pointer"
                    title="Edit IP"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => confirmDelete("ip", ip.id, ip.ip_address)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition-colors inline-block"
                    title="Delete IP"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination Bar for IP Addresses */}
        {addresses.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center space-x-2">
              <span>
                Showing <span className="font-bold text-slate-700">{addresses.length === 0 ? 0 : (ipPage - 1) * ipPageSize + 1}</span> to{" "}
                <span className="font-bold text-slate-700">
                  {ipPageSize === -1 ? addresses.length : Math.min(ipPage * ipPageSize, addresses.length)}
                </span>{" "}
                of <span className="font-bold text-slate-700">{addresses.length}</span> IP allocations
              </span>
              <span className="text-slate-300">|</span>
              <div className="flex items-center space-x-1">
                <span>Per page:</span>
                <select
                  value={ipPageSize}
                  onChange={(e) => setIpPageSize(Number(e.target.value))}
                  className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-700 cursor-pointer"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={-1}>All</option>
                </select>
              </div>
            </div>

            {totalIpPages > 1 && ipPageSize !== -1 && (
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  disabled={ipPage === 1}
                  onClick={() => setIpPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>
                <span className="px-2 font-medium">
                  Page {ipPage} of {totalIpPages}
                </span>
                <button
                  type="button"
                  disabled={ipPage === totalIpPages}
                  onClick={() => setIpPage((p) => Math.min(totalIpPages, p + 1))}
                  className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ======================================================================== */}
      {/* MODAL 1: ADD / EDIT VLAN                                                 */}
      {/* ======================================================================== */}
      {vlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <h3 className="text-sm font-bold text-slate-900">
                {editingVlan ? "Edit 802.1Q VLAN" : "Add New VLAN Subnet"}
              </h3>
              <button
                type="button"
                onClick={() => setVlanModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveVlan} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">VLAN ID *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={4094}
                    placeholder="e.g. 100"
                    value={vlanForm.vlan_id}
                    onChange={(e) => setVlanForm({ ...vlanForm, vlan_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">VLAN Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Trading DMZ"
                    value={vlanForm.name}
                    onChange={(e) => setVlanForm({ ...vlanForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Subnet CIDR *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10.200.10.0/24"
                    value={vlanForm.subnet}
                    onChange={(e) => setVlanForm({ ...vlanForm, subnet: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Default Gateway *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10.200.10.1"
                    value={vlanForm.gateway}
                    onChange={(e) => setVlanForm({ ...vlanForm, gateway: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Description / Purpose</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Low-latency trading network for HKEX gateway connectivity"
                  value={vlanForm.description}
                  onChange={(e) => setVlanForm({ ...vlanForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setVlanModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1E60D5] hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm"
                >
                  {editingVlan ? "Update VLAN" : "Create VLAN"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================== */}
      {/* MODAL 2: ASSIGN IP TO DEVICE (STANDALONE VM / ENDPOINT OR HARDWARE ASSET)*/}
      {/* ======================================================================== */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Alokasikan / Assign IP Address</h3>
                <p className="text-[11px] text-slate-500">
                  IP: <span className="font-mono font-bold text-blue-600">{assignForm.ip_address}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="p-6 space-y-4 text-xs">
              {/* Mode Switcher Tabs */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                  Device Allocation Mode:
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setAssignMode("standalone")}
                    className={`py-2 px-3 text-xs font-bold rounded-lg transition-all text-center ${
                      assignMode === "standalone"
                        ? "bg-white text-blue-700 shadow-xs border border-slate-200/60"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    💻 VM / Endpoint (Non-Asset)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignMode("asset")}
                    className={`py-2 px-3 text-xs font-bold rounded-lg transition-all text-center ${
                      assignMode === "asset"
                        ? "bg-white text-blue-700 shadow-xs border border-slate-200/60"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    🖧 Link to Hardware Asset
                  </button>
                </div>
              </div>

              {/* Standalone Device Form */}
              {assignMode === "standalone" ? (
                <>
                  <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl text-[11px] text-blue-900 leading-relaxed">
                    💡 <strong>No physical hardware asset required.</strong> Enter your virtual machine or device hostname below.
                    If a physical hardware asset is registered later, you can link it at any time via <strong>Edit IP</strong>.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Hostname / Device Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. SRV-VM-APP01 or PC-USER-12"
                        value={assignForm.hostname}
                        onChange={(e) => setAssignForm({ ...assignForm, hostname: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Device Type *
                      </label>
                      <select
                        value={assignForm.device_type}
                        onChange={(e) => setAssignForm({ ...assignForm, device_type: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 focus:bg-white text-xs"
                      >
                        <option value="Server VM">💻 Server VM / Virtual Server</option>
                        <option value="Endpoint / PC User">🖥️ Endpoint / PC User</option>
                        <option value="Printer / Peripheral">🖨️ Printer / Office Peripheral</option>
                        <option value="Gateway / VIP">🌐 Gateway / Floating VIP</option>
                        <option value="Other">Other / Testing</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        MAC Address (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="00:50:56:xx:xx:xx"
                        value={assignForm.mac_address}
                        onChange={(e) => setAssignForm({ ...assignForm, mac_address: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Interface / Port (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. eth0, ens192, vmnic0"
                        value={assignForm.interface_name}
                        onChange={(e) => setAssignForm({ ...assignForm, interface_name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Description / User / Service
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Production Web Frontend / User Workstation"
                      value={assignForm.description}
                      onChange={(e) => setAssignForm({ ...assignForm, description: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white text-xs"
                    />
                  </div>
                </>
              ) : (
                /* Hardware Asset Form */
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Select Hardware Asset from Inventory *
                    </label>
                    {assignableAssets.length === 0 ? (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                        ⚠️ No hardware assets registered in the system yet. Switch to the <strong>"VM / Endpoint (Non-Asset)"</strong> tab above to allocate this IP address.
                      </div>
                    ) : (
                      <SearchableSelect
                        options={assignableAssets.map((a) => ({
                          value: a.id,
                          label: `${a.hostname} (${a.asset_id})`,
                          subLabel: `${a.model || ""} [Current IP: ${a.management_ip || "-"}]`,
                        }))}
                        value={assignForm.asset_id || (assignableAssets[0]?.id ?? 0)}
                        onChange={(val) => setAssignForm({ ...assignForm, asset_id: Number(val) })}
                        placeholder="Search asset by hostname or tag..."
                        searchPlaceholder="Type hostname, tag, or IP..."
                        searchThreshold={5}
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Network Interface Name</label>
                    <input
                      type="text"
                      placeholder="e.g. GigabitEthernet1/0/1 or Management0"
                      value={assignForm.interface_name}
                      onChange={(e) => setAssignForm({ ...assignForm, interface_name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Additional Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Dedicated management uplink interface"
                      value={assignForm.description}
                      onChange={(e) => setAssignForm({ ...assignForm, description: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white text-xs"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignMode === "asset" && assignableAssets.length === 0}
                  className="px-4 py-2 bg-[#1E60D5] hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  Confirm IP Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================== */}
      {/* MODAL 3: ADD / EDIT SINGLE IP                                            */}
      {/* ======================================================================== */}
      {ipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <h3 className="text-sm font-bold text-slate-900">
                {editingIp ? "Edit IP Address Record" : "Add Single IP Address"}
              </h3>
              <button
                type="button"
                onClick={() => setIpModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveIp} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">IP Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10.200.100.5"
                    value={ipForm.ip_address}
                    onChange={(e) => setIpForm({ ...ipForm, ip_address: e.target.value.trim() })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Allocation Status</label>
                  <select
                    value={ipForm.status}
                    onChange={(e) => setIpForm({ ...ipForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold focus:bg-white"
                  >
                    <option value="Available">Available</option>
                    <option value="Assigned">Assigned</option>
                    <option value="Reserved">Reserved</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Subnet</label>
                  <input
                    type="text"
                    required
                    value={ipForm.subnet}
                    onChange={(e) => setIpForm({ ...ipForm, subnet: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Device Type</label>
                  <select
                    value={ipForm.device_type}
                    onChange={(e) => setIpForm({ ...ipForm, device_type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 focus:bg-white text-xs"
                  >
                    <option value="Server VM">💻 Server VM</option>
                    <option value="Endpoint / PC User">🖥️ Endpoint / PC User</option>
                    <option value="Network Hardware">🖧 Hardware Asset</option>
                    <option value="Printer / Peripheral">🖨️ Printer / Peripheral</option>
                    <option value="Gateway / VIP">🌐 Gateway / VIP</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Link to Hardware Asset (Optional) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Link to Hardware Asset (Optional)
                  </label>
                  {ipForm.asset_id && (
                    <button
                      type="button"
                      onClick={() => setIpForm({ ...ipForm, asset_id: null })}
                      className="text-[10px] text-rose-600 hover:underline font-semibold"
                    >
                      Unlink Asset
                    </button>
                  )}
                </div>
                <SearchableSelect
                  options={[
                    {
                      value: 0,
                      label: "— None / Non-Asset (Standalone / VM) —",
                      subLabel: "IP used by virtual server, endpoint, or unlinked equipment",
                    },
                    ...assignableAssets.map((a) => ({
                      value: a.id,
                      label: `${a.hostname} (${a.asset_id})`,
                      subLabel: `${a.model || ""} [Current IP: ${a.management_ip || "-"}]`,
                    })),
                  ]}
                  value={ipForm.asset_id || 0}
                  onChange={(val) => {
                    const num = Number(val);
                    if (num === 0) {
                      setIpForm({ ...ipForm, asset_id: null });
                    } else {
                      const found = assignableAssets.find((a) => a.id === num);
                      setIpForm({
                        ...ipForm,
                        asset_id: num,
                        hostname: ipForm.hostname || (found ? found.hostname : ""),
                        mac_address: ipForm.mac_address || (found && found.mac_address !== "N/A" ? found.mac_address : ""),
                        device_type: "Network Hardware",
                      });
                    }
                  }}
                  placeholder="Select or search asset..."
                  searchPlaceholder="Type hostname, tag, or model..."
                  searchThreshold={5}
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  If physical hardware asset is not yet registered, leave as "None". You can link it here at any time.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Hostname / Device Name</label>
                  <input
                    type="text"
                    placeholder="e.g. SRV-APP-01"
                    value={ipForm.hostname}
                    onChange={(e) => setIpForm({ ...ipForm, hostname: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">MAC Address</label>
                  <input
                    type="text"
                    placeholder="00:1A:2B:3C:4D:5E"
                    value={ipForm.mac_address}
                    onChange={(e) => setIpForm({ ...ipForm, mac_address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Interface Name</label>
                <input
                  type="text"
                  placeholder="e.g. eth0, ens192, or GigabitEthernet1/0/1"
                  value={ipForm.interface_name}
                  onChange={(e) => setIpForm({ ...ipForm, interface_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Description / Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. Production database VM"
                  value={ipForm.description}
                  onChange={(e) => setIpForm({ ...ipForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIpModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1E60D5] hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm"
                >
                  {editingIp ? "Update IP" : "Create IP"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================== */}
      {/* MODAL: BULK IMPORT IP FROM EXCEL / CSV                                   */}
      {/* ======================================================================== */}
      {bulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Import IP Records from Excel / CSV</h3>
                  <p className="text-[11px] text-slate-500">
                    Import IP allocations directly from a spreadsheet without requiring physical hardware assets.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBulkModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBulkImport} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Target Subnet / Network Segment *
                  </label>
                  <input
                    type="text"
                    required
                    value={bulkSubnet}
                    onChange={(e) => setBulkSubnet(e.target.value)}
                    placeholder="e.g. 10.200.10.0/24"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold focus:bg-white text-xs"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => {
                      setBulkText(
`10.200.10.11\tSRV-DB-PROD01\tServer VM\tPrimary MySQL Database Cluster A
10.200.10.12\tSRV-APP-PROD01\tServer VM\tProduction Backend API
10.200.10.50\tPC-FINANCE-01\tEndpoint / PC User\tFinance Dept Workstation
10.200.10.88\tPRINTER-FIN-FL2\tPrinter / Peripheral\tNetwork Printer HP LaserJet
10.200.10.1\tGW-VRRP-VIP\tGateway / VIP\tVirtual IP Gateway Router`
                      );
                    }}
                    className="w-full py-2 px-3 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold text-center text-[11px]"
                  >
                    Load Sample Excel Format
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    Paste Data (Copy-Paste from Excel Columns) *
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Format: IP [Tab/Comma] Hostname [Tab/Comma] Device Type [Tab/Comma] Description
                  </span>
                </div>
                <textarea
                  rows={6}
                  required
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={`Sample Excel rows:\n10.200.10.20\tSRV-VM-TEST01\tServer VM\tStaging Testing Server\n10.200.10.21\tPC-USER-05\tEndpoint / PC User\tFinance Workstation`}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] leading-relaxed focus:bg-white outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Live Preview */}
              {parseBulkText().length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-700">
                      Detected Data Preview ({parseBulkText().length} records):
                    </span>
                    <span className="text-emerald-600 font-semibold">Ready to Import</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50/50">
                    <table className="w-full text-[11px] text-left">
                      <thead className="bg-slate-100 text-slate-600 text-[10px] font-bold uppercase sticky top-0">
                        <tr>
                          <th className="px-3 py-1.5">IP</th>
                          <th className="px-3 py-1.5">Hostname</th>
                          <th className="px-3 py-1.5">Device Type</th>
                          <th className="px-3 py-1.5">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parseBulkText().slice(0, 10).map((row, idx) => (
                          <tr key={idx} className="hover:bg-white">
                            <td className="px-3 py-1.5 font-mono font-bold text-blue-700">{row.ip_address}</td>
                            <td className="px-3 py-1.5 font-semibold text-slate-800">{row.hostname || "—"}</td>
                            <td className="px-3 py-1.5 text-slate-600">{row.device_type}</td>
                            <td className="px-3 py-1.5 text-slate-500 truncate max-w-xs">{row.description || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parseBulkText().length > 10 && (
                      <div className="px-3 py-1 text-[10px] text-slate-400 bg-slate-50 text-center border-t border-slate-100">
                        + {parseBulkText().length - 10} more records...
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBulkModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBulkImporting || parseBulkText().length === 0}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isBulkImporting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Importing Records...</span>
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Import {parseBulkText().length} Records to IPAM</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================== */}
      {/* MODAL 4: GENERATE IP BATCH POOL                                          */}
      {/* ======================================================================== */}
      {batchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <h3 className="text-sm font-bold text-slate-900">Generate Sequential IP Pool</h3>
              <button
                type="button"
                onClick={() => setBatchModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBatchGenerate} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Target Subnet CIDR *</label>
                <input
                  type="text"
                  required
                  value={batchForm.subnet}
                  onChange={(e) => setBatchForm({ ...batchForm, subnet: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Start Host Number *</label>
                  <input
                    type="number"
                    min={1}
                    max={254}
                    required
                    value={batchForm.start_host}
                    onChange={(e) => setBatchForm({ ...batchForm, start_host: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-400">e.g. 1 (.1)</span>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">End Host Number *</label>
                  <input
                    type="number"
                    min={1}
                    max={254}
                    required
                    value={batchForm.end_host}
                    onChange={(e) => setBatchForm({ ...batchForm, end_host: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-400">e.g. 50 (.50)</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 bg-blue-50/60 p-3 rounded-lg border border-blue-100">
                This will automatically generate available IP records for the specified range, skipping any that already exist.
              </p>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBatchModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1E60D5] hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm"
                >
                  Generate Pool
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================== */}
      {/* MODAL 6: IP ADDRESS ALLOCATION DETAIL                                    */}
      {/* ======================================================================== */}
      {ipDetailModalOpen && selectedIpDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  IP Allocation Profile: {selectedIpDetail.ip_address}
                </h3>
              </div>
              <button
                onClick={() => setIpDetailModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">IP Address</span>
                  <span className="font-mono font-bold text-base text-blue-600">{selectedIpDetail.ip_address}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Allocation Status</span>
                  <span
                    className={`inline-block px-2 py-0.5 mt-0.5 rounded-full text-[10px] font-bold border ${
                      selectedIpDetail.status === "Assigned"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : selectedIpDetail.status === "Available"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {selectedIpDetail.status}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Subnet CIDR</span>
                  <span className="font-mono text-slate-700 font-semibold">{selectedIpDetail.subnet}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">IP Protocol</span>
                  <span className="font-semibold text-slate-700">{selectedIpDetail.ip_version || "IPv4 Static"}</span>
                </div>
              </div>

              {/* Hostname & Associated Hardware */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                    Connected Device & Hardware Profile
                  </span>
                  {renderDeviceTypeBadge(selectedIpDetail.device_type, selectedIpDetail.asset_id)}
                </div>
                <div className="grid grid-cols-2 gap-3 pt-0.5">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Assigned Hostname:</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {selectedIpDetail.hostname || "Unassigned"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Hardware Asset:</span>
                    {selectedIpDetail.asset_id ? (
                      <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs inline-block">
                        Asset #{selectedIpDetail.asset_id}
                        {selectedIpDetail.asset_tag ? ` (${selectedIpDetail.asset_tag})` : ""}
                      </span>
                    ) : (
                      <span className="text-slate-500 font-medium text-xs">
                        Non-Asset (Standalone / VM)
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Switch / NIC Interface:</span>
                    <span className="font-mono text-slate-700">{selectedIpDetail.interface_name || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">MAC Address:</span>
                    <span className="font-mono text-slate-700">{selectedIpDetail.mac_address || "—"}</span>
                  </div>
                </div>

                {selectedIpDetail.asset_id && onSelectAsset && (
                  <button
                    type="button"
                    onClick={() => {
                      setIpDetailModalOpen(false);
                      onSelectAsset(selectedIpDetail.hostname || selectedIpDetail.asset_id);
                    }}
                    className="w-full mt-2 py-2 px-3 text-xs font-semibold text-white bg-[#1E60D5] hover:bg-blue-700 rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Server className="w-3.5 h-3.5" />
                    <span>View Connected Asset Details ({selectedIpDetail.hostname})</span>
                  </button>
                )}
              </div>

              {selectedIpDetail.description && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 uppercase text-[10px] font-bold block mb-1">Operational Description</span>
                  <p className="text-slate-700">{selectedIpDetail.description}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIpDetailModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================== */}
      {/* MODAL 5: DELETE CONFIRMATION                                             */}
      {/* ======================================================================== */}
      {deleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm p-6 text-center animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Confirm Deletion</h3>
            <p className="text-xs text-slate-500 mt-2">
              Are you sure you want to delete <span className="font-bold text-slate-800">{itemToDelete.name}</span>?
              This action cannot be undone.
            </p>
            <div className="flex items-center justify-center space-x-3 mt-6">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-50 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-xs shadow-sm"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
