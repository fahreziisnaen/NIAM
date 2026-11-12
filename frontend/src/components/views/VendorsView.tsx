"use client";

import React, { useState, useEffect } from "react";
import {
  Handshake,
  Search,
  Phone,
  Mail,
  Globe,
  Shield,
  Plus,
  Building2,
  X,
  AlertCircle,
  Info,
  Layers,
  Tag,
  Edit2,
  Trash2,
  FileText,
  Server,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Headphones,
  MapPin,
  Calendar
} from "lucide-react";
import { apiUrl } from "@/lib/api";

interface Vendor {
  id: number;
  vendor_code: string;
  name: string;
  category?: string;
  manufacturer?: string;
  primary_contact?: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  support_contact?: string;
  support_email?: string;
  support_hotline?: string;
  website?: string;
  status?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  asset_count?: number;
  contract_count?: number;
}

interface VendorAsset {
  id?: number;
  asset_id: string;
  hostname: string;
  model: string;
  category?: string;
  status: string;
  ip_address?: string;
  serial_number?: string;
}

interface VendorContract {
  id?: number;
  contract_number: string;
  contract_name: string;
  contract_type?: string;
  start_date?: string;
  end_date: string;
  status: string;
  contract_value?: number;
  currency?: string;
}

interface VendorsViewProps {
  onSelectAsset?: (assetId: string) => void;
  onSelectContract?: (contractNumber: string) => void;
}

