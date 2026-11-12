"use client";

import React, { useState, useEffect } from "react";
import { apiUrl } from "@/lib/api";
import {
  Server,
  Filter,
  Plus,
  Layers,
  HardDrive,
  Building2,
  Handshake,
  Download,
  Calendar,
  AlertTriangle,
  FileSpreadsheet,
} from "lucide-react";
import { DeviceInventoryTable, DeviceItem } from "../dashboard/DeviceInventoryTable";

interface AssetsViewProps {
  subCategory: string; // 'all' | 'devices' | 'categories' | 'models' | 'ownership'
  onAddAsset: () => void;
  onViewAsset: (assetId: string) => void;
  onEditAsset: (asset: DeviceItem) => void;
  onDeleteAsset: (assetId: string) => void;
}

export function AssetsView({
  subCategory = "all",
  onAddAsset,
  onViewAsset,
  onEditAsset,
  onDeleteAsset,
}: AssetsViewProps) {
  const [assets, setAssets] = useState<DeviceItem[]>([]);
  const [totalAssets, setTotalAssets] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [hardwareModels, setHardwareModels] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("");
  const [ownershipFilter, setOwnershipFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  useEffect(() => {
    fetch(apiUrl("/api/v1/dashboard/stats"))
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(() => {});

    fetch(apiUrl("/api/v1/assets/models"))
      .then((res) => res.json())
      .then((data) => setHardwareModels(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // Sync subCategory to filters
  useEffect(() => {
    if (subCategory === "devices") {
      setCategoryFilter("");
      setOwnershipFilter("");
      setStatusFilter("Deployed");
    } else if (subCategory === "ownership") {
      setOwnershipFilter("Rental");
      setStatusFilter("");
      setCategoryFilter("");
    } else {
      setCategoryFilter("");
      setOwnershipFilter("");
      setStatusFilter("");
    }
    setCurrentPage(1);
  }, [subCategory]);

  const fetchAssets = () => {
    setLoading(true);
    let endpoint = `/api/v1/assets?page=${currentPage}&page_size=${pageSize}`;
    if (search) endpoint += `&search=${encodeURIComponent(search)}`;
    if (categoryFilter) endpoint += `&category=${encodeURIComponent(categoryFilter)}`;
    if (ownershipFilter) endpoint += `&ownership=${encodeURIComponent(ownershipFilter)}`;
    if (statusFilter) endpoint += `&status=${encodeURIComponent(statusFilter)}`;

    fetch(apiUrl(endpoint))
      .then((res) => res.json())
      .then((data) => {
        const formatted: DeviceItem[] = data.items.map((item: any) => ({
          id: item.id,
          asset_id: item.asset_id,
          hostname: item.hostname,
          model: item.model_name || "—",
          vendor: item.vendor_name || item.manufacturer || "—",
          serial_number: item.serial_number,
          location: item.location_display || "—",
          status: item.operational_status,
          ownership: item.ownership_type,
        }));
        setAssets(formatted);
        setTotalAssets(data.total);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchAssets();
  }, [currentPage, pageSize, search, categoryFilter, ownershipFilter, statusFilter]);

  const handleExportExcel = () => {
    window.open(apiUrl("/api/v1/assets/export/excel"), "_blank");
  };

  const handleExportCsv = () => {
    window.open(apiUrl("/api/v1/assets/export/csv"), "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {subCategory === "categories"
              ? "Asset Category Architecture"
              : subCategory === "models"
              ? "Hardware Model Catalog & Lifecycle"
              : subCategory === "ownership"
              ? "Asset Ownership & Rental Equipment Register"
              : subCategory === "devices"
              ? "Active Network Devices Inventory"
              : "Complete Network Asset Inventory"}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {subCategory === "ownership"
              ? "Manage leased appliances, monthly recurring rental costs, vendor return dates, and capitalization."
              : "Comprehensive inventory tracking serial numbers, firmware versions, VLANs, and physical rack U-positions."}
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onAddAsset}
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1E60D5] hover:bg-blue-700 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Asset</span>
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: CATEGORIES OVERVIEW CARDS */}
      {subCategory === "categories" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {(stats?.asset_distribution && stats.asset_distribution.length > 0) ? (
            stats.asset_distribution.map((cat: any) => (
              <div
                key={cat.name}
                onClick={() => {
                  setCategoryFilter(cat.name.replace(/es$|s$/, ""));
                }}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color || "#2563EB" }} />
                  <span className="text-xs font-bold text-slate-500">{cat.percentage}%</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-2">{cat.name}</h3>
                <div className="text-xl font-bold text-slate-900 mt-1">{cat.value}</div>
                <p className="text-[11px] text-slate-400 mt-1">Hardware asset inventory</p>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white p-8 rounded-xl border border-slate-200 text-center">
              <Server className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No categorized assets recorded</p>
              <p className="text-xs text-slate-400 mt-1">Add assets with category assignment to populate hardware analytics</p>
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 2: HARDWARE MODELS CATALOG */}
      {subCategory === "models" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {hardwareModels.length > 0 ? (
            hardwareModels.map((m) => (
              <div key={m.id || m.model} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-600">{m.mfg}</span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                    {m.u || 1}U • {m.ports || 0} Ports
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">{m.model}</h3>
                <p className="text-[11px] text-slate-500 line-clamp-2">{m.desc || "Hardware model specification"}</p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                  <span>End-of-Life:</span>
                  <span className="font-semibold text-slate-800">{m.eol || "—"}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white p-8 rounded-xl border border-slate-200 text-center">
              <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No hardware models catalogued</p>
              <p className="text-xs text-slate-400 mt-1">Register models in the database to display hardware specifications</p>
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 3: OWNERSHIP & RENTAL BREAKDOWN CARDS */}
      {subCategory === "ownership" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium">Company Owned Assets</span>
              <div className="text-2xl font-bold text-slate-900">{stats?.company_owned ?? 0}</div>
              <span className="text-[11px] text-slate-400">{stats?.company_owned_pct ?? 0}% of inventory • Capitalized</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Handshake className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium">Rental / Leased Units</span>
              <div className="text-2xl font-bold text-amber-600">{stats?.rental_leased ?? 0}</div>
              <span className="text-[11px] text-slate-400">{stats?.rental_leased_pct ?? 0}% of inventory • HKT & Telco</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium">Monthly Rental Commitment</span>
              <div className="text-2xl font-bold text-slate-900">
                HKD {((stats?.rental_leased ?? 0) * 4500).toLocaleString()}
              </div>
              <span className="text-[11px] text-emerald-600 font-medium">
                {(stats?.rental_leased ?? 0) > 0 ? "Average HKD 4,500 / month / unit" : "0 rental units active"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* INLINE FILTER PANEL */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center space-x-1.5 font-semibold text-slate-700 mr-2">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Filters:</span>
        </div>

        {/* Category */}
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
        >
          <option value="">All Categories</option>
          <option value="Switch">Switches</option>
          <option value="Router">Routers</option>
          <option value="Firewall">Firewalls</option>
          <option value="Wireless">Wireless APs</option>
          <option value="Others">Others</option>
        </select>

        {/* Ownership */}
        <select
          value={ownershipFilter}
          onChange={(e) => {
            setOwnershipFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
        >
          <option value="">All Ownership Types</option>
          <option value="Company Owned">Company Owned</option>
          <option value="Rental">Rental</option>
          <option value="Leased">Leased</option>
        </select>

        {/* Status */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
        >
          <option value="">All Statuses</option>
          <option value="Deployed">Deployed</option>
          <option value="In Maintenance">In Maintenance</option>
          <option value="In Stock">In Stock</option>
        </select>

        {/* Reset button if any filter active */}
        {(categoryFilter || ownershipFilter || statusFilter || search) && (
          <button
            onClick={() => {
              setCategoryFilter("");
              setOwnershipFilter("");
              setStatusFilter("");
              setSearch("");
              setCurrentPage(1);
            }}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 ml-auto"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* MASTER DATA TABLE */}
      <DeviceInventoryTable
        assets={assets}
        totalAssets={totalAssets}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={(p) => setCurrentPage(p)}
        onSearch={(q) => {
          setSearch(q);
          setCurrentPage(1);
        }}
        onAddAsset={onAddAsset}
        onViewAsset={onViewAsset}
        onEditAsset={onEditAsset}
        onDeleteAsset={onDeleteAsset}
        isLoading={loading}
      />
    </div>
  );
}

