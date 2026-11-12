"use client";

import React from "react";
import { Bell, Clock, ShieldAlert, Wrench, ArrowRight } from "lucide-react";

interface AttentionRequiredProps {
  contractsExpiring90d?: number;
  contractsExpiring?: number;
  warrantiesExpiring90d?: number;
  warrantiesExpiring?: number;
  devicesInMaintenance?: number;
  devicesUnderMaintenance?: number;
  onViewAll?: () => void;
  onSelectAction?: (actionId: string) => void;
  onContractsClick?: () => void;
  onWarrantiesClick?: () => void;
  onMaintenanceClick?: () => void;
}

export function AttentionRequiredCard({
  contractsExpiring90d,
  contractsExpiring,
  warrantiesExpiring90d,
  warrantiesExpiring,
  devicesInMaintenance,
  devicesUnderMaintenance,
  onViewAll,
  onSelectAction,
  onContractsClick,
  onWarrantiesClick,
  onMaintenanceClick,
}: AttentionRequiredProps) {
  const actualContracts = contractsExpiring ?? contractsExpiring90d ?? 0;
  const actualWarranties = warrantiesExpiring ?? warrantiesExpiring90d ?? 0;
  const actualMaintenance = devicesUnderMaintenance ?? devicesInMaintenance ?? 0;
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between h-[280px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded-md bg-red-50 text-red-600">
            <Bell className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-slate-800 tracking-tight">
            Attention Required
          </h3>
        </div>
        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1 transition-colors"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Alert Rows */}
      <div className="space-y-3 mt-3">
        {/* Row 1: Contracts expiring within 90 days */}
        <div
          onClick={() => {
            if (onContractsClick) onContractsClick();
            else if (onSelectAction) onSelectAction("contracts");
          }}
          className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 hover:bg-red-50/50 border border-slate-100 hover:border-red-200 transition-all cursor-pointer group"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-red-100/80 text-red-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-700 group-hover:text-red-900 transition-colors">
              Contracts expiring within 90 days
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white shadow-sm">
            {actualContracts}
          </span>
        </div>

        {/* Row 2: Warranties expiring within 90 days */}
        <div
          onClick={() => {
            if (onWarrantiesClick) onWarrantiesClick();
            else if (onSelectAction) onSelectAction("warranties");
          }}
          className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 hover:bg-amber-50/50 border border-slate-100 hover:border-amber-200 transition-all cursor-pointer group"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100/80 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-700 group-hover:text-amber-900 transition-colors">
              Warranties expiring within 90 days
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white shadow-sm">
            {actualWarranties}
          </span>
        </div>

        {/* Row 3: Devices under maintenance */}
        <div
          onClick={() => {
            if (onMaintenanceClick) onMaintenanceClick();
            else if (onSelectAction) onSelectAction("maintenance");
          }}
          className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 hover:bg-blue-50/50 border border-slate-100 hover:border-blue-200 transition-all cursor-pointer group"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Wrench className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-900 transition-colors">
              Devices under maintenance
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500 text-white shadow-sm">
            {actualMaintenance}
          </span>
        </div>
      </div>
    </div>
  );
}

