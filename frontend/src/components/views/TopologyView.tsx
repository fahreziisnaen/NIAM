"use client";

import React, { useState, useEffect } from "react";
import { Share2, Plus, ZoomIn, ZoomOut, RotateCcw, Server, Shield, Wifi, Route, X, Cable } from "lucide-react";
import { apiUrl } from "@/lib/api";

export function TopologyView() {
  const [topology, setTopology] = useState<any>({ nodes: [], edges: [] });
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [loading, setLoading] = useState(true);

  // Add Connection Modal
  const [connModalOpen, setConnModalOpen] = useState(false);
  const [sourceAssetId, setSourceAssetId] = useState<number>(1);
  const [sourcePort, setSourcePort] = useState("Te1/0/1");
  const [targetAssetId, setTargetAssetId] = useState<number>(2);
  const [targetPort, setTargetPort] = useState("eth1/1");
  const [connType, setConnType] = useState("10G Fiber SFP+");
  const [bandwidth, setBandwidth] = useState("10 Gbps");
  const [connStatus, setConnStatus] = useState("Active");
  const [notes, setNotes] = useState("");

  const getAuthToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("phillip_token") || "";
    }
    return "";
  };

  const loadTopology = () => {
    setLoading(true);
    fetch(apiUrl("/api/v1/topology"))
      .then((res) => res.json())
      .then((data) => {
        setTopology(data);
        if (data.nodes && data.nodes.length > 0) {
          setSelectedNode(data.nodes[0]);
          if (!sourceAssetId && data.nodes[0]) setSourceAssetId(data.nodes[0].id);
          if (!targetAssetId && data.nodes[1]) setTargetAssetId(data.nodes[1].id);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadTopology();
  }, []);

  const handleAddConnectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sourceAssetId === targetAssetId) {
      alert("Source and Target cannot be the exact same device.");
      return;
    }

    try {
      const token = getAuthToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(apiUrl("/api/v1/topology/connections"), {
        method: "POST",
        headers,
        body: JSON.stringify({
          source_asset_id: Number(sourceAssetId),
          source_port: sourcePort.trim(),
          target_asset_id: Number(targetAssetId),
          target_port: targetPort.trim(),
          connection_type: connType,
          bandwidth_gbps: bandwidth,
          status: connStatus,
          notes: notes.trim() || "Configured via Network Topology UI",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.detail || "Failed to create connection");
        return;
      }

      setConnModalOpen(false);
      loadTopology();
      alert("Network interconnect created successfully!");
    } catch {
      alert("Error saving connection interconnect");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Interactive Network Topology & Interconnects
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Visual relationship graph mapping Core Backbone, Distribution, Edge NGFWs, WAN Routers, and Campus Access Points.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 1.6))}
            className="p-2 bg-white rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer shadow-sm"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.6))}
            className="p-2 bg-white rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer shadow-sm"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            className="p-2 bg-white rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer shadow-sm"
            title="Reset Zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setConnModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#1E60D5] hover:bg-blue-700 rounded-lg shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Connection</span>
          </button>
        </div>
      </div>

      {/* Main Canvas & Detail Split */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Interactive SVG Diagram Canvas */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm min-h-[500px] flex items-center justify-center relative overflow-hidden">
          {loading ? (
            <div className="text-center text-slate-400 text-xs">Loading topology nodes...</div>
          ) : (
            <div
              className="w-full h-full min-h-[460px] relative transition-transform duration-150 flex items-center justify-center select-none"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <svg className="w-full h-[460px]" viewBox="0 0 800 460">
                <defs>
                  <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#2563EB" />
                    <stop offset="100%" stopColor="#10B981" />
                  </linearGradient>
                </defs>

                {/* Connection lines */}
                {/* Router -> Firewall */}
                <line x1="160" y1="120" x2="380" y2="120" stroke="#2563EB" strokeWidth="2.5" strokeDasharray="4 2" />
                <text x="250" y="112" fill="#64748B" fontSize="10" fontFamily="sans-serif">10G WAN Trunk</text>

                {/* Firewall -> Core Switch */}
                <line x1="380" y1="120" x2="380" y2="240" stroke="#2563EB" strokeWidth="3" />
                <text x="390" y="180" fill="#2563EB" fontSize="10" fontWeight="bold" fontFamily="sans-serif">40G Core Fabric</text>

                {/* Core Switch -> Distribution Switch */}
                <line x1="380" y1="240" x2="200" y2="360" stroke="#10B981" strokeWidth="2.5" />
                <text x="260" y="310" fill="#10B981" fontSize="10" fontFamily="sans-serif">10G Fiber (HK-HQ)</text>

                {/* Core Switch -> Access Point */}
                <line x1="380" y1="240" x2="560" y2="360" stroke="#8B5CF6" strokeWidth="2" strokeDasharray="3 3" />
                <text x="490" y="310" fill="#8B5CF6" fontSize="10" fontFamily="sans-serif">PoE+ 2.5G Wi-Fi 6</text>

                {/* Core Switch -> DC2 Backup Firewall */}
                <line x1="380" y1="240" x2="600" y2="120" stroke="#F59E0B" strokeWidth="2" />
                <text x="510" y="170" fill="#F59E0B" fontSize="10" fontFamily="sans-serif">10G DC Interconnect</text>

                {/* Nodes on SVG */}
                {/* Node 1: Edge Router (RT-01-HK) */}
                <g transform="translate(110, 85)" className="cursor-pointer group" onClick={() => setSelectedNode(topology.nodes[2] || topology.nodes[0])}>
                  <rect width="100" height="70" rx="10" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.06))" />
                  <rect x="10" y="10" width="20" height="20" rx="4" fill="#EFF6FF" />
                  <text x="10" y="46" fill="#0F172A" fontSize="11" fontWeight="bold">RT-01-HK</text>
                  <text x="10" y="58" fill="#64748B" fontSize="9">ISR4431 Router</text>
                </g>

                {/* Node 2: Primary NGFW (FW-01-HK) */}
                <g transform="translate(330, 85)" className="cursor-pointer group" onClick={() => setSelectedNode(topology.nodes[0])}>
                  <rect width="100" height="70" rx="10" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.06))" />
                  <rect x="10" y="10" width="20" height="20" rx="4" fill="#FEF3C7" />
                  <text x="10" y="46" fill="#0F172A" fontSize="11" fontWeight="bold">FW-01-HK</text>
                  <text x="10" y="58" fill="#64748B" fontSize="9">PA-3220 Firewall</text>
                </g>

                {/* Node 3: Secondary NGFW (FW-02-HK) */}
                <g transform="translate(550, 85)" className="cursor-pointer group" onClick={() => setSelectedNode(topology.nodes[5] || topology.nodes[0])}>
                  <rect width="100" height="70" rx="10" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="1.5" />
                  <text x="10" y="46" fill="#0F172A" fontSize="11" fontWeight="bold">FW-02-HK</text>
                  <text x="10" y="58" fill="#64748B" fontSize="9">FortiGate 100F</text>
                </g>

                {/* Node 4: Spine / Core Switch (SW-01-HK) */}
                <g transform="translate(320, 215)" className="cursor-pointer group" onClick={() => setSelectedNode(topology.nodes[1] || topology.nodes[0])}>
                  <rect width="120" height="75" rx="12" fill="#0A192F" stroke="#2563EB" strokeWidth="2" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.15))" />
                  <text x="12" y="38" fill="#FFFFFF" fontSize="12" fontWeight="bold">SW-01-HK (Core)</text>
                  <text x="12" y="52" fill="#93C5FD" fontSize="9">Cisco Catalyst 9300</text>
                  <text x="12" y="65" fill="#10B981" fontSize="8 font-mono">10.200.10.2 • UP</text>
                </g>

                {/* Node 5: Distribution Switch (SW-02-HK) */}
                <g transform="translate(150, 335)" className="cursor-pointer group" onClick={() => setSelectedNode(topology.nodes[4] || topology.nodes[0])}>
                  <rect width="100" height="70" rx="10" fill="#FFFFFF" stroke="#10B981" strokeWidth="1.5" />
                  <text x="10" y="46" fill="#0F172A" fontSize="11" fontWeight="bold">SW-02-HK</text>
                  <text x="10" y="58" fill="#64748B" fontSize="9">Huawei S5735</text>
                </g>

                {/* Node 6: Campus AP (AP-01-HK) */}
                <g transform="translate(510, 335)" className="cursor-pointer group" onClick={() => setSelectedNode(topology.nodes[3] || topology.nodes[0])}>
                  <rect width="100" height="70" rx="10" fill="#FFFFFF" stroke="#8B5CF6" strokeWidth="1.5" />
                  <text x="10" y="46" fill="#0F172A" fontSize="11" fontWeight="bold">AP-01-HK</text>
                  <text x="10" y="58" fill="#64748B" fontSize="9">C9130AXI Wi-Fi 6</text>
                </g>
              </svg>
            </div>
          )}
        </div>

        {/* Selected Node Profile Panel */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800">Node Properties</h3>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>

          {selectedNode ? (
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Hostname</span>
                <span className="text-sm font-bold text-slate-900">{selectedNode.hostname}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Asset ID</span>
                <span className="font-mono text-blue-600 font-semibold">{selectedNode.asset_id}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block">Hardware</span>
                  <span className="font-semibold text-slate-800">{selectedNode.model}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Manufacturer</span>
                  <span className="text-slate-800">{selectedNode.manufacturer}</span>
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Management IP</span>
                <span className="font-mono text-slate-900 font-bold">{selectedNode.management_ip || "10.200.10.1"}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Location</span>
                <span className="text-slate-700">{selectedNode.location}</span>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 block mb-1">Ownership & Role</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 mr-2">
                  {selectedNode.ownership}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                  {selectedNode.device_role}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-400 text-xs py-8">
              Click any device in the diagram to inspect interface telemetry and uplink links.
            </div>
          )}
        </div>
      </div>

      {/* Add Connection Modal */}
      {connModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center">
                <Cable className="w-4 h-4 mr-2 text-blue-600" />
                Register Network Interconnect / Topology Link
              </h3>
              <button
                type="button"
                onClick={() => setConnModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddConnectionSubmit} className="space-y-3 text-xs">
              {/* Source Device */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 block mb-1 font-semibold">Source Device *</label>
                  <select
                    value={sourceAssetId}
                    onChange={(e) => setSourceAssetId(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                  >
                    {topology.nodes?.map((n: any) => (
                      <option key={`src-${n.id}`} value={n.id}>
                        {n.hostname} ({n.asset_id})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 block mb-1 font-semibold">Source Port *</label>
                  <input
                    type="text"
                    value={sourcePort}
                    onChange={(e) => setSourcePort(e.target.value)}
                    placeholder="e.g. TenGigabitEthernet1/0/1"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                    required
                  />
                </div>
              </div>

              {/* Target Device */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 block mb-1 font-semibold">Target Device *</label>
                  <select
                    value={targetAssetId}
                    onChange={(e) => setTargetAssetId(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                  >
                    {topology.nodes?.map((n: any) => (
                      <option key={`tgt-${n.id}`} value={n.id}>
                        {n.hostname} ({n.asset_id})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 block mb-1 font-semibold">Target Port *</label>
                  <input
                    type="text"
                    value={targetPort}
                    onChange={(e) => setTargetPort(e.target.value)}
                    placeholder="e.g. ethernet1/1"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                    required
                  />
                </div>
              </div>

              {/* Connection Type & Bandwidth */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 block mb-1 font-semibold">Link Type</label>
                  <select
                    value={connType}
                    onChange={(e) => setConnType(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="10G Fiber SFP+">10G Fiber SFP+</option>
                    <option value="40G QSFP+ Core Trunk">40G QSFP+ Core Trunk</option>
                    <option value="100G Spine-Leaf Direct">100G Spine-Leaf Direct</option>
                    <option value="1G Cat6A Copper">1G Cat6A Copper</option>
                    <option value="PoE+ 2.5G Campus">PoE+ 2.5G Campus</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 block mb-1 font-semibold">Bandwidth Capacity</label>
                  <input
                    type="text"
                    value={bandwidth}
                    onChange={(e) => setBandwidth(e.target.value)}
                    placeholder="e.g. 10 Gbps"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-600 block mb-1 font-semibold">Operational Status</label>
                <select
                  value={connStatus}
                  onChange={(e) => setConnStatus(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Active">Active / Operational</option>
                  <option value="Backup">Backup / Standby Link</option>
                  <option value="Maintenance">Under Maintenance</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 block mb-1 font-semibold">Notes / Patch Panel Reference</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. PP-DC1-02 Port 14 via MTP trunk"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setConnModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer shadow-sm"
                >
                  Establish Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
