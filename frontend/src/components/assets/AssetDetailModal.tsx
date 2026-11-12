"use client";

import React, { useState, useEffect } from "react";
import { apiUrl } from "@/lib/api";
import {
  X,
  Server,
  Cpu,
  FileText,
  Share2,
  Wrench,
  FolderOpen,
  History,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Download,
  Upload,
  AlertTriangle,
} from "lucide-react";

interface AssetDetailModalProps {
  assetId: string | null;
  onClose: () => void;
  onEdit?: (asset: any) => void;
}

export function AssetDetailModal({ assetId, onClose, onEdit }: AssetDetailModalProps) {
  const [activeTab, setActiveTab] = useState<number>(1);
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!assetId) return;
    setLoading(true);
    fetch(apiUrl(`/api/v1/assets/${assetId}`))
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load asset details");
        return res.json();
      })
      .then((data) => {
        setAsset(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [assetId]);

  if (!assetId) return null;

  const tabs = [
    { id: 1, label: "Overview", icon: Server },
    { id: 2, label: "Technical Details", icon: Cpu },
    { id: 3, label: "Contracts & Warranty", icon: FileText },
    { id: 4, label: "Network Relationships", icon: Share2 },
    { id: 5, label: "Maintenance History", icon: Wrench },
    { id: 6, label: "Documents", icon: FolderOpen },
    { id: 7, label: "Audit History", icon: History },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[92vh] sm:h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-xl bg-[#0A192F] text-white flex items-center justify-center shadow-sm shrink-0">
              <Server className="w-4 sm:w-5 h-4 sm:h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-1">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  {asset ? `${asset.hostname} (${asset.asset_id})` : "Asset Details"}
                </h2>
                {asset && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      asset.operational_status === "Deployed"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {asset.operational_status}
                  </span>
                )}
                {asset && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      asset.ownership_type?.includes("Company")
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {asset.ownership_type}
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">
                {asset ? `${asset.manufacturer} ${asset.model_name} • ${asset.location_display || "—"}` : "Loading asset specification..."}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0">
            {asset && onEdit && (
              <button
                onClick={() => onEdit(asset)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Edit Asset
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 7 Tabs Navigation Bar */}
        <div className="px-3 sm:px-6 bg-white border-b border-slate-200 flex space-x-1 shrink-0 overflow-x-auto no-scrollbar">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center space-x-2 py-2.5 sm:py-3 px-2.5 sm:px-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? "border-blue-600 text-blue-600 bg-blue-50/30"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          {loading ? (
            <div className="h-full flex items-center justify-center text-slate-400">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-blue-600 border-t-transparent mb-2" />
                <p className="text-xs">Fetching asset profile & telemetry...</p>
              </div>
            </div>
          ) : error || !asset ? (
            <div className="p-6 text-center text-red-600 text-xs">
              {error || "Asset not found"}
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic & Hardware Information */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center">
                      <Server className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                      Hardware Identification
                    </h4>
                    <div className="grid grid-cols-2 gap-y-2 text-xs">
                      <span className="text-slate-500">Asset ID:</span>
                      <span className="font-semibold text-slate-900">{asset.asset_id}</span>
                      <span className="text-slate-500">Hostname:</span>
                      <span className="font-semibold text-slate-900">{asset.hostname}</span>
                      <span className="text-slate-500">Manufacturer (Principal):</span>
                      <span className="font-semibold text-slate-900">{asset.manufacturer}</span>
                      <span className="text-slate-500">Model:</span>
                      <span className="font-semibold text-slate-900">{asset.model_name}</span>
                      <span className="text-slate-500">Serial Number:</span>
                      <span className="font-mono text-slate-800">{asset.serial_number}</span>
                      <span className="text-slate-500">Asset Tag:</span>
                      <span className="font-mono text-slate-800">{asset.asset_tag || "—"}</span>
                      <span className="text-slate-500">Category:</span>
                      <span className="font-semibold text-slate-900">{asset.category_name}</span>
                      <span className="text-slate-500">Device Role:</span>
                      <span className="text-slate-800">{asset.device_role}</span>
                    </div>
                  </div>

                  {/* Ownership & Procurement */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center">
                      <FileText className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                      Ownership & Procurement
                    </h4>
                    <div className="grid grid-cols-2 gap-y-2 text-xs">
                      <span className="text-slate-500">Ownership Type:</span>
                      <span className="font-semibold text-slate-900">{asset.ownership_type}</span>
                      {asset.rental_provider && (
                        <>
                          <span className="text-slate-500">Rental Distributor / Provider:</span>
                          <span className="font-semibold text-amber-800">{asset.rental_provider}</span>
                          <span className="text-slate-500">Rental Agreement Ref:</span>
                          <span className="font-mono text-slate-800">{asset.rental_agreement_ref || "—"}</span>
                          <span className="text-slate-500">Monthly Rental:</span>
                          <span className="font-semibold text-slate-900">HKD {asset.monthly_rental_cost?.toLocaleString()}</span>
                          <span className="text-slate-500">Rental Expiration:</span>
                          <span className="text-amber-700 font-semibold">{asset.rental_end_date || "—"}</span>
                        </>
                      )}
                      <span className="text-slate-500">PO Number:</span>
                      <span className="font-mono text-slate-800">{asset.po_number || "—"}</span>
                      <span className="text-slate-500">Purchase Price:</span>
                      <span className="font-semibold text-slate-900">HKD {asset.purchase_price?.toLocaleString()}</span>
                      <span className="text-slate-500">Acquisition Date:</span>
                      <span className="text-slate-800">{asset.acquisition_date || "—"}</span>
                      <span className="text-slate-500">Deployment Date:</span>
                      <span className="text-slate-800">{asset.deployment_date || "—"}</span>
                    </div>
                  </div>

                  {/* Datacenter Location */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 md:col-span-2">
                    <h4 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2">
                      Physical Datacenter Placement
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-slate-500 block">Site / Facility:</span>
                        <span className="font-semibold text-slate-900">{asset.location_display || "—"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Rack Position:</span>
                        <span className="font-semibold text-slate-900">{asset.rack_position || "—"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Condition:</span>
                        <span className="font-semibold text-emerald-700">{asset.asset_condition || "Operational"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">End of Life (EOL):</span>
                        <span className="text-slate-800">{asset.end_of_life_date || "—"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: TECHNICAL DETAILS */}
              {activeTab === 2 && (
                <div className="space-y-6">
                  {/* IP, MAC, Firmware cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <span className="text-xs text-slate-500 block font-medium">Management IP Address</span>
                      <span className="text-sm font-bold font-mono text-blue-700 mt-1 block">
                        {asset.management_ip || "—"}
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">{asset.subnet}</span>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <span className="text-xs text-slate-500 block font-medium">Physical MAC Address</span>
                      <span className="text-sm font-bold font-mono text-slate-800 mt-1 block">
                        {asset.mac_address || "—"}
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">VLAN: {asset.vlan}</span>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <span className="text-xs text-slate-500 block font-medium">Operating System & Firmware</span>
                      <span className="text-sm font-bold text-slate-800 mt-1 block">
                        {asset.operating_system}
                      </span>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">Ver: {asset.firmware_version}</span>
                    </div>
                  </div>

                  {/* Network Interfaces Table */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <h4 className="text-xs font-bold text-slate-800 mb-3">Configured Network Interfaces</h4>
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 text-[11px]">
                          <th className="pb-2">Interface</th>
                          <th className="pb-2">IP Address</th>
                          <th className="pb-2">Speed</th>
                          <th className="pb-2">Duplex</th>
                          <th className="pb-2">Status</th>
                          <th className="pb-2">Uplink Target</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(!asset.interfaces || asset.interfaces.length === 0) ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-400">
                              No physical network interfaces registered
                            </td>
                          </tr>
                        ) : (
                          asset.interfaces.map((iface: any) => (
                            <tr key={iface.id} className="hover:bg-slate-50">
                              <td className="py-2.5 font-mono font-medium text-slate-800">{iface.name}</td>
                              <td className="py-2.5 font-mono text-slate-600">{iface.ip_address || "—"}</td>
                              <td className="py-2.5 text-slate-600">{iface.speed}</td>
                              <td className="py-2.5 text-slate-600">{iface.duplex}</td>
                              <td className="py-2.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${iface.status === "Up" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                                  {iface.status}
                                </span>
                              </td>
                              <td className="py-2.5 text-slate-600">{iface.uplink_target ? `${iface.uplink_target} (${iface.uplink_port})` : "None"}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: CONTRACTS & WARRANTY */}
              {activeTab === 3 && (
                <div className="space-y-6">
                  {/* Active Warranties */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                    <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center">
                      <ShieldCheck className="w-4 h-4 mr-2 text-emerald-600" />
                      Hardware Warranty Coverage
                    </h4>
                    <div className="space-y-3">
                      {asset.warranties?.map((w: any) => (
                        <div key={w.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-800">{w.provider}</span>
                            <p className="text-[11px] text-slate-500 mt-0.5">{w.support_coverage}</p>
                            <span className="text-[10px] text-slate-400 font-mono">Ref: {w.reference_no}</span>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${w.status === "Active" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                              {w.status}
                            </span>
                            <p className="text-[11px] text-slate-600 mt-1">Expires: <span className="font-semibold">{w.expiration_date}</span></p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Covered Contracts */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                    <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-blue-600" />
                      Associated Enterprise Contracts
                    </h4>
                    <div className="space-y-3">
                      {asset.contracts?.map((c: any) => (
                        <div key={c.contract_id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-800">{c.contract_name}</span>
                            <p className="text-[11px] text-slate-500 mt-0.5">{c.contract_number} • {c.contract_type} • Vendor: {c.vendor}</p>
                            <span className="text-[10px] text-blue-600 font-medium">SLA: {c.sla}</span>
                          </div>
                          <div className="text-right">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                              {c.status}
                            </span>
                            <p className="text-[11px] text-slate-600 mt-1">Valid: {c.start_date} to <span className="font-semibold">{c.end_date}</span></p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: NETWORK RELATIONSHIPS */}
              {activeTab === 4 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center">
                    <Share2 className="w-4 h-4 mr-2 text-blue-600" />
                    Topology Links & Connected Neighbors
                  </h4>
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 text-[11px]">
                        <th className="pb-2">Local Port</th>
                        <th className="pb-2">Remote Device</th>
                        <th className="pb-2">Remote Model</th>
                        <th className="pb-2">Remote Port</th>
                        <th className="pb-2">Connection Type</th>
                        <th className="pb-2">Bandwidth</th>
                        <th className="pb-2">Link Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(!asset.topology_neighbors || asset.topology_neighbors.length === 0) ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                            No active topology connections found for this device.
                          </td>
                        </tr>
                      ) : (
                        asset.topology_neighbors.map((nbr: any) => (
                          <tr key={nbr.connection_id} className="hover:bg-slate-50">
                            <td className="py-2.5 font-mono font-bold text-slate-800">{nbr.local_port}</td>
                            <td className="py-2.5 font-semibold text-blue-600">{nbr.remote_device}</td>
                            <td className="py-2.5 text-slate-600">{nbr.remote_model}</td>
                            <td className="py-2.5 font-mono text-slate-700">{nbr.remote_port}</td>
                            <td className="py-2.5 text-slate-600">{nbr.connection_type}</td>
                            <td className="py-2.5 text-slate-700 font-medium">{nbr.bandwidth}</td>
                            <td className="py-2.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                                {nbr.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 5: MAINTENANCE HISTORY */}
              {activeTab === 5 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center">
                    <Wrench className="w-4 h-4 mr-2 text-blue-600" />
                    Preventive & Corrective Maintenance Tickets
                  </h4>
                  {asset.maintenance_history?.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      No maintenance work orders logged for this device.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {asset.maintenance_history?.map((m: any) => (
                        <div key={m.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{m.ticket_number} • {m.maintenance_type}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${m.status === "Completed" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"}`}>
                              {m.status}
                            </span>
                          </div>
                          <p className="text-slate-700">{m.description}</p>
                          {m.resolution && (
                            <p className="text-slate-600 bg-white p-2 rounded border border-slate-100">
                              <span className="font-semibold text-slate-800">Resolution:</span> {m.resolution}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                            <span>Technician: {m.technician}</span>
                            <span>Cost: HKD {m.cost?.toLocaleString()}</span>
                            <span>Reported: {m.reported_date?.slice(0, 10)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: DOCUMENTS */}
              {activeTab === 6 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center">
                      <FolderOpen className="w-4 h-4 mr-2 text-blue-600" />
                      Technical Documentation & Configuration Backups
                    </h4>
                    <button className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Document</span>
                    </button>
                  </div>
                  {(!asset.documents || asset.documents.length === 0) ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      No documents or backups attached to this device.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {asset.documents.map((doc: any) => (
                        <div key={doc.id} className="py-3 flex items-center justify-between text-xs hover:bg-slate-50 px-2 rounded">
                          <div className="flex items-center space-x-3">
                            <FileText className="w-5 h-5 text-blue-500" />
                            <div>
                              <span className="font-semibold text-slate-800">{doc.file_name}</span>
                              <span className="text-[11px] text-slate-400 block">{doc.document_type} • {doc.file_size_kb} KB • {doc.uploaded_by}</span>
                            </div>
                          </div>
                          <button className="flex items-center space-x-1 text-xs font-medium text-blue-600 hover:text-blue-800">
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 7: AUDIT HISTORY */}
              {activeTab === 7 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center">
                    <History className="w-4 h-4 mr-2 text-blue-600" />
                    Asset Modification Audit Trail
                  </h4>
                  {(!asset.audit_history || asset.audit_history.length === 0) ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      No modification history recorded for this device.
                    </div>
                  ) : (
                    <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
                      {asset.audit_history.map((h: any) => (
                        <div key={h.id} className="relative text-xs">
                          <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white" />
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800">{h.action}</span>
                              <span className="text-[11px] text-slate-400">{h.created_at}</span>
                            </div>
                            <p className="text-slate-600 mt-1">
                              Modified <span className="font-mono text-slate-800 font-semibold">{h.field_name}</span> from{" "}
                              <span className="line-through text-slate-400">{h.old_value || "none"}</span> to{" "}
                              <span className="font-semibold text-emerald-700">{h.new_value}</span>
                            </p>
                            <span className="text-[10px] text-slate-500 block mt-1">Changed by: {h.changed_by}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

