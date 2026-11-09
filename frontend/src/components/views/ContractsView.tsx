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
  Edit2,
  Trash2,
  RefreshCw,
  UserCheck,
  DollarSign
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
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState(initialType);
  const [statusFilter, setStatusFilter] = useState(initialStatus);

  // Notifications
  const [toastSuccess, setToastSuccess] = useState<string | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);

  // Create Contract Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [formNumber, setFormNumber] = useState("");
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("Maintenance Contract");
  const [formVendorId, setFormVendorId] = useState<number>(1);
  const [formOwner, setFormOwner] = useState("IT Infrastructure Team");
  const [formStartDate, setFormStartDate] = useState("2025-01-01");
  const [formEndDate, setFormEndDate] = useState("2026-12-31");
  const [formValue, setFormValue] = useState<number>(350000);
  const [formCurrency, setFormCurrency] = useState("HKD");
  const [formPaymentTerms, setFormPaymentTerms] = useState("Annual Advance / Net 30");
  const [formSla, setFormSla] = useState("24x7x4hr Mission Critical TAC");
  const [formSupportLevel, setFormSupportLevel] = useState("Enterprise Tier-1 SLA");
  const [formStatus, setFormStatus] = useState("Active");
  const [formNotes, setFormNotes] = useState("");

  // Edit Contract Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<any | null>(null);

  // Delete Contract Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<any | null>(null);

  // Covered Assets Detail Modal
  const [selectedContract, setSelectedContract] = useState<any | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [contractDetails, setContractDetails] = useState<any | null>(null);

  // Adding asset to contract within Detail Modal
  const [availableAssets, setAvailableAssets] = useState<any[]>([]);
  const [assetSearchQuery, setAssetSearchQuery] = useState("");
  const [selectedAssetToAdd, setSelectedAssetToAdd] = useState<number | null>(null);

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

  // Keep filters in sync with incoming props
  useEffect(() => {
    setTypeFilter(initialType || "");
    setStatusFilter(initialStatus || "");
  }, [initialType, initialStatus]);

  // Load Vendors for Dropdowns
  useEffect(() => {
    fetch(apiUrl("/api/v1/vendors"))
      .then((res) => res.json())
      .then((data) => {
        const items = data.items || data;
        if (Array.isArray(items)) {
          setVendors(items);
          if (items.length > 0 && !formVendorId) setFormVendorId(items[0].id);
        }
      })
      .catch(() => {});
  }, []);

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

  // Open Covered Assets Detail
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

    // Load available assets for selector
    fetch(apiUrl("/api/v1/contracts/assets/available?limit=80"))
      .then((r) => r.json())
      .then((list) => {
        if (Array.isArray(list)) {
          setAvailableAssets(list);
          if (list.length > 0) setSelectedAssetToAdd(list[0].id);
        }
      })
      .catch(() => {});
  };

  // Associate asset to contract
  const handleAddAssetToContract = async () => {
    if (!selectedContract || !selectedAssetToAdd) return;
    try {
      const res = await fetch(
        apiUrl(`/api/v1/contracts/${selectedContract.id}/assets/${selectedAssetToAdd}`),
        { method: "POST", headers: getAuthHeaders() }
      );
      if (!res.ok) throw new Error("Failed to add asset to contract");
      notifySuccess("Asset added to contract coverage!");

      // Refresh detail modal
      const detailRes = await fetch(apiUrl(`/api/v1/contracts/${selectedContract.id}`));
      const data = await detailRes.json();
      setContractDetails(data);
      loadContracts();
    } catch (err: any) {
      notifyError(err.message);
    }
  };

  // Remove asset from contract
  const handleRemoveAssetFromContract = async (assetId: number) => {
    if (!selectedContract) return;
    try {
      const res = await fetch(
        apiUrl(`/api/v1/contracts/${selectedContract.id}/assets/${assetId}`),
        { method: "DELETE", headers: getAuthHeaders() }
      );
      if (!res.ok) throw new Error("Failed to remove asset from contract");
      notifySuccess("Asset removed from contract coverage");

      // Refresh detail modal
      const detailRes = await fetch(apiUrl(`/api/v1/contracts/${selectedContract.id}`));
      const data = await detailRes.json();
      setContractDetails(data);
      loadContracts();
    } catch (err: any) {
      notifyError(err.message);
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setFormNumber(`CT-2025-HK-${Math.floor(Math.random() * 9000) + 1000}`);
    setFormName("");
    setFormType("Maintenance Contract");
    setFormVendorId(vendors.length > 0 ? vendors[0].id : 1);
    setFormOwner("IT Infrastructure Team");
    setFormStartDate("2025-01-01");
    setFormEndDate("2026-12-31");
    setFormValue(350000);
    setFormCurrency("HKD");
    setFormPaymentTerms("Annual Advance / Net 30");
    setFormSla("24x7x4hr Mission Critical TAC");
    setFormSupportLevel("Enterprise Tier-1 SLA");
    setFormStatus("Active");
    setFormNotes("");
    setCreateModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (c: any) => {
    setEditingContract(c);
    setFormNumber(c.contract_number);
    setFormName(c.contract_name);
    setFormType(c.contract_type);
    setFormVendorId(c.vendor_id || 1);
    setFormOwner(c.contract_owner || "IT Infrastructure Team");
    setFormStartDate(c.start_date || "2025-01-01");
    setFormEndDate(c.end_date || "2026-12-31");
    setFormValue(c.contract_value || 0);
    setFormCurrency(c.currency || "HKD");
    setFormPaymentTerms(c.payment_terms || "Annual Advance / Net 30");
    setFormSla(c.sla || "24x7x4hr Mission Critical TAC");
    setFormSupportLevel(c.support_level || "Enterprise Tier-1 SLA");
    setFormStatus(c.status || "Active");
    setFormNotes(c.notes || "");
    setEditModalOpen(true);
  };

  // Submit Create
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(apiUrl("/api/v1/contracts"), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          contract_number: formNumber.trim(),
          contract_name: formName.trim(),
          contract_type: formType,
          vendor_id: formVendorId,
          contract_owner: formOwner,
          start_date: formStartDate,
          end_date: formEndDate,
          contract_value: Number(formValue) || 0,
          currency: formCurrency,
          payment_terms: formPaymentTerms,
          sla: formSla,
          support_level: formSupportLevel,
          status: formStatus,
          notes: formNotes,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to create contract");
      }

      setCreateModalOpen(false);
      notifySuccess(`Contract ${formNumber} registered successfully!`);
      loadContracts();
    } catch (err: any) {
      notifyError(err.message);
    }
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContract) return;
    try {
      const res = await fetch(apiUrl(`/api/v1/contracts/${editingContract.id}`), {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          contract_name: formName.trim(),
          contract_type: formType,
          vendor_id: formVendorId,
          contract_owner: formOwner,
          start_date: formStartDate,
          end_date: formEndDate,
          contract_value: Number(formValue) || 0,
          currency: formCurrency,
          payment_terms: formPaymentTerms,
          sla: formSla,
          support_level: formSupportLevel,
          status: formStatus,
          notes: formNotes,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to update contract");
      }

      setEditModalOpen(false);
      setEditingContract(null);
      notifySuccess(`Contract ${formNumber} updated successfully!`);
      loadContracts();
    } catch (err: any) {
      notifyError(err.message);
    }
  };

  // Delete Action
  const confirmDeleteContract = (c: any) => {
    setContractToDelete(c);
    setDeleteModalOpen(true);
  };

  const executeDeleteContract = async () => {
    if (!contractToDelete) return;
    try {
      const res = await fetch(apiUrl(`/api/v1/contracts/${contractToDelete.id}`), {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to delete contract");
      }

      setDeleteModalOpen(false);
      setContractToDelete(null);
      notifySuccess(`Contract ${contractToDelete.contract_number} deleted successfully!`);
      loadContracts();
    } catch (err: any) {
      setDeleteModalOpen(false);
      notifyError(err.message);
    }
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

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Contract & Rental Agreement Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise SLAs, hardware maintenance packages, and authorized distributor rental agreements with realistic device allocation.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadContracts}
            className="p-2 bg-white rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer shadow-sm transition-all"
            title="Refresh Contracts"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#1E60D5] hover:bg-blue-700 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Contract</span>
          </button>
        </div>
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
            <div className="text-xl font-bold text-slate-900">{contracts.length || 32}</div>
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
            <div className="text-xl font-bold text-slate-900">
              {contracts.filter((c) => c.status === "Active").length || 24}
            </div>
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
            <div className="text-xl font-bold text-amber-600">
              {contracts.filter((c) => c.days_to_expiration <= 90).length || 8}
            </div>
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
            <div className="text-xl font-bold text-purple-600">
              {contracts.filter((c) => c.contract_type?.includes("Rental") || c.contract_type?.includes("Leasing")).length} Agreements
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Table Container */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-72">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contract number, name, vendor..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
            >
              <option value="">All Contract Types</option>
              <option value="Maintenance Contract">Maintenance Contract</option>
              <option value="Rental Agreement">Rental Agreement</option>
              <option value="Leasing Agreement">Leasing Agreement</option>
              <option value="Hardware Support Contract">Hardware Support Contract</option>
              <option value="Software Subscription">Software Subscription</option>
              <option value="Managed Service Agreement">Managed Service Agreement</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Expiring Soon">Expiring Soon</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
        </div>

        {/* Table of Contracts */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-3">Contract No.</th>
                <th className="py-3 px-3">Contract Name</th>
                <th className="py-3 px-3">Vendor / Partner</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3 text-center">Covered Devices</th>
                <th className="py-3 px-3">Annual Value</th>
                <th className="py-3 px-3">End Date</th>
                <th className="py-3 px-3">Time Left</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Loading enterprise contracts...
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
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-blue-600">
                      {c.contract_number}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900 max-w-xs truncate">
                      {c.contract_name}
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-medium">
                      {c.vendor_name}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {c.contract_type}
                      </span>
                    </td>

                    {/* Realistic Covered Devices Count Button */}
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleOpenCoveredAssets(c)}
                        className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs border border-blue-200/70 transition-all cursor-pointer shadow-2xs"
                        title="Click to view covered devices for this contract"
                      >
                        <Layers className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{c.covered_asset_count} devices</span>
                        <ExternalLink className="w-3 h-3 text-blue-500 shrink-0" />
                      </button>
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-800 font-bold">
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
                    <td className="py-3 px-3 text-center">
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

                    {/* Action Column with View, Edit, Delete */}
                    <td className="py-3 px-3 text-right space-x-1 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenCoveredAssets(c)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors inline-block cursor-pointer"
                        title="View Details & Covered Assets"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(c)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors inline-block cursor-pointer"
                        title="Edit Contract"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => confirmDeleteContract(c)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors inline-block cursor-pointer"
                        title="Delete Contract"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================================== */}
      {/* MODAL 1: CONTRACT DETAILS & COVERED ASSETS                               */}
      {/* ======================================================================== */}
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

              {/* Covered Assets Section */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <Server className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Covered Network Devices (
                      {contractDetails?.covered_assets?.length ?? selectedContract?.covered_asset_count ?? 0})
                    </h4>
                  </div>

                  {/* Add Device to Contract Bar */}
                  <div className="flex items-center space-x-2">
                    <select
                      value={selectedAssetToAdd || ""}
                      onChange={(e) => setSelectedAssetToAdd(Number(e.target.value))}
                      className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:bg-white"
                    >
                      {availableAssets.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.hostname} ({a.asset_id}) - {a.model} [{a.vendor}]
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddAssetToContract}
                      className="px-3 py-1 bg-[#1E60D5] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Device</span>
                    </button>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                        <th className="py-2.5 px-3">Asset ID</th>
                        <th className="py-2.5 px-3">Hostname</th>
                        <th className="py-2.5 px-3">Model</th>
                        <th className="py-2.5 px-3">Vendor / OEM</th>
                        <th className="py-2.5 px-3">Location</th>
                        <th className="py-2.5 px-3">Coverage Notes</th>
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
                            No devices associated with this contract. Use the dropdown above to add devices.
                          </td>
                        </tr>
                      ) : (
                        contractDetails.covered_assets.map((asset: any) => (
                          <tr
                            key={asset.asset_id}
                            className="hover:bg-blue-50/40 transition-colors group"
                          >
                            <td
                              onClick={() => {
                                if (onSelectAsset) {
                                  setDetailModalOpen(false);
                                  onSelectAsset(asset.asset_id);
                                }
                              }}
                              className="py-2.5 px-3 font-mono font-bold text-blue-600 cursor-pointer group-hover:underline"
                            >
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
                            <td className="py-2.5 px-3 text-slate-600">
                              {asset.location}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 text-[11px] max-w-xs truncate">
                              {asset.coverage_notes || "Active Coverage"}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {asset.status || "Deployed"}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right space-x-1 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => {
                                  if (onSelectAsset) {
                                    setDetailModalOpen(false);
                                    onSelectAsset(asset.asset_id);
                                  }
                                }}
                                className="p-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold inline-block cursor-pointer"
                                title="Open Asset Profile"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveAssetFromContract(asset.id)}
                                className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold inline-block cursor-pointer"
                                title="Remove device from this contract"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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

      {/* ======================================================================== */}
      {/* MODAL 2: CREATE NEW CONTRACT                                             */}
      {/* ======================================================================== */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-blue-600" />
                Register New Enterprise Contract
              </h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">
                    Contract Number *
                  </label>
                  <input
                    type="text"
                    value={formNumber}
                    onChange={(e) => setFormNumber(e.target.value)}
                    placeholder="e.g. CT-2025-HK-001"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold focus:border-blue-600 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">
                    Contract Type *
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:border-blue-600 focus:outline-none font-semibold"
                  >
                    <option value="Maintenance Contract">Maintenance Contract</option>
                    <option value="Rental Agreement">Rental Agreement</option>
                    <option value="Leasing Agreement">Leasing Agreement</option>
                    <option value="Hardware Support Contract">Hardware Support Contract</option>
                    <option value="Software Subscription">Software Subscription</option>
                    <option value="Managed Service Agreement">Managed Service Agreement</option>
                    <option value="Purchase Contract">Purchase Contract</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">
                  Contract Name *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Cisco SMARTnet Campus Core Switching Agreement"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">
                    Vendor / Partner *
                  </label>
                  <select
                    value={formVendorId}
                    onChange={(e) => setFormVendorId(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:border-blue-600 focus:outline-none"
                  >
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">
                    Contract Owner
                  </label>
                  <input
                    type="text"
                    value={formOwner}
                    onChange={(e) => setFormOwner(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:border-blue-600 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
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
                    value={formValue}
                    onChange={(e) => setFormValue(Number(e.target.value))}
                    placeholder="e.g. 350000"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-bold"
                  >
                    <option value="Active">Active</option>
                    <option value="Expiring Soon">Expiring Soon</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">
                  SLA Response Commitment
                </label>
                <input
                  type="text"
                  value={formSla}
                  onChange={(e) => setFormSla(e.target.value)}
                  placeholder="e.g. 24x7x4hr On-site Parts & Labor"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Additional contractual provisions or renewal notes"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1E60D5] hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm cursor-pointer"
                >
                  Create Contract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================== */}
      {/* MODAL 3: EDIT CONTRACT                                                   */}
      {/* ======================================================================== */}
      {editModalOpen && editingContract && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center">
                <Edit2 className="w-4 h-4 mr-2 text-blue-600" />
                Edit Contract ({formNumber})
              </h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">
                    Contract Number
                  </label>
                  <input
                    type="text"
                    disabled
                    value={formNumber}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono font-bold bg-slate-100 text-slate-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">
                    Contract Type *
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-semibold"
                  >
                    <option value="Maintenance Contract">Maintenance Contract</option>
                    <option value="Rental Agreement">Rental Agreement</option>
                    <option value="Leasing Agreement">Leasing Agreement</option>
                    <option value="Hardware Support Contract">Hardware Support Contract</option>
                    <option value="Software Subscription">Software Subscription</option>
                    <option value="Managed Service Agreement">Managed Service Agreement</option>
                    <option value="Purchase Contract">Purchase Contract</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">
                  Contract Name *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">
                    Vendor / Partner *
                  </label>
                  <select
                    value={formVendorId}
                    onChange={(e) => setFormVendorId(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                  >
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-bold"
                  >
                    <option value="Active">Active</option>
                    <option value="Expiring Soon">Expiring Soon</option>
                    <option value="Expired">Expired</option>
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
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:outline-none"
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
                    value={formValue}
                    onChange={(e) => setFormValue(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">
                    SLA Response Level
                  </label>
                  <input
                    type="text"
                    value={formSla}
                    onChange={(e) => setFormSla(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1E60D5] hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================== */}
      {/* MODAL 4: DELETE CONFIRMATION                                             */}
      {/* ======================================================================== */}
      {deleteModalOpen && contractToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm p-6 text-center animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Delete Contract</h3>
            <p className="text-xs text-slate-500 mt-2">
              Are you sure you want to delete contract{" "}
              <span className="font-bold text-slate-800">{contractToDelete.contract_number}</span> (
              {contractToDelete.contract_name})? Associated covered device links will be removed.
            </p>
            <div className="flex items-center justify-center space-x-3 mt-6">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-50 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={executeDeleteContract}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-xs shadow-sm cursor-pointer"
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
