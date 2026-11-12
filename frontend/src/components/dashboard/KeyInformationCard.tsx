"use client";

import React from "react";
import Image from "next/image";
import { Info, MapPin } from "lucide-react";

interface KeyInformationProps {
  activeContracts?: number;
  expiringSoon?: number;
  totalVendors?: number;
  totalSites?: number;
  onNavigate?: (tab: string, sub?: string) => void;
}

export function KeyInformationCard({
  activeContracts = 0,
  expiringSoon = 0,
  totalVendors = 0,
  totalSites = 0,
  onNavigate,
}: KeyInformationProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between overflow-hidden relative">
      <div>
        {/* Header */}
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
          <div className="p-1 rounded-md bg-blue-50 text-blue-600">
            <Info className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-slate-800 tracking-tight">
            Key Information
          </h3>
        </div>

        {/* Metrics List */}
        <div className="space-y-1 mt-2 text-xs">
          <div
            onClick={() => onNavigate && onNavigate("contracts", "all")}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group"
          >
            <span className="text-slate-600 font-medium group-hover:text-blue-600 transition-colors">
              Active Contracts
            </span>
            <span className="font-bold text-slate-900 font-mono">{activeContracts}</span>
          </div>

          <div
            onClick={() => onNavigate && onNavigate("contracts", "expiring")}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-amber-50/60 transition-colors cursor-pointer group"
          >
            <span className="text-slate-600 font-medium group-hover:text-amber-700 transition-colors">
              Expiring (≤ 90 days)
            </span>
            <span className="font-bold text-amber-600 font-mono">{expiringSoon}</span>
          </div>

          <div
            onClick={() => onNavigate && onNavigate("vendors")}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group"
          >
            <span className="text-slate-600 font-medium group-hover:text-blue-600 transition-colors">
              Total Vendors
            </span>
            <span className="font-bold text-slate-900 font-mono">{totalVendors}</span>
          </div>

          <div
            onClick={() => onNavigate && onNavigate("locations", "sites")}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group"
          >
            <span className="text-slate-600 font-medium group-hover:text-blue-600 transition-colors">
              Total Sites
            </span>
            <span className="font-bold text-slate-900 font-mono">{totalSites}</span>
          </div>
        </div>
      </div>

      {/* Corporate Hong Kong Harbour Panorama Photography */}
      <div className="mt-4 -mx-5 -mb-5 relative h-28 overflow-hidden rounded-b-2xl border-t border-slate-200/80 group">
        <Image
          src="/hk_harbour_panorama.jpg"
          alt="Victoria Harbour Hong Kong Panorama"
          fill
          className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />
        {/* Sleek Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A192F]/90 via-[#0A192F]/30 to-transparent" />
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white">
          <div className="flex items-center space-x-1.5">
            <MapPin className="w-3 h-3 text-cyan-400" />
            <span className="text-[10px] font-bold tracking-tight text-white/95 drop-shadow-xs">
              Victoria Harbour • Central HK
            </span>
          </div>
          <span className="text-[9px] font-mono text-cyan-300 font-semibold bg-white/10 px-1.5 py-0.5 rounded backdrop-blur-xs">
            NOC Primary
          </span>
        </div>
      </div>
    </div>
  );
}