export function VendorsView({ onSelectAsset, onSelectContract }: VendorsViewProps = {}) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // Detail Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
  const [detailVendor, setDetailVendor] = useState<Vendor | null>(null);
  const [vendorAssets, setVendorAssets] = useState<VendorAsset[]>([]);
  const [vendorContracts, setVendorContracts] = useState<VendorContract[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "contracts" | "assets">("overview");

  // Add Vendor Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Principal / OEM (Manufacturer)");
  const [newContact, setNewContact] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newHotline, setNewHotline] = useState("");
  const [newWebsite, setNewWebsite] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newStatus, setNewStatus] = useState("Active");
  const [newNotes, setNewNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Edit Vendor Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Delete Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<Vendor | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadVendors = () => {
    setLoading(true);
    let endpoint = "/api/v1/vendors?page=1&page_size=100";
    if (search) endpoint += `&search=${encodeURIComponent(search)}`;
    fetch(apiUrl(endpoint))
      .then((res) => res.json())
      .then((data) => {
        setVendors(data.items || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadVendors();
  }, [search]);

  // Open Vendor Detail Modal
  const openDetailModal = async (vendorId: number, defaultTab: "overview" | "contracts" | "assets" = "overview") => {
    setSelectedVendorId(vendorId);
    setActiveTab(defaultTab);
    setDetailError(null);
    const cached = vendors.find((v) => Number(v.id) === Number(vendorId));
    if (cached) {
      setDetailVendor(cached);
    }
    setDetailModalOpen(true);
    setDetailLoading(true);

    try {
      const res = await fetch(apiUrl(`/api/v1/vendors/${vendorId}`));
      if (res.ok) {
        const data = await res.json();
        setDetailVendor(data.vendor);
        setVendorAssets(data.assets || []);
        setVendorContracts(data.contracts || []);
      } else {
        const errJson = await res.json().catch(() => ({}));
        setDetailError(errJson.detail || errJson.message || `Server returned error status ${res.status}`);
      }
    } catch (err: any) {
      console.error("Failed to load vendor details", err);
      setDetailError(err?.message || "Failed to reach server");
    } finally {
      setDetailLoading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (vendor: Vendor) => {
    setEditVendor({ ...vendor });
    setEditError(null);
    setEditModalOpen(true);
  };

  // Open Delete Modal
  const openDeleteModal = (vendor: Vendor) => {
    setVendorToDelete(vendor);
    setDeleteError(null);
    setDeleteModalOpen(true);
  };

  // Handle Add Vendor
  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("phillip_token") : null;
      const res = await fetch(apiUrl("/api/v1/vendors"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          vendor_code: newCode.trim(),
          name: newName.trim(),
          category: newCategory,
          manufacturer: newName.trim(),
          primary_contact: newContact.trim(),
          email: newEmail.trim() || undefined,
          phone: newPhone.trim() || undefined,
          support_hotline: newHotline.trim() || undefined,
          website: newWebsite.trim() || undefined,
          address: newAddress.trim() || undefined,
          status: newStatus,
          notes: newNotes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to create vendor");
      }

      setAddModalOpen(false);
      resetAddForm();
      loadVendors();
    } catch (err: any) {
      setFormError(err.message || "Failed to create vendor");
    } finally {
      setSubmitting(false);
    }
  };

  const resetAddForm = () => {
    setNewCode("");
    setNewName("");
    setNewContact("");
    setNewEmail("");
    setNewPhone("");
    setNewHotline("");
    setNewWebsite("");
    setNewAddress("");
    setNewNotes("");
  };

  // Handle Update Vendor
  const handleUpdateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editVendor) return;
    setEditError(null);
    setEditSubmitting(true);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("phillip_token") : null;
      const res = await fetch(apiUrl(`/api/v1/vendors/${editVendor.id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: editVendor.name,
          category: editVendor.category,
          primary_contact: editVendor.primary_contact,
          email: editVendor.email,
          phone: editVendor.phone,
          support_contact: editVendor.support_contact,
          support_email: editVendor.support_email,
          support_hotline: editVendor.support_hotline,
          website: editVendor.website,
          address: editVendor.address,
          status: editVendor.status,
          notes: editVendor.notes,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to update vendor");
      }

      const updated = await res.json();
      setEditModalOpen(false);
      if (detailVendor && detailVendor.id === updated.id) {
        setDetailVendor(updated);
      }
      loadVendors();
    } catch (err: any) {
      setEditError(err.message || "Failed to update vendor");
    } finally {
      setEditSubmitting(false);
    }
  };

  // Handle Delete Vendor
  const handleDeleteVendor = async () => {
    if (!vendorToDelete) return;
    setDeleteError(null);
    setDeleting(true);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("phillip_token") : null;
      const res = await fetch(apiUrl(`/api/v1/vendors/${vendorToDelete.id}`), {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to delete vendor");
      }

      setDeleteModalOpen(false);
      if (detailModalOpen && selectedVendorId === vendorToDelete.id) {
        setDetailModalOpen(false);
      }
      setVendorToDelete(null);
      loadVendors();
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete vendor");
    } finally {
      setDeleting(false);
    }
  };

  const getVendorRoleBadge = (category: string = "", name: string = "") => {
    const c = category.toLowerCase();
    const n = name.toLowerCase();

    if (
      c.includes("rental") ||
      c.includes("distributor") ||
      n.includes("hkt") ||
      n.includes("solutions") ||
      n.includes("sis") ||
      n.includes("automated")
    ) {
      return {
        label: "Distributor / Rental Partner",
        bg: "bg-amber-50 text-amber-700 border-amber-200",
        type: "DISTRIBUTOR",
      };
    }
    if (c.includes("data center") || n.includes("mega-i") || n.includes("equinix")) {
      return {
        label: "Data Center Operator",
        bg: "bg-purple-50 text-purple-700 border-purple-200",
        type: "DATACENTER",
      };
    }
    if (c.includes("carrier") || c.includes("transit") || n.includes("pccw global")) {
      return {
        label: "Carrier & Connectivity",
        bg: "bg-cyan-50 text-cyan-700 border-cyan-200",
        type: "CARRIER",
      };
    }
    return {
      label: "Principal / OEM (Manufacturer)",
      bg: "bg-blue-50 text-blue-700 border-blue-200",
      type: "PRINCIPAL",
    };
  };

  const filteredVendors = vendors.filter((v) => {
    if (selectedCategory === "ALL") return true;
    const badge = getVendorRoleBadge(v.category || "", v.name || "");
    return badge.type === selectedCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Vendor Master Database
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Directory of hardware principals (OEM), authorized leasing distributors, telco carriers, and datacenter partners in Hong Kong.
          </p>
        </div>

        <button
          onClick={() => {
            setNewCode(`VND-0${vendors.length + 1}`);
            setFormError(null);
            setAddModalOpen(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-white bg-[#1E60D5] hover:bg-blue-700 rounded-lg shadow-sm transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Vendor</span>
        </button>
      </div>

      {/* Explanatory Banner: Principal vs Distributor / Rental Provider */}
      <div className="p-4 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-slate-50 border border-blue-200/70 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-blue-600 text-white rounded-xl shadow-sm shrink-0 mt-0.5">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">
              Role Distinction: Principal (OEM) vs Authorized Distributor & Rental Provider
            </h4>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed max-w-4xl">
              Network hardware is manufactured by <b>Principals / OEMs</b> (such as Cisco, Palo Alto, Huawei, Fortinet) who author firmware and hold global licensing. However, in enterprise leasing (<b>Rental / Leased</b>), contracts, monthly invoicing, and local field replacement are handled by <b>Authorized Local Distributors & Systems Integrators</b> (such as HKT Enterprise Solutions, PCCW Solutions, SiS Technologies, Automated Systems HK). This directory tracks both tiers, ensuring asset lifecycles, SLAs, and recurring rental billing stay synchronized.
            </p>
          </div>
        </div>
      </div>

      {/* Controls: Search & Category Chips */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendor name, contact, code..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
        </div>

        {/* Category Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "ALL", label: "All Vendors" },
            { id: "PRINCIPAL", label: "Principal / OEM" },
            { id: "DISTRIBUTOR", label: "Distributor & Rental" },
            { id: "CARRIER", label: "Carriers" },
            { id: "DATACENTER", label: "Data Centers" },
          ].map((chip) => (
            <button
              key={chip.id}
              onClick={() => setSelectedCategory(chip.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === chip.id
                  ? "bg-[#0A192F] text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Vendor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 py-16 text-center text-slate-400 text-xs">
            Loading vendors directory...
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="col-span-3 py-16 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
            No vendors found matching this category filter.
          </div>
        ) : (
          filteredVendors.map((v) => {
            const roleBadge = getVendorRoleBadge(v.category || "", v.name || "");
            return (
              <div
                key={v.id}
                className="group bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      {v.vendor_code}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          v.status === "Active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {v.status || "Active"}
                      </span>

                      {/* Card Action Icons */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(v);
                        }}
                        title="Edit Vendor"
                        className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteModal(v);
                        }}
                        title="Delete Vendor"
                        className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Vendor Name - Clickable */}
                  <div
                    onClick={() => openDetailModal(v.id, "overview")}
                    className="cursor-pointer group-hover:text-blue-600 transition-colors"
                  >
                    <h3 className="text-sm font-bold text-slate-900 mt-2 flex items-center justify-between">
                      <span>{v.name}</span>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                    </h3>
                  </div>

                  {/* Role Pill */}
                  <div className="mt-1.5 flex items-center space-x-1.5">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${roleBadge.bg}`}>
                      {roleBadge.label}
                    </span>
                  </div>

                  {/* Contact Info (Clickable to view detail) */}
                  <div
                    onClick={() => openDetailModal(v.id, "overview")}
                    className="mt-4 space-y-2 text-xs text-slate-600 cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{v.address || "—"}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{v.phone || v.support_hotline || "—"}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{v.email || v.support_email || "—"}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Clickable Metrics */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => openDetailModal(v.id, "assets")}
                      className="text-left px-2 py-1 -ml-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Click to view covered assets"
                    >
                      <span className="text-[10px] text-slate-400 block font-medium">Assets</span>
                      <span className="font-bold text-slate-800 hover:text-blue-600 flex items-center gap-1">
                        <Server className="w-3 h-3 text-slate-400" />
                        {v.asset_count || 0}
                      </span>
                    </button>
                    <button
                      onClick={() => openDetailModal(v.id, "contracts")}
                      className="text-left px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Click to view contracts"
                    >
                      <span className="text-[10px] text-slate-400 block font-medium">Contracts</span>
                      <span className="font-bold text-blue-600 flex items-center gap-1">
                        <FileText className="w-3 h-3 text-blue-500" />
                        {v.contract_count || 0}
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center space-x-1">
                    {v.website && (
                      <a
                        href={v.website.startsWith("http") ? v.website : `https://${v.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-slate-50 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title={`Visit ${v.website}`}
                      >
                        <Globe className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => openDetailModal(v.id, "overview")}
                      className="px-2 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* VENDOR DETAIL MODAL */}
      {detailModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-sm">
                  <Handshake className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                      {detailVendor?.vendor_code || "VND"}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        detailVendor?.status === "Active"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {detailVendor?.status || "Active"}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">
                    {detailVendor?.name || "Vendor Details"}
                  </h3>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {detailVendor && (
                  <>
                    <button
                      onClick={() => openEditModal(detailVendor)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => openDeleteModal(detailVendor)}
                      className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-white border border-red-200 rounded-lg hover:bg-red-50 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </>
                )}
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="px-6 border-b border-slate-200 flex items-center space-x-6 bg-white">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === "overview"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Info className="w-4 h-4" />
                <span>Overview & Contacts</span>
              </button>
              <button
                onClick={() => setActiveTab("contracts")}
                className={`py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === "contracts"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Contracts ({vendorContracts.length > 0 ? vendorContracts.length : (detailVendor?.contract_count || 0)})</span>
              </button>
              <button
                onClick={() => setActiveTab("assets")}
                className={`py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === "assets"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Server className="w-4 h-4" />
                <span>Covered Assets ({vendorAssets.length > 0 ? vendorAssets.length : (detailVendor?.asset_count || 0)})</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30">
              {detailLoading && !detailVendor ? (
                <div className="py-20 text-center text-xs text-slate-400">
                  <div className="inline-block animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full mb-2"></div>
                  <p>Loading vendor information...</p>
                </div>
              ) : !detailVendor ? (
                <div className="py-20 text-center text-xs text-slate-500">
                  <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">Vendor details could not be loaded.</p>
                  {detailError && <p className="mt-1 text-red-500 font-mono text-[11px]">{detailError}</p>}
                </div>
              ) : (
                <>
                  {detailError && (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>{detailError}</span>
                      </div>
                    </div>
                  )}

                  {activeTab === "overview" ? (
                    <div className="space-y-6">
                  {/* Category & Role Info */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                      Organization & Classification
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block font-medium">Category / Role</span>
                        <span className="font-semibold text-slate-800 mt-0.5 block">
                          {detailVendor.category || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Manufacturer / OEM</span>
                        <span className="font-semibold text-slate-800 mt-0.5 block">
                          {detailVendor.manufacturer || detailVendor.name}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Jurisdiction / Country</span>
                        <span className="font-semibold text-slate-800 mt-0.5 block">
                          {detailVendor.country || "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Primary & Support Contacts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Primary Contact */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                        <Phone className="w-3.5 h-3.5 text-blue-600" />
                        <span>Account Representative</span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-slate-400 block">Contact Person</span>
                          <span className="font-medium text-slate-800">{detailVendor.primary_contact || "-"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Phone</span>
                          <span className="font-mono text-slate-800">{detailVendor.phone || "-"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Email</span>
                          {detailVendor.email ? (
                            <a
                              href={`mailto:${detailVendor.email}`}
                              className="text-blue-600 hover:underline font-medium"
                            >
                              {detailVendor.email}
                            </a>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Support & NOC Hotline */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                        <Headphones className="w-3.5 h-3.5 text-emerald-600" />
                        <span>NOC & Technical Support</span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-slate-400 block">Support Desk / Lead</span>
                          <span className="font-medium text-slate-800">{detailVendor.support_contact || "—"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Hotline</span>
                          <span className="font-mono font-bold text-slate-800">{detailVendor.support_hotline || detailVendor.phone || "-"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Support Email</span>
                          {detailVendor.support_email ? (
                            <a
                              href={`mailto:${detailVendor.support_email}`}
                              className="text-blue-600 hover:underline font-medium"
                            >
                              {detailVendor.support_email}
                            </a>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Location & Web */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-600" />
                      <span>Office Location & Portal</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block">Physical Address</span>
                        <p className="text-slate-700 mt-1 leading-relaxed">
                          {detailVendor.address || "—"}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Official Website</span>
                        {detailVendor.website ? (
                          <a
                            href={detailVendor.website.startsWith("http") ? detailVendor.website : `https://${detailVendor.website}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1.5 mt-1 font-medium"
                          >
                            <Globe className="w-3.5 h-3.5" />
                            <span>{detailVendor.website}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-400 block mt-1">-</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Operational Notes */}
                  {detailVendor.notes && (
                    <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4 text-xs">
                      <span className="font-bold text-amber-900 block mb-1">Internal SLA & Maintenance Notes</span>
                      <p className="text-amber-800 leading-relaxed whitespace-pre-line">{detailVendor.notes}</p>
                    </div>
                  )}
                </div>
              ) : activeTab === "contracts" ? (
                <div className="space-y-4">
                  {vendorContracts.length === 0 ? (
                    <div className="py-16 text-center text-slate-400 text-xs bg-white rounded-xl border border-slate-200">
                      No maintenance contracts or leases registered under this vendor.
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                          <tr>
                            <th className="py-2.5 px-4">Contract #</th>
                            <th className="py-2.5 px-4">Contract Name</th>
                            <th className="py-2.5 px-4">Type</th>
                            <th className="py-2.5 px-4">Value</th>
                            <th className="py-2.5 px-4">Period</th>
                            <th className="py-2.5 px-4 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {vendorContracts.map((c, idx) => (
                            <tr
                              key={c.id || idx}
                              onClick={() => onSelectContract && onSelectContract(c.contract_number)}
                              className="hover:bg-blue-50/60 transition-colors cursor-pointer group"
                            >
                              <td className="py-2.5 px-4 font-mono font-bold text-blue-600 flex items-center gap-1.5">
                                <span className="group-hover:underline">{c.contract_number}</span>
                                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </td>
                              <td className="py-2.5 px-4 font-semibold text-slate-800 group-hover:text-blue-700">
                                {c.contract_name}
                              </td>
                              <td className="py-2.5 px-4 text-slate-600">
                                {c.contract_type || "Maintenance"}
                              </td>
                              <td className="py-2.5 px-4 font-mono text-slate-700">
                                {c.currency} {Number(c.contract_value || 0).toLocaleString()}
                              </td>
                              <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                                {c.start_date || "-"} → {c.end_date}
                              </td>
                              <td className="py-2.5 px-4 text-right">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                    c.status === "ACTIVE"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : c.status === "EXPIRING"
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-slate-100 text-slate-600 border-slate-200"
                                  }`}
                                >
                                  {c.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {vendorAssets.length === 0 ? (
                    <div className="py-16 text-center text-slate-400 text-xs bg-white rounded-xl border border-slate-200">
                      No hardware assets currently linked to this vendor.
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                          <tr>
                            <th className="py-2.5 px-4">Asset Tag</th>
                            <th className="py-2.5 px-4">Hostname</th>
                            <th className="py-2.5 px-4">Category</th>
                            <th className="py-2.5 px-4">Model</th>
                            <th className="py-2.5 px-4">Primary IP</th>
                            <th className="py-2.5 px-4">Serial Number</th>
                            <th className="py-2.5 px-4 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {vendorAssets.map((a, idx) => (
                            <tr
                              key={a.id || idx}
                              onClick={() => onSelectAsset && onSelectAsset(a.asset_id)}
                              className="hover:bg-blue-50/60 transition-colors cursor-pointer group"
                            >
                              <td className="py-2.5 px-4 font-mono font-bold text-blue-600 flex items-center gap-1.5">
                                <span className="group-hover:underline">{a.asset_id}</span>
                                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </td>
                              <td className="py-2.5 px-4 font-semibold text-slate-800 group-hover:text-blue-700">
                                {a.hostname}
                              </td>
                              <td className="py-2.5 px-4 text-slate-600">
                                {a.category || "Network"}
                              </td>
                              <td className="py-2.5 px-4 font-mono text-slate-600 text-[11px]">
                                {a.model || "-"}
                              </td>
                              <td className="py-2.5 px-4 font-mono text-slate-600 text-[11px]">
                                {a.ip_address || "-"}
                              </td>
                              <td className="py-2.5 px-4 font-mono text-slate-500 text-[11px]">
                                {a.serial_number || "-"}
                              </td>
                              <td className="py-2.5 px-4 text-right">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                    a.status === "ONLINE" || a.status === "ACTIVE"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : a.status === "MAINTENANCE"
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-slate-100 text-slate-600 border-slate-200"
                                  }`}
                                >
                                  {a.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between text-xs">
              <div className="text-slate-400">
                Vendor ID: <span className="font-mono text-slate-700">{detailVendor?.id}</span>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT VENDOR MODAL */}
      {editModalOpen && editVendor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center">
                <Edit2 className="w-4 h-4 mr-2 text-blue-600" />
                Edit Vendor: {editVendor.name}
              </h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateVendor} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Vendor Code</label>
                  <input
                    type="text"
                    value={editVendor.vendor_code}
                    disabled
                    className="w-full px-3 py-1.5 border border-slate-200 bg-slate-50 text-slate-500 rounded-lg font-mono cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Status *</label>
                  <select
                    value={editVendor.status || "Active"}
                    onChange={(e) => setEditVendor({ ...editVendor, status: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:border-blue-600 focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Under Review">Under Review</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Company / Vendor Name *</label>
                <input
                  type="text"
                  value={editVendor.name}
                  onChange={(e) => setEditVendor({ ...editVendor, name: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Category / Role *</label>
                <select
                  value={editVendor.category || "Principal / OEM (Manufacturer)"}
                  onChange={(e) => setEditVendor({ ...editVendor, category: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:border-blue-600 focus:outline-none"
                >
                  <option value="Principal / OEM (Manufacturer)">Principal / OEM (Manufacturer)</option>
                  <option value="Distributor & Rental Partner">Distributor & Rental Partner</option>
                  <option value="System Integrator (SI)">System Integrator (SI)</option>
                  <option value="Telecom & Connectivity">Telecom & Connectivity</option>
                  <option value="Data Center Operator">Data Center Operator</option>
                  <option value="Network Hardware">Network Hardware</option>
                  <option value="Security">Security</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Primary Contact</label>
                  <input
                    type="text"
                    value={editVendor.primary_contact || ""}
                    onChange={(e) => setEditVendor({ ...editVendor, primary_contact: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Primary Phone</label>
                  <input
                    type="text"
                    value={editVendor.phone || ""}
                    onChange={(e) => setEditVendor({ ...editVendor, phone: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Support Hotline / NOC</label>
                  <input
                    type="text"
                    value={editVendor.support_hotline || ""}
                    onChange={(e) => setEditVendor({ ...editVendor, support_hotline: e.target.value })}
                    placeholder="e.g. +1 555-0100"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Support Email</label>
                  <input
                    type="email"
                    value={editVendor.support_email || editVendor.email || ""}
                    onChange={(e) => setEditVendor({ ...editVendor, support_email: e.target.value, email: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Website</label>
                <input
                  type="text"
                  value={editVendor.website || ""}
                  onChange={(e) => setEditVendor({ ...editVendor, website: e.target.value })}
                  placeholder="https://www.vendor.com"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Physical Address</label>
                <input
                  type="text"
                  value={editVendor.address || ""}
                  onChange={(e) => setEditVendor({ ...editVendor, address: e.target.value })}
                  placeholder="e.g. Quarry Bay, Hong Kong"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Internal Notes / SLAs</label>
                <textarea
                  rows={2}
                  value={editVendor.notes || ""}
                  onChange={(e) => setEditVendor({ ...editVendor, notes: e.target.value })}
                  placeholder="e.g. Standard 4-hour hardware replacement SLA under SI contract..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {editSubmitting ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModalOpen && vendorToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start space-x-3">
              <div className="p-2.5 bg-red-100 text-red-600 rounded-xl shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Delete Vendor: {vendorToDelete.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to delete this vendor record? This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Check associations */}
            {((vendorToDelete.asset_count || 0) > 0 || (vendorToDelete.contract_count || 0) > 0) && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                <span className="font-bold block">Active Associations Detected:</span>
                <p>
                  This vendor is currently linked to <b>{vendorToDelete.asset_count || 0} hardware assets</b> and{" "}
                  <b>{vendorToDelete.contract_count || 0} contracts</b>. You must reassign or remove these associations before deleting this vendor.
                </p>
              </div>
            )}

            {deleteError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteVendor}
                disabled={deleting || (vendorToDelete.asset_count || 0) > 0 || (vendorToDelete.contract_count || 0) > 0}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD VENDOR MODAL */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center">
                <Handshake className="w-4 h-4 mr-2 text-blue-600" />
                Register New Enterprise Vendor
              </h3>
              <button
                onClick={() => setAddModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateVendor} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Vendor Code *</label>
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="e.g. VND-015"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:border-blue-600 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Role / Category *</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:border-blue-600 focus:outline-none"
                  >
                    <option value="Principal / OEM (Manufacturer)">Principal / OEM (Manufacturer)</option>
                    <option value="Distributor & Rental Partner">Distributor & Rental Partner</option>
                    <option value="System Integrator (SI)">System Integrator (SI)</option>
                    <option value="Telecom & Connectivity">Telecom & Connectivity</option>
                    <option value="Data Center Operator">Data Center Operator</option>
                    <option value="Network Hardware">Network Hardware</option>
                    <option value="Security">Security</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Vendor / Company Name *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. SiS Technologies HK / Cisco Systems"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Primary Contact *</label>
                  <input
                    type="text"
                    value={newContact}
                    onChange={(e) => setNewContact(e.target.value)}
                    placeholder="e.g. Marcus Kwok"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Phone</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="e.g. +1 555-0100"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Support Hotline</label>
                  <input
                    type="text"
                    value={newHotline}
                    onChange={(e) => setNewHotline(e.target.value)}
                    placeholder="e.g. +1 555-0199"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Support Email</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="e.g. support-hk@vendor.com"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Official Website</label>
                <input
                  type="text"
                  value={newWebsite}
                  onChange={(e) => setNewWebsite(e.target.value)}
                  placeholder="https://www.vendor.com"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Physical Address</label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="e.g. Quarry Bay / Central, Hong Kong"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {submitting ? "Saving..." : "Register Vendor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
