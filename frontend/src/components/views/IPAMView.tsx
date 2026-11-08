"use client";

import React, { useState, useEffect } from "react";
import { Globe, Search, Plus, Filter, CheckCircle2, ShieldAlert, AlertCircle } from "lucide-react";
import { apiUrl } from "@/lib/api";

export function IPAMView() {
  const [vlans, setVlans] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedSubnet, setSelectedSubnet] = useState("10.200.100.0/24");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  // Assignment Modal
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignIp, setAssignIp] = useState("");
  const [assignAssetId, setAssignAssetId] = useState(1);
  const [assignError, setAssignError] = useState<string | null>(null);

  useEffect(() => {
    fetch(apiUrl("/api/v1/ipam/vlans"))
      .then((res) => res.json())
      .then((data) => setVlans(data))
      .catch(() => {});
  }, []);

  const loadAddresses = () => {
    setLoading(true);
    let endpoint = `/api/v1/ipam/addresses?subnet=${encodeURIComponent(selectedSubnet)}`;
    if (statusFilter) endpoint += `&status=${encodeURIComponent(statusFilter)}`;
    if (search) endpoint += `&search=${encodeURIComponent(search)}`;

    fetch(apiUrl(endpoint))
      .then((res) => res.json())
      .then((data) => {
        setAddresses(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadAddresses();
  }, [selectedSubnet, statusFilter, search]);

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignError(null);
    try {
      const res = await fetch(apiUrl(`/api/v1/ipam/assign?ip_address=${encodeURIComponent(assignIp)}&asset_id=${assignAssetId}`), {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Assignment failed");
      }
      setAssignOpen(false);
      setAssignIp("");
      loadAddresses();
    } catch (err: any) {
      setAssignError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            IP Address Management (IPAM) & Subnet Planner
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Centrally manage IPv4/IPv6 address allocations, VLAN tagging, DMZ subnets, and exchange gateway IP assignments.
          </p>
        </div>

        <button
          onClick={() => {
            setAssignIp(`10.200.100.${Math.floor(Math.random() * 50) + 50}`);
            setAssignOpen(true);
          }}
          className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1E60D5] hover:bg-blue-700 rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Assign IP Address</span>
        </button>
      </div>

      {/* VLAN Cards Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {vlans.map((v) => (
          <button
            key={v.id}
            onClick={() => setSelectedSubnet(v.subnet)}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              selectedSubnet === v.subnet
                ? "bg-white border-blue-600 ring-2 ring-blue-500/20 shadow-md"
                : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
            }`}
          >
            <span className="text-[10px] font-bold font-mono text-blue-600 uppercase">
              VLAN {v.vlan_id}
            </span>
            <h4 className="text-xs font-bold text-slate-900 mt-0.5 truncate">{v.name}</h4>
            <span className="text-[11px] font-mono text-slate-500 block mt-1">{v.subnet}</span>
          </button>
        ))}
      </div>

      {/* IP Table Container */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search IP, hostname, MAC..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="">All Statuses</option>
              <option value="Assigned">Assigned</option>
              <option value="Available">Available</option>
              <option value="Reserved">Reserved</option>
            </select>
          </div>
        </div>

        {/* IP Addresses Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50">
                <th className="py-2.5 px-3">IP Address</th>
                <th className="py-2.5 px-3">Subnet</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Assigned Hostname</th>
                <th className="py-2.5 px-3">MAC Address</th>
                <th className="py-2.5 px-3">Interface</th>
                <th className="py-2.5 px-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                    Loading IP records...
                  </td>
                </tr>
              ) : addresses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                    No IP addresses found in this subnet.
                  </td>
                </tr>
              ) : (
                addresses.map((ip) => (
                  <tr key={ip.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{ip.ip_address}</td>
                    <td className="py-2.5 px-3 text-slate-500 font-sans text-[11px]">{ip.subnet}</td>
                    <td className="py-2.5 px-3 font-sans">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ip.status === "Assigned"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : ip.status === "Available"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {ip.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-800">
                      {ip.hostname || "—"}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                      {ip.mac_address || "—"}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 font-sans text-[11px]">
                      {ip.interface_name || "—"}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 font-sans text-[11px]">
                      {ip.description || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign IP Modal */}
      {assignOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center">
              <Globe className="w-4 h-4 mr-2 text-blue-600" />
              Assign IP Address
            </h3>

            {assignError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{assignError}</span>
              </div>
            )}

            <form onSubmit={handleAssignSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 block mb-1 font-semibold">IP Address to Assign *</label>
                <input
                  type="text"
                  value={assignIp}
                  onChange={(e) => setAssignIp(e.target.value)}
                  placeholder="e.g. 10.200.100.88"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1 font-semibold">Target Asset *</label>
                <select
                  value={assignAssetId}
                  onChange={(e) => setAssignAssetId(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value={1}>FW-01-HK (NA-000123) - Palo Alto PA-3220</option>
                  <option value={2}>SW-01-HK (NA-000124) - Cisco C9300-48P</option>
                  <option value={3}>RT-01-HK (NA-000125) - Cisco ISR4431</option>
                  <option value={4}>AP-01-HK (NA-000126) - Cisco C9130AXI</option>
                  <option value={5}>SW-02-HK (NA-000127) - Huawei S5735</option>
                  <option value={6}>FW-02-HK (NA-000128) - FortiGate 100F</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAssignOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Confirm Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

