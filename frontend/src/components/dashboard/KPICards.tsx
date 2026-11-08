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
  totalAssets = 1248,
  companyOwned = 876,
  companyOwnedPct = 70.2,
  rentalLeased = 372,
  rentalLeasedPct = 29.8,
  activeContracts = 32,
  contractsExpiringSoon = 8,
  onCardClick,
}: KPICardsProps) {
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
          <div className="flex items-center text-[11px] font-semibold text-emerald-600 mt-1">
            <span>↑ +2% vs last month</span>
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
            {companyOwnedPct}% of inventory
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
            {rentalLeasedPct}% of inventory
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

