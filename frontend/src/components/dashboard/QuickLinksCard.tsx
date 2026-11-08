"use client";

import React from "react";
import { Zap, Share2, FileText, BarChart2, Download } from "lucide-react";

interface QuickLinksProps {
  onNavigate: (tab: string) => void;
  onExport: () => void;
}

export function QuickLinksCard({ onNavigate, onExport }: QuickLinksProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <Zap className="w-4 h-4 text-blue-600 fill-blue-600" />
        <h3 className="text-xs font-bold text-slate-800 tracking-tight">
          Quick Links
        </h3>
      </div>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        {/* Network Topology */}
        <button
          onClick={() => onNavigate("topology")}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50/70 hover:bg-blue-50/60 border border-slate-100 hover:border-blue-200 transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-100/70 text-blue-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
            <Share2 className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold text-slate-700 group-hover:text-blue-900 transition-colors text-center">
            Network Topology
          </span>
        </button>

        {/* Contract Management */}
        <button
          onClick={() => onNavigate("contracts")}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50/70 hover:bg-blue-50/60 border border-slate-100 hover:border-blue-200 transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-100/70 text-blue-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
            <FileText className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold text-slate-700 group-hover:text-blue-900 transition-colors text-center">
            Contract Management
          </span>
        </button>

        {/* Asset Report */}
        <button
          onClick={() => onNavigate("reports")}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50/70 hover:bg-blue-50/60 border border-slate-100 hover:border-blue-200 transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-100/70 text-blue-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
            <BarChart2 className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold text-slate-700 group-hover:text-blue-900 transition-colors text-center">
            Asset Report
          </span>
        </button>

        {/* Export Data */}
        <button
          onClick={onExport}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50/70 hover:bg-blue-50/60 border border-slate-100 hover:border-blue-200 transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-100/70 text-blue-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
            <Download className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold text-slate-700 group-hover:text-blue-900 transition-colors text-center">
            Export Data
          </span>
        </button>
      </div>
    </div>
  );
}

