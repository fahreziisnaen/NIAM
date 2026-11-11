"use client";

import React, { useState, useEffect } from "react";
import {
  Wrench,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldAlert,
  X,
  AlertCircle,
  Eye,
  Server,
  Calendar,
  DollarSign,
  UserCheck,
  ExternalLink,
  ChevronRight,
  Trash2,
  Check
} from "lucide-react";
import { apiUrl } from "@/lib/api";
import { SearchableSelect } from "@/components/common/SearchableSelect";

interface MaintenanceViewProps {
  onSelectAsset?: (assetId: string) => void;
}

export function MaintenanceView({ onSelectAsset }: MaintenanceViewProps = {}) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Detail Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [resolutionText, setResolutionText] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // New Work Order Modal State
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

  // Available assets for new ticket dropdown
  const [availableAssets, setAvailableAssets] = useState<any[]>([]);

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

  // Load assets for dropdown
  useEffect(() => {
    fetch(apiUrl("/api/v1/assets?page=1&page_size=100"))
      .then((res) => res.json())
      .then((data) => {
        if (data.items) {
          setAvailableAssets(data.items);
          if (data.items.length > 0) setAssetId(data.items[0].id);
        }
      })
      .catch(() => {});
  }, []);

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
          scheduled_date: scheduledDate ? `${scheduledDate}T10:00:00` : undefined,
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

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("phillip_token") : null;
      const res = await fetch(apiUrl(`/api/v1/maintenance/${id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          status: newStatus,
          resolution: resolutionText.trim() || (newStatus === "Completed" ? "Work completed and verified by NOC duty engineer." : undefined),
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setSelectedRecord(updated);
        loadMaintenance();
      }
    } catch (err) {
      console.error("Failed to update maintenance status", err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteRecord = async (id: number) => {
    if (!confirm("Are you sure you want to delete this maintenance work order?")) return;
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("phillip_token") : null;
      const res = await fetch(apiUrl(`/api/v1/maintenance/${id}`), {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        setDetailModalOpen(false);
        setSelectedRecord(null);
        loadMaintenance();
      }
    } catch (err) {
      console.error("Failed to delete record", err);
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
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Loading maintenance records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No maintenance records found.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => {
                      setSelectedRecord(r);
                      setResolutionText(r.resolution || "");
                      setDetailModalOpen(true);
                    }}
                    className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-3 font-mono font-bold text-blue-600 group-hover:underline">
                      {r.ticket_number}
                    </td>
                    <td
                      className="py-3 px-3 font-semibold text-slate-900 group-hover:text-blue-700"
                      onClick={(e) => {
                        if (onSelectAsset) {
                          e.stopPropagation();
                          onSelectAsset(r.asset_id_str || r.hostname || String(r.asset_id));
                        }
                      }}
                    >
                      <div className="flex items-center gap-1">
                        <span>{r.hostname}</span>
                        {onSelectAsset && (
                          <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">{r.model_name}</td>
                    <td className="py-3 px-3 text-slate-700">{r.maintenance_type}</td>
                    <td className="py-3 px-3 text-slate-600">{r.technician}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          r.status === "Completed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : r.status === "In Progress"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
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
                    <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          setSelectedRecord(r);
                          setResolutionText(r.resolution || "");
                          setDetailModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors inline-block cursor-pointer"
                        title="View Work Order Breakdown"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL: MAINTENANCE WORK ORDER */}
      {detailModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-sm">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs text-blue-600">{selectedRecord.ticket_number}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        selectedRecord.status === "Completed"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : selectedRecord.status === "In Progress"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      {selectedRecord.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">
                    {selectedRecord.maintenance_type}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setDetailModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Linked Hardware Asset Card */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-blue-600" />
                    Covered Network Hardware
                  </span>
                  {onSelectAsset && (
                    <button
                      type="button"
                      onClick={() => {
                        setDetailModalOpen(false);
                        onSelectAsset(selectedRecord.asset_id_str || selectedRecord.hostname || String(selectedRecord.asset_id));
                      }}
                      className="text-blue-600 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <span>View Asset Profile</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Device Hostname</span>
                    <span className="font-bold text-slate-800 text-sm mt-0.5 block">{selectedRecord.hostname}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Model / Hardware</span>
                    <span className="font-mono text-slate-700 mt-0.5 block">{selectedRecord.model_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Servicing Vendor</span>
                    <span className="font-semibold text-slate-800 mt-0.5 block">{selectedRecord.vendor_name || "Internal NOC"}</span>
                  </div>
                </div>
              </div>

              {/* Maintenance Metrics & Personnel */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Field Technician</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{selectedRecord.technician}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Cost</span>
                  <span className="font-mono font-bold text-slate-900 mt-0.5 block">HKD {Number(selectedRecord.cost || 0).toLocaleString()}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Scheduled Date</span>
                  <span className="font-mono text-slate-700 mt-0.5 block">{selectedRecord.scheduled_date ? String(selectedRecord.scheduled_date).slice(0, 10) : "N/A"}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Completion Date</span>
                  <span className="font-mono text-emerald-700 font-semibold mt-0.5 block">{selectedRecord.completion_date ? String(selectedRecord.completion_date).slice(0, 10) : "Pending"}</span>
                </div>
              </div>

              {/* Description */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block mb-1">Scope of Work & Symptoms</span>
                <p className="text-slate-700 leading-relaxed">{selectedRecord.description}</p>
              </div>

              {/* Root Cause Analysis & Resolution */}
              {selectedRecord.root_cause && (
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl">
                  <span className="font-bold text-amber-900 uppercase tracking-wider text-[10px] block mb-1">Root Cause Analysis</span>
                  <p className="text-amber-800 leading-relaxed">{selectedRecord.root_cause}</p>
                </div>
              )}

              {/* Status Update / Resolution Input */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block">
                  Engineer Resolution Notes
                </span>
                <textarea
                  rows={2}
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  placeholder="Enter resolution details, replacement serial number, or optics test result..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:border-blue-600 focus:outline-none"
                />

                <div className="flex items-center space-x-2 pt-1">
                  {selectedRecord.status !== "In Progress" && selectedRecord.status !== "Completed" && (
                    <button
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => handleUpdateStatus(selectedRecord.id, "In Progress")}
                      className="px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer"
                    >
                      Set In Progress
                    </button>
                  )}
                  {selectedRecord.status !== "Completed" && (
                    <button
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => handleUpdateStatus(selectedRecord.id, "Completed")}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Mark Work Order Completed</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => handleDeleteRecord(selectedRecord.id)}
                className="text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Ticket</span>
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

            <form onSubmit={handleCreateWorkOrder} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Ticket #</label>
                  <input
                    type="text"
                    value={ticketNum}
                    onChange={(e) => setTicketNum(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:border-blue-600 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Target Hardware Asset *</label>
                  <SearchableSelect
                    options={availableAssets.map((a) => ({
                      value: a.id,
                      label: `${a.hostname} (${a.asset_id})`,
                      subLabel: a.model ? `${a.model} [${a.vendor || ""}]` : a.vendor,
                    }))}
                    value={assetId}
                    onChange={(val) => setAssetId(Number(val))}
                    placeholder="Search & select device..."
                    searchPlaceholder="Type hostname, asset tag, or model..."
                    searchThreshold={10}
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Maintenance Category *</label>
                <select
                  value={maintenanceType}
                  onChange={(e) => setMaintenanceType(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:border-blue-600 focus:outline-none"
                >
                  <option value="Preventive Maintenance">Preventive Maintenance (PM)</option>
                  <option value="Emergency Hardware Replacement">Emergency Hardware Replacement (RMA)</option>
                  <option value="Firmware Upgrade / Patch">Firmware Upgrade / Security Patching</option>
                  <option value="Cabling & Transceiver Recertification">Cabling & Transceiver Recertification</option>
                  <option value="Power Supply & Fan Tray Replacement">Power Supply & Fan Tray Replacement</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Assigned Technician</label>
                  <input
                    type="text"
                    value={technician}
                    onChange={(e) => setTechnician(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Scheduled Date</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:border-blue-600 focus:outline-none"
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
                  required
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Operational Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail the failure symptoms, maintenance procedure, or replacement objectives..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                />
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
                  disabled={submitting}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm cursor-pointer disabled:opacity-60"
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
