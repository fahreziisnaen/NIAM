"use client";

import React, { useState, useEffect } from "react";
import { Wrench, Search, Plus, CheckCircle2, Clock, AlertTriangle, ShieldAlert, X, AlertCircle } from "lucide-react";
import { apiUrl } from "@/lib/api";

export function MaintenanceView() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [ticketNum, setTicketNum] = useState("");
  const [assetId, setAssetId] = useState(1);
  const [maintenanceType, setMaintenanceType] = useState("Preventive Maintenance");
  const [technician, setTechnician] = useState("Kelvin Chan (Field Ops)");
  const [scheduledDate, setScheduledDate] = useState("2026-03-15");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState(4500);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadMaintenance = () => {
    setLoading(true);
    let endpoint = "/api/v1/maintenance?page=1&page_size=50";
    if (search) endpoint += `&search=${encodeURIComponent(search)}`;
    if (statusFilter) endpoint += `&status=${encodeURIComponent(statusFilter)}`;

    fetch(apiUrl(endpoint))
      .then((res) => res.json())
      .then((data) => {
        setRecords(data.items || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadMaintenance();
  }, [search, statusFilter]);

  const handleCreateWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("phillip_token") : null;
      const res = await fetch(apiUrl("/api/v1/maintenance"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ticket_number: ticketNum.trim(),
          asset_id: Number(assetId),
          maintenance_type: maintenanceType,
          status: "Scheduled",
          scheduled_date: scheduledDate,
          technician: technician.trim(),
          description: description.trim() || "Scheduled preventive maintenance & optics check",
          cost: Number(cost),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to create work order");
      }

      setModalOpen(false);
      loadMaintenance();
    } catch (err: any) {
      setFormError(err.message || "Failed to submit work order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Preventive & Corrective Maintenance Operations
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Track hardware replacements, firmware patching schedules, field technician dispatch, and resolution root causes.
          </p>
        </div>

        <button
          onClick={() => {
            setTicketNum(`MNT-2026-${Math.floor(Math.random() * 900) + 100}`);
            setFormError(null);
            setModalOpen(true);
          }}
          className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1E60D5] hover:bg-blue-700 rounded-lg shadow-sm transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Work Order</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">In Maintenance</span>
            <div className="text-xl font-bold text-blue-600">6 devices</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Scheduled PM</span>
            <div className="text-xl font-bold text-slate-900">4 tickets</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Completed (YTD)</span>
            <div className="text-xl font-bold text-slate-900">48 tickets</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Total Cost</span>
            <div className="text-xl font-bold text-slate-900">HKD 184,200</div>
          </div>
        </div>
      </div>

      {/* Maintenance Table Container */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ticket, technician, description..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="In Progress">In Progress</option>
              <option value="Scheduled">Scheduled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 text-[11px] uppercase bg-slate-50/60">
                <th className="py-2.5 px-3">Ticket #</th>
                <th className="py-2.5 px-3">Device Hostname</th>
                <th className="py-2.5 px-3">Hardware Model</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Technician</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Cost (HKD)</th>
                <th className="py-2.5 px-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Loading maintenance records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No maintenance records found.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{r.ticket_number}</td>
                    <td className="py-3 px-3 font-semibold text-blue-600">{r.hostname}</td>
                    <td className="py-3 px-3 text-slate-600">{r.model_name}</td>
                    <td className="py-3 px-3 text-slate-700">{r.maintenance_type}</td>
                    <td className="py-3 px-3 text-slate-600">{r.technician}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.status === "Completed"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-800">
                      ${r.cost?.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-slate-600 max-w-xs truncate">{r.description}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Work Order Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center">
                <Wrench className="w-4 h-4 mr-2 text-blue-600" />
                Dispatch Maintenance Work Order
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
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

            <form onSubmit={handleCreateWorkOrder} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Ticket # *</label>
                  <input
                    type="text"
                    value={ticketNum}
                    onChange={(e) => setTicketNum(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:border-blue-600 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Target Asset ID *</label>
                  <select
                    value={assetId}
                    onChange={(e) => setAssetId(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:border-blue-600 focus:outline-none font-mono"
                  >
                    <option value={1}>1 - FW-01-HK (PA-3220)</option>
                    <option value={2}>2 - SW-01-HK (C9300-48P)</option>
                    <option value={3}>3 - RT-01-HK (ISR4431)</option>
                    <option value={4}>4 - AP-01-HK (C9130AXI)</option>
                    <option value={5}>5 - SW-02-HK (S5735)</option>
                    <option value={6}>6 - FW-02-HK (FortiGate 100F)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Maintenance Type *</label>
                <select
                  value={maintenanceType}
                  onChange={(e) => setMaintenanceType(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:border-blue-600 focus:outline-none"
                >
                  <option value="Preventive Maintenance">Preventive Maintenance</option>
                  <option value="Corrective Repair">Corrective Repair</option>
                  <option value="Firmware Patching">Firmware Patching</option>
                  <option value="Hardware Replacement">Hardware Replacement (RMA)</option>
                  <option value="Optics Cleaning & Inspection">Optics Cleaning & Inspection</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Technician / Vendor *</label>
                  <input
                    type="text"
                    value={technician}
                    onChange={(e) => setTechnician(e.target.value)}
                    placeholder="e.g. Raymond Wong"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Scheduled Date *</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Estimated Cost (HKD)</label>
                <input
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Scope of Work Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe maintenance procedure, optics inspection, or patch version..."
                  rows={2}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  {submitting ? "Dispatching..." : "Dispatch Work Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
