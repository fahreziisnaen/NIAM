"use client";

import React, { useState, useEffect } from "react";
import { Package, Search, Plus, ArrowDownLeft, ArrowUpRight, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { apiUrl } from "@/lib/api";

export function SparesView() {
  const [spares, setSpares] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Stock Transaction Modal
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<any>(null);
  const [txType, setTxType] = useState("Check-out");
  const [txQty, setTxQty] = useState(1);
  const [txNotes, setTxNotes] = useState("");

  // Add Spare Part Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newPartNumber, setNewPartNumber] = useState("");
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Optics");
  const [newQuantity, setNewQuantity] = useState(10);
  const [newMinLevel, setNewMinLevel] = useState(4);
  const [newUnitCost, setNewUnitCost] = useState(1200);
  const [newLocation, setNewLocation] = useState("HK-DC1 Spares Locker (Rack A0)");
  const [newCompatibility, setNewCompatibility] = useState("Cisco Catalyst 9300 / Nexus 9300");

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
          notes: "Registered via NOC Spares Inventory portal",
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
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
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
                  <tr key={sp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{sp.part_number}</td>
                    <td className="py-3 px-3 font-medium text-slate-800">{sp.name}</td>
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
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedPart(sp);
                          setTxModalOpen(true);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
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

      {/* Add Spare Part Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center">
                <Package className="w-4 h-4 mr-2 text-blue-600" />
                Add New Spare Part / Inventory Item
              </h3>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSpareSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 block mb-1 font-semibold">Part Number *</label>
                  <input
                    type="text"
                    value={newPartNumber}
                    onChange={(e) => setNewPartNumber(e.target.value)}
                    placeholder="e.g. SFP-10G-SR-V2"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-600 block mb-1 font-semibold">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Optics">Optics & Transceivers</option>
                    <option value="SFP Modules">SFP Modules</option>
                    <option value="Power Supplies">Power Supplies</option>
                    <option value="Cables">Cables & Patch Cords</option>
                    <option value="Spare Switches">Spare Switches</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-600 block mb-1 font-semibold">Part Name / Description *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Cisco 10GBASE-SR SFP+ Transceiver Module"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-600 block mb-1 font-semibold">Initial Quantity</label>
                  <input
                    type="number"
                    min={0}
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-600 block mb-1 font-semibold">Min Stock Level</label>
                  <input
                    type="number"
                    min={1}
                    value={newMinLevel}
                    onChange={(e) => setNewMinLevel(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-600 block mb-1 font-semibold">Unit Cost (HKD)</label>
                  <input
                    type="number"
                    min={0}
                    value={newUnitCost}
                    onChange={(e) => setNewUnitCost(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-600 block mb-1 font-semibold">Stock Location</label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="e.g. HK-DC1 Spares Locker (Rack A0)"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1 font-semibold">Compatibility</label>
                <input
                  type="text"
                  value={newCompatibility}
                  onChange={(e) => setNewCompatibility(e.target.value)}
                  placeholder="e.g. Cisco Catalyst 9300, Palo Alto PA-3220"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
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
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer shadow-sm"
                >
                  Save Spare Part
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {txModalOpen && selectedPart && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center">
                <Package className="w-4 h-4 mr-2 text-blue-600" />
                Stock Transaction: {selectedPart.part_number}
              </h3>
              <button
                type="button"
                onClick={() => setTxModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTransaction} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 block mb-1 font-semibold">Transaction Type</label>
                <select
                  value={txType}
                  onChange={(e) => setTxType(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Check-out">Check-out (Dispatched to Datacenter Rack)</option>
                  <option value="Check-in">Check-in (Received from Supplier)</option>
                  <option value="Adjustment">Physical Inventory Adjustment</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 block mb-1 font-semibold">Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={txQty}
                  onChange={(e) => setTxQty(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1 font-semibold">Notes / Ticket Reference</label>
                <input
                  type="text"
                  value={txNotes}
                  onChange={(e) => setTxNotes(e.target.value)}
                  placeholder="e.g. MNT-2025-1002 field replacement"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
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
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer shadow-sm"
                >
                  Confirm Stock Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
