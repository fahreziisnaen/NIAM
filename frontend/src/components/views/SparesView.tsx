"use client";

import React, { useState, useEffect } from "react";
import {
  Package,
  Search,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  X,
  Eye,
  Edit2,
  Trash2,
  Layers,
  Building2,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Tag
} from "lucide-react";
import { apiUrl } from "@/lib/api";

export function SparesView() {
  const [spares, setSpares] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Detail Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailPart, setDetailPart] = useState<any | null>(null);
  const [detailTransactions, setDetailTransactions] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Stock Transaction Modal State
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<any>(null);
  const [txType, setTxType] = useState("Check-out");
  const [txQty, setTxQty] = useState(1);
  const [txNotes, setTxNotes] = useState("");

  // Add Spare Part Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newPartNumber, setNewPartNumber] = useState("");
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Optics");
  const [newQuantity, setNewQuantity] = useState(0);
  const [newMinLevel, setNewMinLevel] = useState(0);
  const [newUnitCost, setNewUnitCost] = useState(0);
  const [newLocation, setNewLocation] = useState("");
  const [newCompatibility, setNewCompatibility] = useState("");
  const [newNotes, setNewNotes] = useState("");

  // Edit Spare Part Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editPart, setEditPart] = useState<any | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Delete Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [partToDelete, setPartToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const getAuthToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("phillip_token") || "";
    }
    return "";
  };

  const loadSpares = () => {
    setLoading(true);
    let endpoint = "/api/v1/spares?page=1&page_size=50";
    if (search) endpoint += `&search=${encodeURIComponent(search)}`;
    if (categoryFilter) endpoint += `&category=${encodeURIComponent(categoryFilter)}`;

    fetch(apiUrl(endpoint))
      .then((res) => res.json())
      .then((data) => {
        setSpares(data.items || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadSpares();
  }, [search, categoryFilter]);

  const openDetailModal = async (part: any) => {
    setDetailPart(part);
    setDetailModalOpen(true);
    setDetailLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/v1/spares/${part.id}`));
      if (res.ok) {
        const data = await res.json();
        setDetailPart(data.part);
        setDetailTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error("Failed to load spare details", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPart) return;

    try {
      const token = getAuthToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(apiUrl(`/api/v1/spares/${selectedPart.id}/transact`), {
        method: "POST",
        headers,
        body: JSON.stringify({
          transaction_type: txType,
          quantity: txQty,
          notes: txNotes || `Transacted by NOC duty engineer`,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.detail || "Transaction failed");
        return;
      }

      setTxModalOpen(false);
      if (detailModalOpen && detailPart && detailPart.id === selectedPart.id) {
        openDetailModal(selectedPart);
      }
      loadSpares();
    } catch {
      alert("Error submitting stock transaction");
    }
  };

  const handleAddSpareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartNumber.trim() || !newName.trim()) {
      alert("Please fill in Part Number and Part Name.");
      return;
    }

    try {
      const token = getAuthToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(apiUrl("/api/v1/spares"), {
        method: "POST",
        headers,
        body: JSON.stringify({
          part_number: newPartNumber.trim(),
          name: newName.trim(),
          category: newCategory,
          quantity: Number(newQuantity),
          min_stock_level: Number(newMinLevel),
          unit_cost: Number(newUnitCost),
          currency: "HKD",
          stock_location: newLocation.trim(),
          compatibility: newCompatibility.trim(),
          notes: newNotes.trim() || "Registered via NOC Spares Inventory portal",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.detail || "Failed to add spare part");
        return;
      }

      setAddModalOpen(false);
      setNewPartNumber("");
      setNewName("");
      loadSpares();
    } catch {
      alert("Error creating spare part");
    }
  };

  const handleUpdateSpare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPart) return;
    setEditSubmitting(true);

    try {
      const token = getAuthToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(apiUrl(`/api/v1/spares/${editPart.id}`), {
        method: "PUT",
        headers,
        body: JSON.stringify({
          name: editPart.name,
          category: editPart.category,
          quantity: Number(editPart.quantity),
          min_stock_level: Number(editPart.min_stock_level),
          unit_cost: Number(editPart.unit_cost),
          stock_location: editPart.stock_location,
          notes: editPart.notes,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setEditModalOpen(false);
        if (detailPart && detailPart.id === updated.id) {
          setDetailPart(updated);
        }
        loadSpares();
      }
    } catch (err) {
      console.error("Failed to update spare part", err);
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteSpare = async () => {
    if (!partToDelete) return;
    setDeleting(true);
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(apiUrl(`/api/v1/spares/${partToDelete.id}`), {
        method: "DELETE",
        headers,
      });

      if (res.ok) {
        setDeleteModalOpen(false);
        if (detailModalOpen && detailPart?.id === partToDelete.id) {
          setDetailModalOpen(false);
        }
        setPartToDelete(null);
        loadSpares();
      }
    } catch (err) {
      console.error("Failed to delete spare part", err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Spare Parts & Critical Components Inventory
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Maintain high-availability buffer stock of 10G/40G/100G optics, SFP+ transceivers, redundant power supplies, and hot-swap chassis units.
          </p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1E60D5] hover:bg-blue-700 rounded-lg shadow-sm transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Spare Part</span>
        </button>
      </div>

      {/* Spares Table Container */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search part number, name, location..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="">All Spare Categories</option>
              <option value="SFP Modules">SFP Modules</option>
              <option value="Optics">Optics & Transceivers</option>
              <option value="Power Supplies">Power Supplies</option>
              <option value="Cables">Cables & Patch Cords</option>
              <option value="Spare Switches">Spare Switches</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50">
                <th className="py-2.5 px-3">Part #</th>
                <th className="py-2.5 px-3">Part Name</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Stock Location</th>
                <th className="py-2.5 px-3">Qty on Hand</th>
                <th className="py-2.5 px-3">Min Level</th>
                <th className="py-2.5 px-3">Unit Cost (HKD)</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Loading spare components...
                  </td>
                </tr>
              ) : spares.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No spare parts found.
                  </td>
                </tr>
              ) : (
                spares.map((sp) => (
                  <tr
                    key={sp.id}
                    onClick={() => openDetailModal(sp)}
                    className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-3 font-mono font-bold text-blue-600 group-hover:underline flex items-center gap-1.5">
                      <span>{sp.part_number}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800 group-hover:text-blue-700">{sp.name}</td>
                    <td className="py-3 px-3 text-slate-600">{sp.category}</td>
                    <td className="py-3 px-3 text-slate-600 text-[11px]">{sp.stock_location}</td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 text-sm">{sp.quantity}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">{sp.min_stock_level}</td>
                    <td className="py-3 px-3 font-mono text-slate-800">${sp.unit_cost?.toLocaleString()}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          sp.status === "In Stock"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {sp.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openDetailModal(sp)}
                        className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors inline-block cursor-pointer"
                        title="View Spare Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPart(sp);
                          setTxModalOpen(true);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer inline-block"
                      >
                        Transact
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL: SPARE PART */}
      {detailModalOpen && detailPart && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-sm">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs text-blue-600">{detailPart.part_number}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        detailPart.status === "In Stock"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}
                    >
                      {detailPart.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">
                    {detailPart.name}
                  </h3>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setEditPart({ ...detailPart });
                    setEditModalOpen(true);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-white border border-slate-200 rounded-lg shadow-xs hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => {
                    setPartToDelete(detailPart);
                    setDeleteModalOpen(true);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-white border border-red-200 rounded-lg shadow-xs hover:bg-red-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Summary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Available Stock</span>
                  <span className="font-mono font-bold text-lg text-slate-900 mt-0.5 block">{detailPart.quantity} units</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Min Threshold</span>
                  <span className="font-mono font-bold text-lg text-slate-600 mt-0.5 block">{detailPart.min_stock_level} units</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Unit Price</span>
                  <span className="font-mono font-bold text-lg text-slate-900 mt-0.5 block">HKD {Number(detailPart.unit_cost || 0).toLocaleString()}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Stock Value</span>
                  <span className="font-mono font-bold text-lg text-blue-600 mt-0.5 block">HKD {(Number(detailPart.quantity || 0) * Number(detailPart.unit_cost || 0)).toLocaleString()}</span>
                </div>
              </div>

              {/* Specification & Storage Location */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block border-b border-slate-100 pb-1">
                  Storage & Hardware Compatibility
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Category:</span>
                    <span className="font-semibold text-slate-800 text-xs mt-0.5 block">{detailPart.category}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Primary Stock Locker:</span>
                    <span className="font-semibold text-slate-800 text-xs mt-0.5 block">{detailPart.stock_location}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-[11px]">Compatible Hardware Platforms:</span>
                    <span className="font-mono text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 block mt-1">
                      {detailPart.compatibility || "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Operational Notes */}
              {detailPart.notes && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block mb-1">Stock Notes</span>
                  <p className="text-slate-700">{detailPart.notes}</p>
                </div>
              )}

              {/* Recent Stock Transactions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Recent Stock Movement Ledger
                  </span>
                  <button
                    onClick={() => {
                      setSelectedPart(detailPart);
                      setTxModalOpen(true);
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Perform Stock Transaction</span>
                  </button>
                </div>

                {detailTransactions.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-slate-100">
                    No movement records logged for this part number yet.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Type</th>
                          <th className="py-2 px-3">Qty</th>
                          <th className="py-2 px-3">Technician</th>
                          <th className="py-2 px-3">Notes</th>
                          <th className="py-2 px-3 text-right">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {detailTransactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-50">
                            <td className="py-2 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  tx.transaction_type === "Check-in"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : tx.transaction_type === "Check-out"
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-blue-50 text-blue-700"
                                }`}
                              >
                                {tx.transaction_type}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-mono font-bold text-slate-800">
                              {tx.transaction_type === "Check-out" ? `-${tx.quantity}` : `+${tx.quantity}`}
                            </td>
                            <td className="py-2 px-3 text-slate-700">{tx.technician}</td>
                            <td className="py-2 px-3 text-slate-500 max-w-xs truncate">{tx.notes || "—"}</td>
                            <td className="py-2 px-3 text-slate-400 font-mono text-[11px] text-right">
                              {tx.created_at ? tx.created_at.slice(0, 16).replace("T", " ") : "Just now"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  setSelectedPart(detailPart);
                  setTxModalOpen(true);
                }}
                className="px-4 py-1.5 font-semibold text-white bg-[#1E60D5] hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Stock In / Out
              </button>

              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-1.5 font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT SPARE PART MODAL */}
      {editModalOpen && editPart && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center">
                <Edit2 className="w-4 h-4 mr-2 text-blue-600" />
                Edit Spare Part: {editPart.part_number}
              </h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateSpare} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Part Name</label>
                <input
                  type="text"
                  value={editPart.name}
                  onChange={(e) => setEditPart({ ...editPart, name: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Category</label>
                  <select
                    value={editPart.category}
                    onChange={(e) => setEditPart({ ...editPart, category: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:border-blue-600 focus:outline-none"
                  >
                    <option value="SFP Modules">SFP Modules</option>
                    <option value="Optics">Optics & Transceivers</option>
                    <option value="Power Supplies">Power Supplies</option>
                    <option value="Cables">Cables & Patch Cords</option>
                    <option value="Spare Switches">Spare Switches</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Stock Location</label>
                  <input
                    type="text"
                    value={editPart.stock_location || ""}
                    onChange={(e) => setEditPart({ ...editPart, stock_location: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Quantity</label>
                  <input
                    type="number"
                    value={editPart.quantity}
                    onChange={(e) => setEditPart({ ...editPart, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:border-blue-600 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Min Level</label>
                  <input
                    type="number"
                    value={editPart.min_stock_level}
                    onChange={(e) => setEditPart({ ...editPart, min_stock_level: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:border-blue-600 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Unit Cost (HKD)</label>
                  <input
                    type="number"
                    value={editPart.unit_cost}
                    onChange={(e) => setEditPart({ ...editPart, unit_cost: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:border-blue-600 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Operational Notes</label>
                <textarea
                  rows={2}
                  value={editPart.notes || ""}
                  onChange={(e) => setEditPart({ ...editPart, notes: e.target.value })}
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
                  {editSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModalOpen && partToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm p-6 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Confirm Deletion</h3>
            <p className="text-xs text-slate-500 mt-2">
              Are you sure you want to delete spare part <span className="font-bold text-slate-800">{partToDelete.part_number}</span>?
            </p>
            <div className="flex items-center justify-center space-x-2 mt-5">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-50 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSpare}
                disabled={deleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-xs shadow-sm cursor-pointer"
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Spare Part Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center">
                <Package className="w-4 h-4 mr-2 text-blue-600" />
                Add Critical Spare Component
              </h3>
              <button
                onClick={() => setAddModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSpareSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Part Number *</label>
                  <input
                    type="text"
                    value={newPartNumber}
                    onChange={(e) => setNewPartNumber(e.target.value)}
                    placeholder="e.g. SFP-10G-SR"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:border-blue-600 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Category *</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:border-blue-600 focus:outline-none"
                  >
                    <option value="SFP Modules">SFP Modules</option>
                    <option value="Optics">Optics & Transceivers</option>
                    <option value="Power Supplies">Power Supplies</option>
                    <option value="Cables">Cables & Patch Cords</option>
                    <option value="Spare Switches">Spare Switches</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Part Name / Description *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Cisco 10GBASE-SR SFP+ Transceiver Module"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Initial Quantity</label>
                  <input
                    type="number"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:border-blue-600 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Min Reorder Level</label>
                  <input
                    type="number"
                    value={newMinLevel}
                    onChange={(e) => setNewMinLevel(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:border-blue-600 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Unit Cost (HKD)</label>
                  <input
                    type="number"
                    value={newUnitCost}
                    onChange={(e) => setNewUnitCost(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:border-blue-600 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Physical Storage Location</label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="e.g. HK-DC1 Spares Locker (Rack A0)"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Platform Compatibility</label>
                <input
                  type="text"
                  value={newCompatibility}
                  onChange={(e) => setNewCompatibility(e.target.value)}
                  placeholder="e.g. Cisco Catalyst 9300 / Nexus 9300"
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
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm cursor-pointer"
                >
                  Register Spare
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Transaction Modal */}
      {txModalOpen && selectedPart && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center">
                <Package className="w-4 h-4 mr-2 text-blue-600" />
                Stock In / Out Transaction
              </h3>
              <button
                onClick={() => setTxModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <span className="font-mono font-bold text-blue-600 block">{selectedPart.part_number}</span>
              <span className="text-slate-800 font-semibold">{selectedPart.name}</span>
              <div className="mt-2 flex items-center justify-between text-slate-500 pt-2 border-t border-slate-200/60">
                <span>Current Stock:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{selectedPart.quantity} units</span>
              </div>
            </div>

            <form onSubmit={handleTransaction} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Transaction Type</label>
                <select
                  value={txType}
                  onChange={(e) => setTxType(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:border-blue-600 focus:outline-none"
                >
                  <option value="Check-out">Check-out (Deploy to Field)</option>
                  <option value="Check-in">Check-in (Restock / Return)</option>
                  <option value="Adjustment">Direct Physical Count Adjustment</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={txQty}
                  onChange={(e) => setTxQty(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:border-blue-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Work Order / Reason</label>
                <input
                  type="text"
                  value={txNotes}
                  onChange={(e) => setTxNotes(e.target.value)}
                  placeholder="e.g. Dispatched for MNT-2026-104 replacement"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setTxModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm cursor-pointer"
                >
                  Record Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
