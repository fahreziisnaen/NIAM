"use client";

import React, { useState, useEffect } from "react";
import { apiUrl } from "@/lib/api";
import {
  FileText,
  Search,
  Filter,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Download,
  Calendar,
  X,
  Check,
  Eye,
  ExternalLink,
  Server,
  Building2,
  Shield,
  Layers,
} from "lucide-react";

interface ContractsViewProps {
  initialType?: string;
  initialStatus?: string;
  onSelectAsset?: (assetId: string) => void;
}

export function ContractsView({
  initialType = "",
  initialStatus = "",
  onSelectAsset,
}: ContractsViewProps) {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState(initialType);
  const [statusFilter, setStatusFilter] = useState(initialStatus);

  // New Contract Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [newNum, setNewNum] = useState("");
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("Maintenance Contract");
  const [newVendorId, setNewVendorId] = useState(1);
  const [newStartDate, setNewStartDate] = useState("2025-01-01");
  const [newEndDate, setNewEndDate] = useState("2026-12-31");
  const [newValue, setNewValue] = useState(350000);
  const [newSla, setNewSla] = useState("24x7x4hr Mission Critical TAC");

  // Covered Assets & Contract Detail Modal State
  const [selectedContract, setSelectedContract] = useState<any | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [contractDetails, setContractDetails] = useState<any | null>(null);

  // Keep filters in sync with incoming props
  useEffect(() => {
    setTypeFilter(initialType || "");
    setStatusFilter(initialStatus || "");
  }, [initialType, initialStatus]);

  const loadContracts = () => {
    setLoading(true);
    let endpoint = "/api/v1/contracts?page=1&page_size=50";
    if (search) endpoint += `&search=${encodeURIComponent(search)}`;
    if (typeFilter) endpoint += `&contract_type=${encodeURIComponent(typeFilter)}`;
    if (statusFilter) endpoint += `&status=${encodeURIComponent(statusFilter)}`;

    fetch(apiUrl(endpoint))
      .then((res) => res.json())
      .then((data) => {
        setContracts(data.items || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadContracts();
  }, [search, typeFilter, statusFilter]);

  const handleOpenCoveredAssets = async (contract: any) => {
    setSelectedContract(contract);
    setDetailModalOpen(true);
    setDetailLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/v1/contracts/${contract.id}`));
      if (res.ok) {
        const data = await res.json();
        setContractDetails(data);
      } else {
        setContractDetails(contract);
      }
    } catch {
      setContractDetails(contract);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(apiUrl("/api/v1/contracts"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contract_number: newNum || `CT-2025-NEW-${Math.floor(Math.random() * 900) + 100}`,
          contract_name: newName,
          contract_type: newType,
          vendor_id: newVendorId,
          start_date: newStartDate,
          end_date: newEndDate,
          contract_value: Number(newValue) || 0,
          currency: "HKD",
          sla: newSla,
          status: "Active",
          asset_ids: [1, 2, 3],
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.detail || "Failed to create contract");
        return;
      }

      setModalOpen(false);
      setNewNum("");
      setNewName("");
      loadContracts();
    } catch {
      alert("Error submitting contract");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Contract & Rental Agreement Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage enterprise SLAs, hardware maintenance packages, and authorized distributor rental agreements across Hong Kong sites.
          </p>
        </div>

        <button
          onClick={() => {
            setNewNum(`CT-2025-HK-${Math.floor(Math.random() * 9000) + 1000}`);
            setModalOpen(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-white bg-[#1E60D5] hover:bg-blue-700 rounded-lg shadow-sm transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Contract</span>
        </button>
      </div>

      {/* KPI Cards for Contracts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => {
            setTypeFilter("");
            setStatusFilter("");
          }}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3 cursor-pointer hover:border-blue-300 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Total Contracts</span>
            <div className="text-xl font-bold text-slate-900">32</div>
          </div>
        </div>

        <div
          onClick={() => {
            setTypeFilter("");
            setStatusFilter("Active");
          }}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3 cursor-pointer hover:border-emerald-300 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Active SLAs</span>
            <div className="text-xl font-bold text-slate-900">24</div>
          </div>
        </div>

        <div
          onClick={() => {
            setTypeFilter("");
            setStatusFilter("Expiring Soon");
          }}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3 cursor-pointer hover:border-amber-300 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Expiring (≤ 90d)</span>
            <div className="text-xl font-bold text-amber-600">8</div>
          </div>
        </div>

        <div
          onClick={() => {
            setTypeFilter("Rental Agreement");
            setStatusFilter("");
          }}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3 cursor-pointer hover:border-purple-300 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Rental Agreements</span>
            <div className="text-xl font-bold text-purple-600">372 units</div>
          </div>
        </div>
      </div>

      {/* Filter and Table Container */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contract number, vendor..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="">All Contract Types</option>
              <option value="Rental Agreement">Rental Agreement</option>
              <option value="Maintenance Contract">Maintenance Contract</option>
              <option value="Hardware Support Contract">Hardware Support Contract</option>
              <option value="Software Subscription">Software Subscription</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Expiring Soon">Expiring Soon (≤ 90d)</option>
              <option value="Expired">Expired</option>
            </select>

            {(typeFilter || statusFilter || search) && (
              <button
                onClick={() => {
                  setTypeFilter("");
                  setStatusFilter("");
                  setSearch("");
                }}
                className="text-xs text-blue-600 font-semibold px-2 py-1 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Contracts Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                <th className="py-2.5 px-3">Contract #</th>
                <th className="py-2.5 px-3">Contract Name</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Vendor / Partner</th>
                <th className="py-2.5 px-3">Covered Assets</th>
                <th className="py-2.5 px-3">Value (HKD)</th>
                <th className="py-2.5 px-3">End Date</th>
                <th className="py-2.5 px-3">Days Left</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Loading contracts...
                  </td>
                </tr>
              ) : contracts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No contracts found matching your filters.
                  </td>
                </tr>
              ) : (
                contracts.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      {c.contract_number}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800 max-w-xs truncate">
                      {c.contract_name}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {c.contract_type}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800">
                      {c.vendor_name}
                    </td>

                    {/* Interactive Clickable Covered Assets Button */}
                    <td className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => handleOpenCoveredAssets(c)}
                        className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs border border-blue-200/70 transition-all cursor-pointer shadow-2xs"
                        title="Click to view all covered network devices for this contract"
                      >
                        <Layers className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{c.covered_asset_count} devices</span>
                        <ExternalLink className="w-3 h-3 text-blue-500 shrink-0" />
                      </button>
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-800">
                      ${c.contract_value?.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {c.end_date}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`font-semibold ${
                          c.days_to_expiration <= 90
                            ? "text-red-600"
                            : "text-slate-600"
                        }`}
                      >
                        {c.days_to_expiration} days
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.status === "Active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>

                    {/* Action Column */}
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenCoveredAssets(c)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        title="View Contract Details & Covered Assets"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contract Details & Covered Assets Modal */}
      {detailModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      {selectedContract?.contract_name}
                    </h3>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
                      {selectedContract?.contract_number}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {selectedContract?.contract_type} • Vendor:{" "}
                    <span className="font-semibold text-slate-800">
                      {selectedContract?.vendor_name}
                    </span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Summary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    SLA Response Level
                  </span>
                  <span className="text-xs font-bold text-slate-900 mt-0.5 block truncate">
                    {selectedContract?.sla || "24x7x4hr Mission Critical"}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Contract Value
                  </span>
                  <span className="text-xs font-bold text-slate-900 mt-0.5 block">
                    HKD {selectedContract?.contract_value?.toLocaleString()}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Expiration Date
                  </span>
                  <span className="text-xs font-bold text-slate-900 mt-0.5 block font-mono">
                    {selectedContract?.end_date}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Status / Days Remaining
                  </span>
                  <span
                    className={`text-xs font-bold mt-0.5 block ${
                      selectedContract?.days_to_expiration <= 90
                        ? "text-red-600"
                        : "text-emerald-700"
                    }`}
                  >
                    {selectedContract?.days_to_expiration} days left (
                    {selectedContract?.status})
                  </span>
                </div>
              </div>

              {/* Covered Assets Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Server className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Covered Network Devices (
                      {contractDetails?.covered_assets?.length ?? selectedContract?.covered_asset_count ?? 0})
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Click any device to open its comprehensive 7-Tab Profile
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                        <th className="py-2.5 px-3">Asset ID</th>
                        <th className="py-2.5 px-3">Hostname</th>
                        <th className="py-2.5 px-3">Model</th>
                        <th className="py-2.5 px-3">Vendor / OEM</th>
                        <th className="py-2.5 px-3">Serial Number</th>
                        <th className="py-2.5 px-3">Location</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {detailLoading ? (
                        <tr>
                          <td colSpan={8} className="py-6 text-center text-slate-400">
                            Loading covered devices...
                          </td>
                        </tr>
                      ) : !contractDetails?.covered_assets || contractDetails.covered_assets.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-6 text-center text-slate-400">
                            No devices associated with this contract.
                          </td>
                        </tr>
                      ) : (
                        contractDetails.covered_assets.map((asset: any) => (
                          <tr
                            key={asset.asset_id}
                            onClick={() => {
                              if (onSelectAsset) {
                                setDetailModalOpen(false);
                                onSelectAsset(asset.asset_id);
                              }
                            }}
                            className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                          >
                            <td className="py-2.5 px-3 font-mono font-bold text-blue-600 group-hover:underline">
                              {asset.asset_id}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800">
                              {asset.hostname}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700">
                              {asset.model}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">
                              {asset.vendor}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-600">
                              {asset.serial_number}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">
                              {asset.location}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {asset.status || "Deployed"}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onSelectAsset) {
                                    setDetailModalOpen(false);
                                    onSelectAsset(asset.asset_id);
                                  }
                                }}
                                className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] inline-flex items-center space-x-1 cursor-pointer transition-colors"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Profile</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Contract Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-blue-600" />
                Register New Enterprise Contract
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateContract} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">
                  Contract Number *
                </label>
                <input
                  type="text"
                  value={newNum}
                  onChange={(e) => setNewNum(e.target.value)}
                  placeholder="e.g. CTR-CISCO-2026-01"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:border-blue-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">
                  Contract Name *
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Cisco SmartNet 24x7 Core Switching Support"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">
                    Contract Type *
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:border-blue-600 focus:outline-none"
                  >
                    <option value="Maintenance Contract">Maintenance Contract</option>
                    <option value="Rental Agreement">Rental Agreement</option>
                    <option value="Hardware Support Contract">
                      Hardware Support Contract
                    </option>
                    <option value="Software Subscription">
                      Software Subscription
                    </option>
                    <option value="Managed Service Agreement">
                      Managed Service Agreement
                    </option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">
                    Vendor / Partner *
                  </label>
                  <select
                    value={newVendorId}
                    onChange={(e) => setNewVendorId(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:border-blue-600 focus:outline-none"
                  >
                    <option value={1}>Palo Alto Networks</option>
                    <option value={2}>Cisco Systems HK</option>
                    <option value={3}>Huawei Technologies HK</option>
                    <option value={4}>Fortinet HK</option>
                    <option value={7}>HKT Enterprise Solutions (Rental)</option>
                    <option value={8}>PCCW Global (Transit)</option>
                    <option value={9}>SUNeVision Mega-i</option>
                    <option value={10}>Equinix HK</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:border-blue-600 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">
                    Contract Value (HKD)
                  </label>
                  <input
                    type="number"
                    value={newValue}
                    onChange={(e) => setNewValue(Number(e.target.value))}
                    placeholder="e.g. 350000"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">
                    SLA Support Level
                  </label>
                  <input
                    type="text"
                    value={newSla}
                    onChange={(e) => setNewSla(e.target.value)}
                    placeholder="e.g. 24x7x4hr On-site"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm cursor-pointer"
                >
                  Create Contract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
