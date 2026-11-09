"use client";

import React, { useState, useEffect } from "react";
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
  Activity
} from "lucide-react";
import { apiUrl } from "@/lib/api";

export function IPAMView() {
  const [vlans, setVlans] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [assignableAssets, setAssignableAssets] = useState<any[]>([]);
  const [selectedSubnet, setSelectedSubnet] = useState<string>("10.200.100.0/24");
  const [selectedVlanId, setSelectedVlanId] = useState<number | null>(null);

  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
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
  const [batchModalOpen, setBatchModalOpen] = useState<boolean>(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: "vlan" | "ip"; id: number; name: string } | null>(null);

  // VLAN Form
  const [vlanForm, setVlanForm] = useState({
    vlan_id: 100,
    name: "",
    subnet: "10.200.10.0/24",
    gateway: "10.200.10.1",
    description: "",
  });

  // Single IP Form (Add / Edit)
  const [ipForm, setIpForm] = useState({
    ip_address: "",
    subnet: "10.200.100.0/24",
    vlan_id: 1,
    status: "Available",
    hostname: "",
    mac_address: "",
    interface_name: "GigabitEthernet1/0/1",
    description: "",
  });

  // Assign IP Form
  const [assignForm, setAssignForm] = useState({
    ip_address: "",
    asset_id: 1,
    interface_name: "GigabitEthernet1/0/1",
  });
  const [assetSearch, setAssetSearch] = useState<string>("");

  // Batch Generation Form
  const [batchForm, setBatchForm] = useState({
    subnet: "10.200.100.0/24",
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
  }, [selectedSubnet, statusFilter, search]);

  // ============================================================================
  // VLAN CRUD Handlers
  // ============================================================================
  const openAddVlan = () => {
    setEditingVlan(null);
    setVlanForm({
      vlan_id: 100,
      name: "",
      subnet: "10.200.10.0/24",
      gateway: "10.200.10.1",
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
      hostname: "",
      mac_address: "",
      interface_name: "GigabitEthernet1/0/1",
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
      hostname: rec.hostname || "",
      mac_address: rec.mac_address || "",
      interface_name: rec.interface_name || "GigabitEthernet1/0/1",
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

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(ipForm),
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
    setAssignForm({
      ip_address: ipAddr || "",
      asset_id: assignableAssets.length > 0 ? assignableAssets[0].id : 1,
      interface_name: "GigabitEthernet1/0/1",
    });
    setAssetSearch("");
    setAssignModalOpen(true);
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(
        apiUrl(
          `/api/v1/ipam/assign?ip_address=${encodeURIComponent(
            assignForm.ip_address
          )}&asset_id=${assignForm.asset_id}&interface_name=${encodeURIComponent(assignForm.interface_name)}`
        ),
        {
          method: "POST",
          headers: getAuthHeaders(),
        }
      );

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

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            IP Address Management (IPAM) & Subnet Planner
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Centrally manage IPv4/IPv6 address allocations, 802.1Q VLANs, default gateways, and dynamic hardware device assignments.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center space-x-2">
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
            <span>Generate IP Pool</span>
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

      {/* VLAN Selector Cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Select Active VLAN Subnet
          </span>
          <span className="text-[11px] text-slate-500">{vlans.length} configured VLANs</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {vlans.map((v) => {
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

        {/* Status Filter and Add IP Button */}
        <div className="flex items-center space-x-2">
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
              <th className="px-5 py-3.5">Assigned Asset</th>
              <th className="px-5 py-3.5">Interface</th>
              <th className="px-5 py-3.5 font-mono">MAC Address</th>
              <th className="px-5 py-3.5">Description</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {addresses.map((ip) => (
              <tr key={ip.id} className="hover:bg-slate-50/60 transition-colors">
                {/* IP Address */}
                <td className="px-5 py-3.5">
                  <span className="font-mono font-bold text-slate-900 text-xs">{ip.ip_address}</span>
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

                {/* Assigned Hostname */}
                <td className="px-5 py-3.5">
                  {ip.hostname ? (
                    <div>
                      <span className="font-bold text-slate-900 block">{ip.hostname}</span>
                      {ip.asset_id && (
                        <span className="text-[10px] font-mono text-slate-400">ID #{ip.asset_id}</span>
                      )}
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
                    onClick={() => openEditIp(ip)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100 transition-colors inline-block"
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
      {/* MODAL 2: ASSIGN IP TO ASSET                                              */}
      {/* ======================================================================== */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <h3 className="text-sm font-bold text-slate-900">Assign IP Address to Hardware Device</h3>
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">IP Address to Assign *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10.200.100.25"
                  value={assignForm.ip_address}
                  onChange={(e) => setAssignForm({ ...assignForm, ip_address: e.target.value.trim() })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Select Target Device *</label>
                <input
                  type="text"
                  placeholder="Search device by hostname or asset ID..."
                  value={assetSearch}
                  onChange={(e) => setAssetSearch(e.target.value)}
                  className="w-full mb-2 px-2.5 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded-md"
                />
                <select
                  value={assignForm.asset_id}
                  onChange={(e) => setAssignForm({ ...assignForm, asset_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 focus:bg-white"
                >
                  {filteredAssets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.hostname} ({a.asset_id}) - {a.model} [Current IP: {a.management_ip}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Network Interface Name</label>
                <input
                  type="text"
                  placeholder="e.g. GigabitEthernet1/0/1 or bond0"
                  value={assignForm.interface_name}
                  onChange={(e) => setAssignForm({ ...assignForm, interface_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white"
                />
              </div>

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
                  className="px-4 py-2 bg-[#1E60D5] hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm"
                >
                  Confirm Assignment
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
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-fadeIn">
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Hostname</label>
                  <input
                    type="text"
                    placeholder="e.g. SW-ACC-01"
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
                  placeholder="GigabitEthernet1/0/1"
                  value={ipForm.interface_name}
                  onChange={(e) => setIpForm({ ...ipForm, interface_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Description / Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. Dedicated management interface"
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
