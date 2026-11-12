"use client";

import React from "react";
import { Server, Building2, Handshake, FileText, ArrowUpRight } from "lucide-react";

interface KPICardsProps {
  totalAssets: number;
  companyOwned: number;
  companyOwnedPct?: number;
  rentalLeased: number;
  rentalLeasedPct?: number;
  activeContracts: number;
  contractsExpiringSoon: number;
  onCardClick?: (type: string) => void;
}

export function KPICards({
  totalAssets = 0,
  companyOwned = 0,
  companyOwnedPct,
  rentalLeased = 0,
  rentalLeasedPct,
  activeContracts = 0,
  contractsExpiringSoon = 0,
  onCardClick,
}: KPICardsProps) {
  const compPct = companyOwnedPct ?? (totalAssets > 0 ? Number(((companyOwned / totalAssets) * 100).toFixed(1)) : 0);
  const rentPct = rentalLeasedPct ?? (totalAssets > 0 ? Number(((rentalLeased / totalAssets) * 100).toFixed(1)) : 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. Total Assets */}
      <div
        onClick={() => onCardClick && onCardClick("all")}
        className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm hover:shadow transition-shadow flex items-center space-x-3 sm:space-x-4 cursor-pointer"
      >
        <div className="w-12 h-12 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
          <Server className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold text-slate-500 block">Total Assets</span>
          <div className="text-2xl font-bold text-slate-900 tracking-tight leading-tight mt-0.5">
            {totalAssets.toLocaleString()}
          </div>
          <div className="flex items-center text-[11px] font-semibold mt-1">
            {totalAssets > 0 ? (
              <span className="text-emerald-600">Active estate</span>
            ) : (
              <span className="text-slate-400 font-normal">No assets recorded</span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Company Owned */}
      <div
        onClick={() => onCardClick && onCardClick("company")}
        className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm hover:shadow transition-shadow flex items-center space-x-3 sm:space-x-4 cursor-pointer"
      >
        <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/20">
          <Building2 className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold text-slate-500 block">Company Owned</span>
          <div className="text-2xl font-bold text-slate-900 tracking-tight leading-tight mt-0.5">
            {companyOwned.toLocaleString()}
          </div>
          <div className="text-[11px] font-medium text-slate-500 mt-1">
            {compPct}% of inventory
          </div>
        </div>
      </div>

      {/* 3. Rental / Leased */}
      <div
        onClick={() => onCardClick && onCardClick("rental")}
        className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm hover:shadow transition-shadow flex items-center space-x-3 sm:space-x-4 cursor-pointer"
      >
        <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/20">
          <Handshake className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold text-slate-500 block">Rental / Leased</span>
          <div className="text-2xl font-bold text-slate-900 tracking-tight leading-tight mt-0.5">
            {rentalLeased.toLocaleString()}
          </div>
          <div className="text-[11px] font-medium text-slate-500 mt-1">
            {rentPct}% of inventory
          </div>
        </div>
      </div>

      {/* 4. Active Contracts */}
      <div
        onClick={() => onCardClick && onCardClick("contracts")}
        className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm hover:shadow transition-shadow flex items-center space-x-3 sm:space-x-4 cursor-pointer"
      >
        <div className="w-12 h-12 rounded-xl bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/20">
          <FileText className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold text-slate-500 block">Active Contracts</span>
          <div className="text-2xl font-bold text-slate-900 tracking-tight leading-tight mt-0.5">
            {activeContracts}
          </div>
          <div className="text-[11px] font-semibold text-amber-600 mt-1">
            Expiring soon: {contractsExpiringSoon}
          </div>
        </div>
      </div>
    </div>
  );
}

