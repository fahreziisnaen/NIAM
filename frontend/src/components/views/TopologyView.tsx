"use client";

import React, { useState, useEffect } from "react";
import {
  Share2,
  Plus,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Server,
  Shield,
  Wifi,
  Route,
  X,
  Cable,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Activity,
  Layers,
  ArrowRightLeft
} from "lucide-react";
import { apiUrl } from "@/lib/api";

export function TopologyView() {
  const [viewMode, setViewMode] = useState<"visual" | "table">("visual");

  const [topology, setTopology] = useState<any>({ nodes: [], edges: [] });
  const [connections, setConnections] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [tableSearch, setTableSearch] = useState<string>("");

  // Modals state
  const [connModalOpen, setConnModalOpen] = useState<boolean>(false);
  const [editingConn, setEditingConn] = useState<any>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [connToDelete, setConnToDelete] = useState<any>(null);

  // Form State
  const [formSourceAssetId, setFormSourceAssetId] = useState<number>(1);
  const [formSourcePort, setFormSourcePort] = useState<string>("Te1/0/1");
  const [formTargetAssetId, setFormTargetAssetId] = useState<number>(2);
  const [formTargetPort, setFormTargetPort] = useState<string>("eth1/1");
  const [formConnType, setFormConnType] = useState<string>("10G Fiber SFP+");
  const [formBandwidth, setFormBandwidth] = useState<string>("10 Gbps");
  const [formStatus, setFormStatus] = useState<string>("Active");
  const [formNotes, setFormNotes] = useState<string>("");

  // Device search filters in modal
  const [srcSearch, setSrcSearch] = useState<string>("");
  const [tgtSearch, setTgtSearch] = useState<string>("");

  // Notifications
  const [toastSuccess, setToastSuccess] = useState<string | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);

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

  const loadAllTopologyData = async () => {
    setLoading(true);
    try {
      const [topRes, connRes, devRes] = await Promise.all([
        fetch(apiUrl("/api/v1/topology")),
        fetch(apiUrl("/api/v1/topology/connections")),
        fetch(apiUrl("/api/v1/topology/devices")),
      ]);

      const topData = await topRes.json();
      const connData = await connRes.json();
      const devData = await devRes.json();

      setTopology(topData);
      setConnections(Array.isArray(connData) ? connData : []);
      setDevices(Array.isArray(devData) ? devData : []);

      if (topData.nodes && topData.nodes.length > 0 && !selectedNode) {
        setSelectedNode(topData.nodes[0]);
      }
      if (Array.isArray(devData) && devData.length > 1) {
        if (!formSourceAssetId) setFormSourceAssetId(devData[0].id);
        if (!formTargetAssetId) setFormTargetAssetId(devData[1].id);
      }
    } catch (e) {
      console.error("Error loading network topology", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllTopologyData();
  }, []);

  // Open Add Modal
  const openAddConnection = () => {
    setEditingConn(null);
    if (devices.length > 1) {
      setFormSourceAssetId(devices[0].id);
      setFormTargetAssetId(devices[1].id);
    }
    setFormSourcePort("Te1/0/1");
    setFormTargetPort("eth1/1");
    setFormConnType("10G Fiber SFP+");
    setFormBandwidth("10 Gbps");
    setFormStatus("Active");
    setFormNotes("");
    setSrcSearch("");
    setTgtSearch("");
    setConnModalOpen(true);
  };

  // Open Edit Modal
  const openEditConnection = (c: any) => {
    setEditingConn(c);
    setFormSourceAssetId(c.source_asset_id);
    setFormSourcePort(c.source_port);
    setFormTargetAssetId(c.target_asset_id);
    setFormTargetPort(c.target_port);
    setFormConnType(c.connection_type || "10G Fiber SFP+");
    setFormBandwidth(c.bandwidth_gbps || "10 Gbps");
    setFormStatus(c.status || "Active");
    setFormNotes(c.notes || "");
    setSrcSearch("");
    setTgtSearch("");
    setConnModalOpen(true);
  };

  // Submit Save Connection (Add / Edit)
  const handleSaveConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formSourceAssetId === formTargetAssetId) {
      notifyError("Source and Target cannot be the exact same device.");
      return;
    }

    try {
      const url = editingConn
        ? apiUrl(`/api/v1/topology/connections/${editingConn.id}`)
        : apiUrl("/api/v1/topology/connections");
      const method = editingConn ? "PUT" : "POST";

      const payload = {
        source_asset_id: Number(formSourceAssetId),
        source_port: formSourcePort.trim(),
        target_asset_id: Number(formTargetAssetId),
        target_port: formTargetPort.trim(),
        connection_type: formConnType,
        bandwidth_gbps: formBandwidth,
        status: formStatus,
        notes: formNotes.trim() || undefined,
      };

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to save connection");
      }

      setConnModalOpen(false);
      notifySuccess(`Connection link ${editingConn ? "updated" : "created"} successfully!`);
      loadAllTopologyData();
    } catch (err: any) {
      notifyError(err.message);
    }
  };

  // Delete Action
  const confirmDeleteConnection = (c: any) => {
    setConnToDelete(c);
    setDeleteModalOpen(true);
  };

  const executeDeleteConnection = async () => {
    if (!connToDelete) return;
    try {
      const res = await fetch(apiUrl(`/api/v1/topology/connections/${connToDelete.id}`), {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Deletion failed");
      }

      setDeleteModalOpen(false);
      setConnToDelete(null);
      notifySuccess("Connection removed successfully!");
      loadAllTopologyData();
    } catch (err: any) {
      setDeleteModalOpen(false);
      notifyError(err.message);
    }
  };

  // Filtered devices for select dropdowns
  const filteredSrcDevices = devices.filter((d) => {
    if (!srcSearch) return true;
    const q = srcSearch.toLowerCase();
    return d.hostname.toLowerCase().includes(q) || d.asset_id.toLowerCase().includes(q) || d.management_ip.toLowerCase().includes(q);
  });

  const filteredTgtDevices = devices.filter((d) => {
    if (!tgtSearch) return true;
    const q = tgtSearch.toLowerCase();
    return d.hostname.toLowerCase().includes(q) || d.asset_id.toLowerCase().includes(q) || d.management_ip.toLowerCase().includes(q);
  });

  // Filtered connections table
  const filteredConnections = connections.filter((c) => {
    if (!tableSearch) return true;
    const q = tableSearch.toLowerCase();
    return (
      (c.source_hostname && c.source_hostname.toLowerCase().includes(q)) ||
      (c.target_hostname && c.target_hostname.toLowerCase().includes(q)) ||
      (c.source_port && c.source_port.toLowerCase().includes(q)) ||
      (c.target_port && c.target_port.toLowerCase().includes(q)) ||
      (c.connection_type && c.connection_type.toLowerCase().includes(q)) ||
      (c.notes && c.notes.toLowerCase().includes(q))
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
            Interactive Network Topology & Interconnects
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Visual network architecture mapping and interconnect link ledger between Core Backbone, Edge NGFWs, WAN Routers, and Server Fabrics.
          </p>
        </div>

        {/* Global Controls & Action */}
        <div className="flex items-center space-x-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setViewMode("visual")}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === "visual" ? "bg-white text-blue-600 font-bold shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Visual Graph
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === "table" ? "bg-white text-blue-600 font-bold shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Interconnects ({connections.length})
            </button>
          </div>

          <button
            onClick={loadAllTopologyData}
            className="p-2 bg-white rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer shadow-sm transition-all"
            title="Refresh Network Map"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
          </button>

          <button
            onClick={openAddConnection}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#1E60D5] hover:bg-blue-700 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Connection</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: VISUAL GRAPH */}
      {viewMode === "visual" && (
        <div className="space-y-4">
          {/* Zoom & View Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-medium">Zoom Level: {Math.round(zoomLevel * 100)}%</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 1.6))}
                className="p-1.5 bg-white rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.6))}
                className="p-1.5 bg-white rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="p-1.5 bg-white rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs cursor-pointer"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-0.5 bg-blue-600 inline-block" />
                <span className="text-slate-600 font-medium">Core 40G/100G Fabric</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-0.5 bg-emerald-500 inline-block" />
                <span className="text-slate-600 font-medium">10G Fiber Uplinks</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-0.5 bg-amber-500 inline-block" />
                <span className="text-slate-600 font-medium">Edge / WAN Trunks</span>
              </div>
            </div>
          </div>

          {/* SVG Canvas & Node Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* SVG Visual Stage */}
            <div className="lg:col-span-3 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm min-h-[520px] flex items-center justify-center relative overflow-hidden">
              {loading ? (
                <div className="text-center text-slate-400 text-xs">Loading network topology links...</div>
              ) : (
                <div
                  className="w-full h-full min-h-[480px] relative transition-transform duration-150 flex items-center justify-center select-none"
                  style={{ transform: `scale(${zoomLevel})` }}
                >
                  <svg className="w-full h-[480px]" viewBox="0 0 850 480">
                    <defs>
                      <linearGradient id="linkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#2563EB" />
                        <stop offset="100%" stopColor="#10B981" />
                      </linearGradient>
                      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.08" />
                      </filter>
                    </defs>

                    {/* Dynamic Connection Lines */}
                    {connections.map((c, i) => {
                      // Generate deterministic aesthetic coordinates based on connection index
                      const x1 = 160 + (i % 3) * 220;
                      const y1 = 110 + Math.floor(i / 3) * 160;
                      const x2 = 380;
                      const y2 = 240;
                      const isSelected =
                        selectedNode && (selectedNode.id === c.source_asset_id || selectedNode.id === c.target_asset_id);

                      return (
                        <g key={c.id}>
                          <line
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke={isSelected ? "#2563EB" : i % 2 === 0 ? "#10B981" : "#3B82F6"}
                            strokeWidth={isSelected ? 3.5 : 2}
                            strokeDasharray={c.connection_type.includes("Trunk") ? "4 3" : undefined}
                          />
                          <text
                            x={(x1 + x2) / 2}
                            y={(y1 + y2) / 2 - 6}
                            fill="#64748B"
                            fontSize="9"
                            fontFamily="monospace"
                            textAnchor="middle"
                            className="bg-white"
                          >
                            {c.bandwidth_gbps || "10G"}
                          </text>
                        </g>
                      );
                    })}

                    {/* Nodes (Key Core & Edge Devices) */}
                    {topology.nodes?.slice(0, 7).map((node: any, idx: number) => {
                      const positions = [
                        { x: 380, y: 240, role: "Core Backbone Switch" },
                        { x: 160, y: 110, role: "Edge Router" },
                        { x: 380, y: 90, role: "Primary NGFW" },
                        { x: 600, y: 110, role: "Secondary NGFW" },
                        { x: 160, y: 380, role: "Distribution Switch" },
                        { x: 600, y: 380, role: "Campus Wi-Fi 6 AP" },
                        { x: 740, y: 240, role: "Disaster Recovery Gateway" },
                      ];
                      const pos = positions[idx] || { x: 100 + idx * 80, y: 200, role: node.category };
                      const isSelected = selectedNode?.id === node.id;

                      return (
                        <g
                          key={node.id}
                          transform={`translate(${pos.x - 65}, ${pos.y - 40})`}
                          className="cursor-pointer group"
                          onClick={() => setSelectedNode(node)}
                        >
                          <rect
                            width="130"
                            height="76"
                            rx="12"
                            fill="#FFFFFF"
                            stroke={isSelected ? "#2563EB" : "#E2E8F0"}
                            strokeWidth={isSelected ? 2.5 : 1.5}
                            filter="url(#shadow)"
                            className="transition-all group-hover:stroke-blue-400"
                          />
                          <circle
                            cx="18"
                            cy="22"
                            r="5"
                            fill={node.status === "Operational" || node.status === "Deployed" ? "#10B981" : "#F59E0B"}
                          />
                          <text x="30" y="25" fill="#0F172A" fontSize="11" fontWeight="bold">
                            {node.hostname}
                          </text>
                          <text x="14" y="44" fill="#64748B" fontSize="9" fontFamily="monospace">
                            {node.management_ip || node.asset_id}
                          </text>
                          <text x="14" y="60" fill="#2563EB" fontSize="9" fontWeight="600">
                            {node.model || node.category}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              )}
            </div>

            {/* Selected Device / Link Details Panel */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Node Inspector
                </h3>
                {selectedNode && (
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold">
                    {selectedNode.category}
                  </span>
                )}
              </div>

              {selectedNode ? (
                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Hostname</span>
                    <span className="font-bold text-base text-slate-900">{selectedNode.hostname}</span>
                    <span className="text-xs text-slate-500 block font-mono mt-0.5">{selectedNode.asset_id}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Manufacturer</span>
                      <span className="font-semibold text-slate-800">{selectedNode.manufacturer || "Cisco Systems"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Model</span>
                      <span className="font-semibold text-slate-800">{selectedNode.model}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Device Role</span>
                      <span className="font-semibold text-blue-600">{selectedNode.device_role || "Core"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Facility</span>
                      <span className="font-semibold text-slate-800 truncate">{selectedNode.location}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Management IP</span>
                      <span className="font-mono font-bold text-slate-900">{selectedNode.management_ip || "N/A"}</span>
                    </div>
                  </div>

                  {/* Connected Links For This Node */}
                  <div className="pt-4 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-2">
                      Active Interconnects ({connections.filter((c) => c.source_asset_id === selectedNode.id || c.target_asset_id === selectedNode.id).length})
                    </span>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {connections
                        .filter((c) => c.source_asset_id === selectedNode.id || c.target_asset_id === selectedNode.id)
                        .map((c) => {
                          const isSrc = c.source_asset_id === selectedNode.id;
                          const peerHost = isSrc ? c.target_hostname : c.source_hostname;
                          const peerPort = isSrc ? c.target_port : c.source_port;
                          const localPort = isSrc ? c.source_port : c.target_port;
                          return (
                            <div key={c.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px]">
                              <div className="flex items-center justify-between font-semibold text-slate-800">
                                <span>{localPort} → {peerPort}</span>
                                <span className="font-mono text-blue-600">{c.bandwidth_gbps}</span>
                              </div>
                              <div className="text-slate-500 mt-1 truncate">
                                Peer: <span className="font-bold text-slate-700">{peerHost}</span> ({c.connection_type})
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-slate-400 text-xs">
                  <Share2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p>Select any network node on the canvas to inspect its hardware profile, management IP, and live link connections.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: INTERCONNECTS LEDGER TABLE (CRUD) */}
      {viewMode === "table" && (
        <div className="space-y-4">
          {/* Table Search Bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative max-w-md w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search connections by device, port, cable type, or notes..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
            <span className="text-xs text-slate-500">
              Showing <strong>{filteredConnections.length}</strong> interconnect links
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Source Device & Port</th>
                  <th className="px-5 py-3.5 text-center">Direction</th>
                  <th className="px-5 py-3.5">Target Device & Port</th>
                  <th className="px-5 py-3.5">Connection / Cable Type</th>
                  <th className="px-5 py-3.5 text-center">Bandwidth</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5">Operational Notes</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredConnections.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Source Device */}
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{c.source_hostname}</div>
                      <div className="text-[11px] font-mono text-blue-600">{c.source_port}</div>
                    </td>

                    {/* Direction */}
                    <td className="px-5 py-3.5 text-center">
                      <ArrowRightLeft className="w-4 h-4 text-slate-400 mx-auto" />
                    </td>

                    {/* Target Device */}
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{c.target_hostname}</div>
                      <div className="text-[11px] font-mono text-blue-600">{c.target_port}</div>
                    </td>

                    {/* Cable Type */}
                    <td className="px-5 py-3.5 font-medium text-slate-800">
                      <div className="flex items-center space-x-1.5">
                        <Cable className="w-3.5 h-3.5 text-slate-400" />
                        <span>{c.connection_type}</span>
                      </div>
                    </td>

                    {/* Bandwidth */}
                    <td className="px-5 py-3.5 text-center font-mono font-bold text-slate-800">
                      {c.bandwidth_gbps}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.status === "Active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : c.status === "Standby"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>

                    {/* Notes */}
                    <td className="px-5 py-3.5 text-slate-500 max-w-xs truncate">
                      {c.notes || "—"}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => openEditConnection(c)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100 transition-colors inline-block"
                        title="Edit Connection Link"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => confirmDeleteConnection(c)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition-colors inline-block"
                        title="Delete Connection Link"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================================== */}
      {/* MODAL: ADD / EDIT CONNECTION                                             */}
      {/* ======================================================================== */}
      {connModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <h3 className="text-sm font-bold text-slate-900">
                {editingConn ? "Edit Interconnect Link" : "Create New Network Interconnect Link"}
              </h3>
              <button
                type="button"
                onClick={() => setConnModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveConnection} className="p-6 space-y-4 text-xs">
              {/* Source Device & Port Section */}
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block">
                  1. Source Endpoint
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Source Device *</label>
                    <input
                      type="text"
                      placeholder="Filter device..."
                      value={srcSearch}
                      onChange={(e) => setSrcSearch(e.target.value)}
                      className="w-full mb-1.5 px-2.5 py-1 text-[11px] bg-white border border-slate-200 rounded-md"
                    />
                    <select
                      value={formSourceAssetId}
                      onChange={(e) => setFormSourceAssetId(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      {filteredSrcDevices.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.hostname} ({d.management_ip}) - {d.model}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Source Port / Interface *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Te1/0/1 or Eth1/48"
                      value={formSourcePort}
                      onChange={(e) => setFormSourcePort(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Target Device & Port Section */}
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
                  2. Target Endpoint
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Target Device *</label>
                    <input
                      type="text"
                      placeholder="Filter device..."
                      value={tgtSearch}
                      onChange={(e) => setTgtSearch(e.target.value)}
                      className="w-full mb-1.5 px-2.5 py-1 text-[11px] bg-white border border-slate-200 rounded-md"
                    />
                    <select
                      value={formTargetAssetId}
                      onChange={(e) => setFormTargetAssetId(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      {filteredTgtDevices.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.hostname} ({d.management_ip}) - {d.model}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Target Port / Interface *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. eth1/1 or Uplink-01"
                      value={formTargetPort}
                      onChange={(e) => setFormTargetPort(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Connection Specs */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Cable / Link Type</label>
                  <select
                    value={formConnType}
                    onChange={(e) => setFormConnType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                  >
                    <option value="100G QSFP28">100G QSFP28</option>
                    <option value="40G QSFP+">40G QSFP+</option>
                    <option value="10G Fiber SFP+">10G Fiber SFP+</option>
                    <option value="10G DAC Twinax">10G DAC Twinax</option>
                    <option value="1G Copper RJ45">1G Copper RJ45</option>
                    <option value="Trunk 802.1Q">Trunk 802.1Q</option>
                    <option value="LAG Port-Channel">LAG Port-Channel</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Bandwidth</label>
                  <select
                    value={formBandwidth}
                    onChange={(e) => setFormBandwidth(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  >
                    <option value="100 Gbps">100 Gbps</option>
                    <option value="40 Gbps">40 Gbps</option>
                    <option value="20 Gbps">20 Gbps (LAG)</option>
                    <option value="10 Gbps">10 Gbps</option>
                    <option value="1 Gbps">1 Gbps</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Link Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  >
                    <option value="Active">Active</option>
                    <option value="Standby">Standby</option>
                    <option value="Degraded">Degraded</option>
                    <option value="Under Maintenance">Under Maintenance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Operational Notes / VLAN Tagging</label>
                <textarea
                  rows={2}
                  placeholder="e.g. VLAN 100, 200, 300 allowed; redundant link via DC-MEGA Optical Patch"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setConnModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1E60D5] hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm"
                >
                  {editingConn ? "Update Interconnect" : "Save Interconnect Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================== */}
      {/* MODAL: DELETE CONNECTION CONFIRMATION                                    */}
      {/* ======================================================================== */}
      {deleteModalOpen && connToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm p-6 text-center animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Remove Connection Link?</h3>
            <p className="text-xs text-slate-500 mt-2">
              Are you sure you want to disconnect link between{" "}
              <span className="font-bold text-slate-800">{connToDelete.source_hostname}</span> and{" "}
              <span className="font-bold text-slate-800">{connToDelete.target_hostname}</span>?
            </p>
            <div className="flex items-center justify-center space-x-3 mt-6">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-50 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={executeDeleteConnection}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-xs shadow-sm"
              >
                Yes, Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
