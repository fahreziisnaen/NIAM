"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Network,
  Search,
  Plus,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building2,
  Copy,
  Check,
  Edit2,
  Trash2,
  Eye,
  X,
  ExternalLink,
  Shield,
  Cable,
  Layers,
  ArrowUpDown,
  RefreshCw,
  Info
} from "lucide-react";
import { apiUrl } from "@/lib/api";

interface B2BConnectionItem {
  id: number;
  profile_name: string;
  company_name: string;
  connection_type: "VPN" | "Metro" | string;
  vpn_peer_ip?: string | null;
  metro_circuit_id?: string | null;
  metro_vlan_id?: number | null;
  metro_registration_owner?: "PSHK" | "B2B Company" | string | null;
  contract_expiry_date?: string | null;
  bandwidth?: string | null;
  status: string;
  service_type?: string | null;
  contact_person?: string | null;
  contact_email?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export function B2BConnectionsView() {
  const [connections, setConnections] = useState<B2BConnectionItem[]>([]);
  const [stats, setStats] = useState<any>({
    total_connections: 0,
    total_metro: 0,
    total_vpn: 0,
    pshk_owner_count: 0,
    b2b_owner_count: 0,
    expiring_soon_count: 0,
    expired_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "Metro" | "VPN">("ALL");
  const [ownerFilter, setOwnerFilter] = useState<"ALL" | "PSHK" | "B2B Company">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Active" | "Expiring Soon" | "Expired">("ALL");

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<B2BConnectionItem | null>(null);

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formProfileName, setFormProfileName] = useState("");
  const [formCompanyName, setFormCompanyName] = useState("");
  const [formConnectionType, setFormConnectionType] = useState<"VPN" | "Metro">("Metro");
  const [formVpnPeerIp, setFormVpnPeerIp] = useState("");
  const [formMetroCircuitId, setFormMetroCircuitId] = useState("");
  const [formMetroVlanId, setFormMetroVlanId] = useState<string>("");
  const [formMetroOwner, setFormMetroOwner] = useState<"PSHK" | "B2B Company">("PSHK");
  const [formExpiryDate, setFormExpiryDate] = useState("");
  const [formBandwidth, setFormBandwidth] = useState("1 Gbps");
  const [formStatus, setFormStatus] = useState("Active");
  const [formServiceType, setFormServiceType] = useState("FIX Protocol");
  const [formContactPerson, setFormContactPerson] = useState("");
  const [formContactEmail, setFormContactEmail] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Copied State
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchConnections = async () => {
    setLoading(true);
    try {
      let endpoint = `/api/v1/b2b-connections?page=1&page_size=100`;
      if (search.trim()) endpoint += `&search=${encodeURIComponent(search.trim())}`;
      if (typeFilter !== "ALL") endpoint += `&connection_type=${typeFilter}`;
      if (ownerFilter !== "ALL") endpoint += `&registration_owner=${encodeURIComponent(ownerFilter)}`;
      if (statusFilter !== "ALL") endpoint += `&status_filter=${encodeURIComponent(statusFilter)}`;

      const res = await fetch(apiUrl(endpoint));
      if (!res.ok) throw new Error("Failed to load B2B connections");
      const data = await res.json();
      setConnections(data.items || []);
      if (data.stats) setStats(data.stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, [search, typeFilter, ownerFilter, statusFilter]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setEditId(null);
    setFormProfileName("");
    setFormCompanyName("");
    setFormConnectionType("Metro");
    setFormVpnPeerIp("");
    setFormMetroCircuitId("");
    setFormMetroVlanId("");
    setFormMetroOwner("PSHK");
    setFormExpiryDate("");
    setFormBandwidth("1 Gbps");
    setFormStatus("Active");
    setFormServiceType("FIX Protocol");
    setFormContactPerson("");
    setFormContactEmail("");
    setFormNotes("");
    setFormError(null);
    setFormModalOpen(true);
  };

  const openEditModal = (item: B2BConnectionItem) => {
    setIsEditing(true);
    setEditId(item.id);
    setFormProfileName(item.profile_name || "");
    setFormCompanyName(item.company_name || "");
    setFormConnectionType((item.connection_type as "VPN" | "Metro") || "Metro");
    setFormVpnPeerIp(item.vpn_peer_ip || "");
    setFormMetroCircuitId(item.metro_circuit_id || "");
    setFormMetroVlanId(item.metro_vlan_id ? String(item.metro_vlan_id) : "");
    setFormMetroOwner((item.metro_registration_owner as "PSHK" | "B2B Company") || "PSHK");
    setFormExpiryDate(item.contract_expiry_date || "");
    setFormBandwidth(item.bandwidth || "1 Gbps");
    setFormStatus(item.status || "Active");
    setFormServiceType(item.service_type || "FIX Protocol");
    setFormContactPerson(item.contact_person || "");
    setFormContactEmail(item.contact_email || "");
    setFormNotes(item.notes || "");
    setFormError(null);
    setFormModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Basic Validation
    if (!formProfileName.trim()) {
      setFormError("B2B Connection Profile name is required.");
      return;
    }
    if (!formCompanyName.trim()) {
      setFormError("B2B Company Name is required.");
      return;
    }
    if (formConnectionType === "VPN" && !formVpnPeerIp.trim()) {
      setFormError("VPN Peer IP is required for VPN connection type.");
      return;
    }
    if (formConnectionType === "Metro" && !formMetroCircuitId.trim()) {
      setFormError("Metro Circuit ID is required for Metro Ethernet connection type.");
      return;
    }

    setFormSubmitting(true);
    try {
      const payload: any = {
        profile_name: formProfileName.trim(),
        company_name: formCompanyName.trim(),
        connection_type: formConnectionType,
        bandwidth: formBandwidth.trim() || null,
        status: formStatus,
        service_type: formServiceType.trim() || null,
        contract_expiry_date: formExpiryDate ? formExpiryDate : null,
        contact_person: formContactPerson.trim() || null,
        contact_email: formContactEmail.trim() || null,
        notes: formNotes.trim() || null,
      };

      if (formConnectionType === "VPN") {
        payload.vpn_peer_ip = formVpnPeerIp.trim();
        payload.metro_circuit_id = null;
        payload.metro_vlan_id = null;
        payload.metro_registration_owner = null;
      } else {
        payload.vpn_peer_ip = null;
        payload.metro_circuit_id = formMetroCircuitId.trim();
        payload.metro_vlan_id = formMetroVlanId ? parseInt(formMetroVlanId, 10) : null;
        payload.metro_registration_owner = formMetroOwner;
      }

      const token = typeof window !== "undefined" ? localStorage.getItem("phillip_token") : null;
      const url = isEditing
        ? apiUrl(`/api/v1/b2b-connections/${editId}`)
        : apiUrl(`/api/v1/b2b-connections`);
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to save B2B Connection Profile");
      }

      setFormModalOpen(false);
      fetchConnections();
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("phillip_token") : null;
      const res = await fetch(apiUrl(`/api/v1/b2b-connections/${selectedItem.id}`), {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to delete connection profile");
      }
      setDeleteModalOpen(false);
      setSelectedItem(null);
      fetchConnections();
    } catch (err) {
      console.error(err);
      alert("Failed to delete record.");
    }
  };

  const handleExportCSV = () => {
    window.open(apiUrl("/api/v1/b2b-connections/export/csv"), "_blank");
  };

  const getExpiryBadge = (expiryDateStr?: string | null) => {
    if (!expiryDateStr) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
          No Expiry Set
        </span>
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expiryDateStr);
    exp.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
          <AlertTriangle className="w-3 h-3 mr-1 text-red-500" />
          Expired ({Math.abs(diffDays)}d ago)
        </span>
      );
    }
    if (diffDays <= 60) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3 mr-1 text-amber-500" />
          Expiring in {diffDays}d
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-500" />
        Valid ({diffDays}d left)
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* 1. Header & Title Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 tracking-tight">
                B2B Connection Profiles
              </h1>
              <p className="text-xs text-slate-500">
                Institutional partner & exchange connectivity management (Metro Ethernet & IPsec VPN)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add B2B Connection
          </button>
        </div>
      </div>

      {/* 2. Top KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total B2B Profiles</span>
            <Network className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xl font-bold text-slate-800 mt-1">{stats.total_connections}</p>
          <span className="text-[11px] text-slate-400">All registered partners</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Metro Circuits</span>
            <Cable className="w-4 h-4 text-cyan-600" />
          </div>
          <p className="text-xl font-bold text-slate-800 mt-1">{stats.total_metro}</p>
          <span className="text-[11px] text-cyan-600 font-medium">Dedicated Telco Links</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">VPN Tunnels</span>
            <Shield className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-xl font-bold text-slate-800 mt-1">{stats.total_vpn}</p>
          <span className="text-[11px] text-indigo-600 font-medium">IPsec Site-to-Site</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">PSHK Registered</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-bold text-slate-800 mt-1">{stats.pshk_owner_count}</p>
          <span className="text-[11px] text-slate-400">Carrier billed to PSHK</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Contract Attention</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-bold text-amber-600 mt-1">
            {stats.expiring_soon_count + stats.expired_count}
          </p>
          <span className="text-[11px] text-slate-400">
            {stats.expiring_soon_count} soon, {stats.expired_count} expired
          </span>
        </div>
      </div>

      {/* 3. Filter & Search Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Profile, Partner Company, Circuit ID, Peer IP..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter */}
          <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/60 text-xs">
            {(["ALL", "Metro", "VPN"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                  typeFilter === t
                    ? "bg-white text-blue-600 font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t === "ALL" ? "All Types" : t}
              </button>
            ))}
          </div>

          {/* Owner Filter */}
          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value as any)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">All Owners</option>
            <option value="PSHK">Owner: PSHK</option>
            <option value="B2B Company">Owner: B2B Company</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="Active">Active</option>
            <option value="Expiring Soon">Expiring Soon (≤60d)</option>
            <option value="Expired">Expired</option>
          </select>

          <button
            type="button"
            onClick={fetchConnections}
            title="Refresh List"
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* 4. Main Data Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200/80">
                <th className="py-3 px-4">B2B Profile & Partner</th>
                <th className="py-3 px-3">Type & Bandwidth</th>
                <th className="py-3 px-3">Network Parameters (IP / Circuit / VLAN)</th>
                <th className="py-3 px-3">Metro Registration Owner</th>
                <th className="py-3 px-3">Contract Expiry (B2B Team)</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading && connections.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-blue-500" />
                    Loading B2B Connection Profiles...
                  </td>
                </tr>
              ) : connections.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No B2B Connection Profiles match the current criteria.
                  </td>
                </tr>
              ) : (
                connections.map((item) => {
                  const isVpn = (item.connection_type || "").toUpperCase() === "VPN";
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-blue-50/30 transition-colors group"
                    >
                      {/* Column 1: Profile & Company */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 text-xs font-mono flex items-center space-x-1.5">
                            <span>{item.profile_name}</span>
                          </span>
                          <span className="text-[11px] font-medium text-slate-600 mt-0.5">
                            {item.company_name}
                          </span>
                          {item.service_type && (
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              {item.service_type}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 2: Connection Type & Bandwidth */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-1">
                          {isVpn ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <Shield className="w-3 h-3 mr-1" />
                              VPN IPsec
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
                              <Cable className="w-3 h-3 mr-1" />
                              Metro Ethernet
                            </span>
                          )}
                          {item.bandwidth && (
                            <div className="text-[11px] font-medium text-slate-500 pl-0.5">
                              {item.bandwidth}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Column 3: Network Parameters */}
                      <td className="py-3.5 px-3">
                        {isVpn ? (
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1.5">
                              <span className="text-[10px] uppercase font-bold text-slate-400">VPN Peer IP:</span>
                              <span className="font-mono text-[11px] font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                                {item.vpn_peer_ip || "Not Set"}
                              </span>
                              {item.vpn_peer_ip && (
                                <button
                                  type="button"
                                  onClick={() => handleCopy(item.vpn_peer_ip!, `ip-${item.id}`)}
                                  className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                                  title="Copy IP"
                                >
                                  {copiedKey === `ip-${item.id}` ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {/* Metro Circuit ID */}
                            <div className="flex items-center space-x-1.5">
                              <span className="text-[10px] uppercase font-bold text-slate-400">Circuit ID:</span>
                              <span className="font-mono text-[11px] font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                                {item.metro_circuit_id || "-"}
                              </span>
                              {item.metro_circuit_id && (
                                <button
                                  type="button"
                                  onClick={() => handleCopy(item.metro_circuit_id!, `ckt-${item.id}`)}
                                  className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                                  title="Copy Circuit ID"
                                >
                                  {copiedKey === `ckt-${item.id}` ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                            </div>

                            {/* Metro VLAN ID */}
                            <div className="flex items-center space-x-1.5">
                              <span className="text-[10px] uppercase font-bold text-slate-400">VLAN ID:</span>
                              <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                {item.metro_vlan_id ? `VLAN ${item.metro_vlan_id}` : "Unassigned"}
                              </span>
                              <span className="text-[10px] font-semibold text-slate-400 tracking-tight">
                                (IT Dept use only)
                              </span>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Column 4: Metro Registration Owner */}
                      <td className="py-3.5 px-3">
                        {!isVpn && item.metro_registration_owner ? (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                              item.metro_registration_owner === "PSHK"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-purple-50 text-purple-700 border border-purple-200"
                            }`}
                          >
                            <Building2 className="w-3 h-3 mr-1" />
                            {item.metro_registration_owner}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">N/A (VPN Peer)</span>
                        )}
                      </td>

                      {/* Column 5: Contract Expiry */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-1">
                          <div className="text-xs font-semibold text-slate-800 font-mono">
                            {item.contract_expiry_date || "—"}
                          </div>
                          <div>{getExpiryBadge(item.contract_expiry_date)}</div>
                        </div>
                      </td>

                      {/* Column 6: Actions */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedItem(item);
                              setDetailModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors cursor-pointer"
                            title="Edit Profile"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedItem(item);
                              setDeleteModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                            title="Delete Profile"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Modal: Add / Edit B2B Connection */}
      {formModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <Network className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    {isEditing ? "Edit B2B Connection Profile" : "Add B2B Connection Profile"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Input external B2B partner connectivity & network engineering parameters
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Row 1: Profile Name & Company Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    B2B Connection Profile <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formProfileName}
                    onChange={(e) => setFormProfileName(e.target.value)}
                    placeholder="e.g. B2B-HKEX-OCG-PRI, B2B-HSBC-FIX"
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Unique connection code identifier</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    B2B Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formCompanyName}
                    onChange={(e) => setFormCompanyName(e.target.value)}
                    placeholder="e.g. Hong Kong Exchanges (HKEX), Bloomberg L.P."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Partner company or counterparty name</p>
                </div>
              </div>

              {/* Row 2: Connection Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Connection Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${
                      formConnectionType === "Metro"
                        ? "bg-cyan-50/60 border-cyan-400 ring-1 ring-cyan-400"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <input
                      type="radio"
                      name="connType"
                      value="Metro"
                      checked={formConnectionType === "Metro"}
                      onChange={() => setFormConnectionType("Metro")}
                      className="sr-only"
                    />
                    <Cable className="w-4 h-4 text-cyan-600 mr-2.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-800">Metro Ethernet</div>
                      <div className="text-[10px] text-slate-500">Dedicated Telco Leased Line / Fiber loop</div>
                    </div>
                  </label>

                  <label
                    className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${
                      formConnectionType === "VPN"
                        ? "bg-indigo-50/60 border-indigo-400 ring-1 ring-indigo-400"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <input
                      type="radio"
                      name="connType"
                      value="VPN"
                      checked={formConnectionType === "VPN"}
                      onChange={() => setFormConnectionType("VPN")}
                      className="sr-only"
                    />
                    <Shield className="w-4 h-4 text-indigo-600 mr-2.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-800">IPsec VPN</div>
                      <div className="text-[10px] text-slate-500">Site-to-Site Encrypted Tunnel over Internet</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Dynamic Technical Section based on Connection Type */}
              {formConnectionType === "VPN" ? (
                /* VPN Configuration Box */
                <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-3">
                  <div className="flex items-center space-x-2 text-indigo-900 font-semibold text-xs">
                    <Shield className="w-4 h-4 text-indigo-600" />
                    <span>VPN Configuration</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      VPN Peer IP <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required={formConnectionType === "VPN"}
                      value={formVpnPeerIp}
                      onChange={(e) => setFormVpnPeerIp(e.target.value)}
                      placeholder="e.g. 203.198.77.42"
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Remote peer gateway IP address provided by the B2B partner for IKE / IPsec negotiation.
                    </p>
                  </div>
                </div>
              ) : (
                /* Metro Configuration Box */
                <div className="p-4 bg-cyan-50/40 border border-cyan-100 rounded-xl space-y-3">
                  <div className="flex items-center space-x-2 text-cyan-900 font-semibold text-xs">
                    <Cable className="w-4 h-4 text-cyan-600" />
                    <span>Metro Ethernet Configuration</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Metro Circuit ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required={formConnectionType === "Metro"}
                        value={formMetroCircuitId}
                        onChange={(e) => setFormMetroCircuitId(e.target.value)}
                        placeholder="e.g. HKT-MTR-892110-OCG"
                        className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-800"
                      />
                      <p className="text-[10px] text-slate-500 mt-0.5">Carrier circuit ID from Telco (HKT, PCCW, HKBN)</p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                        <span>Metro VlanID</span>
                        <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1 rounded border border-blue-200">
                          IT Dept use only
                        </span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="4094"
                        value={formMetroVlanId}
                        onChange={(e) => setFormMetroVlanId(e.target.value)}
                        placeholder="e.g. 410"
                        className="w-full px-3 py-2 text-xs font-mono font-bold text-blue-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                      <p className="text-[10px] text-slate-500 mt-0.5">Internal 802.1Q VLAN Tag assigned to this circuit</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Metro Registration Owner <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center space-x-6">
                      <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="metroOwner"
                          value="PSHK"
                          checked={formMetroOwner === "PSHK"}
                          onChange={() => setFormMetroOwner("PSHK")}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-semibold text-blue-700">PSHK (Phillip Securities HK)</span>
                      </label>

                      <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="metroOwner"
                          value="B2B Company"
                          checked={formMetroOwner === "B2B Company"}
                          onChange={() => setFormMetroOwner("B2B Company")}
                          className="text-purple-600 focus:ring-purple-500"
                        />
                        <span className="font-semibold text-purple-700">B2B Company (Partner / Client)</span>
                      </label>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Determines which entity holds the telco contract and pays for the physical circuit.
                    </p>
                  </div>
                </div>
              )}

              {/* Row 4: Contract Expiration Date & Bandwidth */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Contract Expiry Date</span>
                    <span className="text-[10px] text-slate-400 font-normal">Provided by B2B Team</span>
                  </label>
                  <input
                    type="date"
                    value={formExpiryDate}
                    onChange={(e) => setFormExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Commercial agreement expiry date</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bandwidth
                  </label>
                  <input
                    type="text"
                    value={formBandwidth}
                    onChange={(e) => setFormBandwidth(e.target.value)}
                    placeholder="e.g. 100 Mbps, 1 Gbps, 10 Gbps"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800"
                  />
                </div>
              </div>

              {/* Row 5: Service Type & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Service Type
                  </label>
                  <input
                    type="text"
                    value={formServiceType}
                    onChange={(e) => setFormServiceType(e.target.value)}
                    placeholder="e.g. FIX 4.4 Trading, Market Data, DMA Order Routing"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800"
                  >
                    <option value="Active">Active</option>
                    <option value="Expiring Soon">Expiring Soon</option>
                    <option value="Expired">Expired</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Provisioning">Provisioning / In Progress</option>
                  </select>
                </div>
              </div>

              {/* Row 6: Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Partner Contact Person (PIC)
                  </label>
                  <input
                    type="text"
                    value={formContactPerson}
                    onChange={(e) => setFormContactPerson(e.target.value)}
                    placeholder="e.g. Kelvin Chan (Connectivity Desk)"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Partner Contact Email
                  </label>
                  <input
                    type="email"
                    value={formContactEmail}
                    onChange={(e) => setFormContactEmail(e.target.value)}
                    placeholder="e.g. connectivity@partner.com"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800"
                  />
                </div>
              </div>

              {/* Row 7: IT Dept Remarks / Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  IT Dept Remarks / Routing Notes
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Terminated on Core-SW-01-HK Port Te1/0/12. BGP AS 65001. Cross-connect at Mega-i Cage 4."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setFormModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {formSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isEditing ? "Save Changes" : "Create B2B Profile"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal: View Details */}
      {detailModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <Network className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    B2B Connection Profile Details
                  </h3>
                  <span className="font-mono text-xs font-semibold text-blue-600">
                    {selectedItem.profile_name}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-medium text-slate-400">B2B Company Name</span>
                  <p className="text-xs font-bold text-slate-800">{selectedItem.company_name}</p>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-400">Connection Type</span>
                  <div className="mt-0.5">
                    {selectedItem.connection_type === "VPN" ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <Shield className="w-3 h-3 mr-1" />
                        VPN IPsec
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
                        <Cable className="w-3 h-3 mr-1" />
                        Metro Ethernet
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Technical Parameters */}
              <div className="p-4 bg-slate-50 rounded-xl space-y-3 border border-slate-200/70">
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Network Engineering Specifications
                </h4>

                {selectedItem.connection_type === "VPN" ? (
                  <div>
                    <span className="text-[11px] text-slate-400">VPN Peer IP:</span>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2 py-1 rounded border border-slate-200">
                        {selectedItem.vpn_peer_ip || "Not Set"}
                      </span>
                      {selectedItem.vpn_peer_ip && (
                        <button
                          type="button"
                          onClick={() => handleCopy(selectedItem.vpn_peer_ip!, "modal-ip")}
                          className="text-xs text-blue-600 hover:underline flex items-center space-x-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedKey === "modal-ip" ? "Copied!" : "Copy"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[11px] text-slate-400">Metro Circuit ID:</span>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2 py-1 rounded border border-slate-200">
                          {selectedItem.metro_circuit_id || "-"}
                        </span>
                        {selectedItem.metro_circuit_id && (
                          <button
                            type="button"
                            onClick={() => handleCopy(selectedItem.metro_circuit_id!, "modal-ckt")}
                            className="text-xs text-blue-600 hover:underline flex items-center space-x-1 cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                            <span>{copiedKey === "modal-ckt" ? "Copied!" : "Copy"}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                        <span>Metro VlanID:</span>
                        <span className="text-[9px] text-blue-600 font-bold bg-blue-100 px-1 rounded">
                          IT Dept only
                        </span>
                      </span>
                      <p className="font-mono text-xs font-bold text-blue-700 mt-0.5">
                        {selectedItem.metro_vlan_id ? `VLAN ${selectedItem.metro_vlan_id}` : "Unassigned"}
                      </p>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400">Metro Registration Owner:</span>
                      <p className="text-xs font-semibold text-slate-800 mt-0.5">
                        {selectedItem.metro_registration_owner || "-"}
                      </p>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400">Bandwidth:</span>
                      <p className="text-xs font-semibold text-slate-800 mt-0.5">
                        {selectedItem.bandwidth || "1 Gbps"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Commercial & Contact Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[11px] font-medium text-slate-400">
                    Contract Expiry Date (Provided by B2B Team)
                  </span>
                  <div className="mt-1">
                    <p className="font-mono text-xs font-bold text-slate-800">
                      {selectedItem.contract_expiry_date || "Not Set"}
                    </p>
                    <div className="mt-1">{getExpiryBadge(selectedItem.contract_expiry_date)}</div>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-medium text-slate-400">Service Type</span>
                  <p className="text-xs font-semibold text-slate-800 mt-1">
                    {selectedItem.service_type || "FIX Protocol"}
                  </p>
                </div>

                <div>
                  <span className="text-[11px] font-medium text-slate-400">Partner PIC</span>
                  <p className="text-xs font-medium text-slate-800 mt-0.5">
                    {selectedItem.contact_person || "-"}
                  </p>
                </div>

                <div>
                  <span className="text-[11px] font-medium text-slate-400">Partner Email</span>
                  <p className="text-xs font-medium text-slate-800 mt-0.5">
                    {selectedItem.contact_email || "-"}
                  </p>
                </div>
              </div>

              {selectedItem.notes && (
                <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl">
                  <span className="text-[10px] font-bold uppercase text-amber-800">IT Remarks / Notes:</span>
                  <p className="text-xs text-amber-900 mt-0.5 whitespace-pre-wrap">{selectedItem.notes}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Created: {selectedItem.created_at?.split("T")[0] || "—"}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setDetailModalOpen(false);
                    openEditModal(selectedItem);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
                >
                  Edit Profile
                </button>
                <button
                  type="button"
                  onClick={() => setDetailModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal: Delete Confirmation */}
      {deleteModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-5 h-5" />
            </div>

            <h3 className="text-sm font-bold text-slate-800 text-center">
              Delete B2B Connection Profile
            </h3>
            <p className="text-xs text-slate-500 text-center mt-1">
              Are you sure you want to delete profile{" "}
              <strong className="text-slate-800 font-mono">{selectedItem.profile_name}</strong> ({selectedItem.company_name})? This action cannot be undone.
            </p>

            <div className="mt-6 flex items-center justify-center space-x-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setSelectedItem(null);
                }}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                Yes, Delete Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

