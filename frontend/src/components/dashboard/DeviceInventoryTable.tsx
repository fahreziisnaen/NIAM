"use client";

import React, { useState } from "react";
import {
  Server,
  Search,
  Filter,
  Plus,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  HardDrive,
} from "lucide-react";

export interface DeviceItem {
  id: number;
  asset_id: string;
  hostname: string;
  model: string;
  vendor: string;
  serial_number: string;
  location: string;
  status: string; // Deployed, In Maintenance
  ownership: string; // Company Owned, Rental
}

interface DeviceInventoryTableProps {
  assets?: DeviceItem[];
  devices?: DeviceItem[];
  totalAssets?: number;
  totalCount?: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSearch: (query: string) => void;
  onFilterClick?: () => void;
  onAddAsset?: () => void;
  onViewAsset?: (assetId: string) => void;
  onEditAsset?: (asset: DeviceItem) => void;
  onDeleteAsset?: (assetId: string) => void;
  isLoading?: boolean;
}

export function DeviceInventoryTable({
  assets,
  devices,
  totalAssets,
  totalCount,
  currentPage = 1,
  pageSize = 6,
  onPageChange,
  onSearch,
  onFilterClick,
  onAddAsset,
  onViewAsset,
  onEditAsset,
  onDeleteAsset,
  isLoading = false,
}: DeviceInventoryTableProps) {
  const displayAssets = devices || assets || [];
  const displayTotal = totalCount ?? totalAssets ?? 0;
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    onSearch(e.target.value);
  };

  const startIdx = displayTotal === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, displayTotal);
  const totalPages = Math.max(1, Math.ceil(displayTotal / pageSize));

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
      {/* Table Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
        <div className="flex items-center space-x-2">
          <Server className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold text-slate-800 tracking-tight">
            Network Device Inventory
          </h3>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Table Search */}
          <div className="relative flex-1 min-w-[130px] sm:w-56">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search devices..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Filter Dropdown Button */}
          <button
            onClick={onFilterClick}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Filter</span>
          </button>

          {/* Add Asset Button */}
          <button
            onClick={onAddAsset}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#1E60D5] hover:bg-blue-700 rounded-lg shadow-sm transition-all shadow-blue-500/20 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Asset</span>
          </button>
        </div>
      </div>

      {/* Modern Data Table */}
      <div className="overflow-x-auto min-h-[300px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50">
              <th className="py-2.5 px-3">Asset ID</th>
              <th className="py-2.5 px-3">Hostname</th>
              <th className="py-2.5 px-3">Model</th>
              <th className="py-2.5 px-3">Vendor</th>
              <th className="py-2.5 px-3">Serial Number</th>
              <th className="py-2.5 px-3">Location</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Ownership</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent mb-2" />
                  <div>Loading network devices...</div>
                </td>
              </tr>
            ) : displayAssets.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  No devices match your search or filter criteria.
                </td>
              </tr>
            ) : (
              displayAssets.map((item) => (
                <tr
                  key={item.asset_id}
                  onClick={() => onViewAsset && onViewAsset(item.asset_id)}
                  className="hover:bg-blue-50/50 transition-colors group cursor-pointer"
                >
                  {/* Asset ID with Device Icon */}
                  <td className="py-3 px-3 font-semibold text-blue-600 flex items-center space-x-2">
                    <div className="w-6 h-6 rounded bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                      <HardDrive className="w-3.5 h-3.5" />
                    </div>
                    <span className="group-hover:underline font-mono">{item.asset_id}</span>
                  </td>

                  {/* Hostname */}
                  <td className="py-3 px-3 font-medium text-slate-800">
                    <span className="group-hover:text-blue-700">{item.hostname}</span>
                  </td>

                  {/* Model */}
                  <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                    {item.model}
                  </td>

                  {/* Vendor */}
                  <td className="py-3 px-3 text-slate-700 font-medium">
                    {item.vendor}
                  </td>

                  {/* Serial Number */}
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                    {item.serial_number}
                  </td>

                  {/* Location */}
                  <td className="py-3 px-3 text-slate-600 text-[11px]">
                    {item.location}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3">
                    <div className="flex items-center space-x-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          item.status === "Deployed"
                            ? "bg-emerald-500"
                            : item.status === "In Maintenance"
                            ? "bg-blue-500"
                            : "bg-slate-400"
                        }`}
                      />
                      <span
                        className={`text-[11px] font-medium ${
                          item.status === "Deployed"
                            ? "text-emerald-700"
                            : item.status === "In Maintenance"
                            ? "text-blue-700"
                            : "text-slate-600"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </td>

                  {/* Ownership Pill */}
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        item.ownership?.includes("Company")
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {item.ownership?.includes("Company") ? "Company" : "Rental"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end space-x-2 text-slate-400">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onViewAsset) onViewAsset(item.asset_id);
                        }}
                        className="p-1 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="View Asset Profile (7 Tabs)"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onEditAsset) onEditAsset(item);
                        }}
                        className="p-1 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                        title="Edit Asset"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onDeleteAsset) onDeleteAsset(item.asset_id);
                        }}
                        className="p-1 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Decommission Asset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs text-slate-500">
        <div>
          Showing {startIdx}-{endIdx} of {displayTotal.toLocaleString()} assets
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
            className="w-7 h-7 rounded border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`w-7 h-7 rounded text-xs font-semibold flex items-center justify-center transition-colors ${
                currentPage === pageNum
                  ? "bg-[#1E60D5] text-white"
                  : "border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {pageNum}
            </button>
          ))}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={endIdx >= displayTotal}
            className="w-7 h-7 rounded border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

