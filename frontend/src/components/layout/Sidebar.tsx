"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Home,
  Server,
  FileText,
  Handshake,
  MapPin,
  Share2,
  Wrench,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Globe,
  Package,
  Network,
  X,
} from "lucide-react";
import { HKSkyline } from "../common/HKSkyline";

export type NavItem =
  | "dashboard"
  | "assets"
  | "contracts"
  | "vendors"
  | "locations"
  | "topology"
  | "ipam"
  | "b2b"
  | "maintenance"
  | "spares"
  | "reports"
  | "settings";

interface SidebarProps {
  currentTab: NavItem;
  onSelectTab: (tab: NavItem, subCategory?: string) => void;
  subCategory?: string;
  onSelectSubCategory?: (sub: string) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  currentTab,
  onSelectTab,
  subCategory = "all",
  onSelectSubCategory,
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const [assetsOpen, setAssetsOpen] = useState(true);
  const [contractsOpen, setContractsOpen] = useState(false);
  const [locationsOpen, setLocationsOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Automatically expand active module dropdown
  useEffect(() => {
    if (currentTab === "assets") setAssetsOpen(true);
    if (currentTab === "contracts") setContractsOpen(true);
    if (currentTab === "locations") setLocationsOpen(true);
    if (currentTab === "reports") setReportsOpen(true);
    if (currentTab === "settings") setSettingsOpen(true);
  }, [currentTab]);

  const handleSubClick = (tab: NavItem, subId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectTab(tab, subId);
    if (onSelectSubCategory) {
      onSelectSubCategory(subId);
    }
    if (onCloseMobile) onCloseMobile();
  };

  const handleNavClick = (tab: NavItem, subId?: string) => {
    onSelectTab(tab, subId);
    if (subId && onSelectSubCategory) {
      onSelectSubCategory(subId);
    }
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container: Fixed slide-over drawer on mobile (< lg), static vertical sidebar on desktop (>= lg) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0A192F] text-white flex flex-col justify-between shrink-0 select-none border-r border-slate-800 transition-transform duration-300 ease-in-out lg:static lg:w-56 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Top Header on Mobile with Close Button */}
        <div className="flex items-center justify-between px-4 pt-3.5 pb-2 lg:hidden border-b border-slate-800/80">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center font-bold text-xs text-white">
              P
            </div>
            <span className="text-xs font-bold text-slate-200 tracking-tight">
              Phillip Securities HK
            </span>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Navigation Section */}
        <div className="py-3 flex-1 overflow-y-auto no-scrollbar">
          <nav className="space-y-1 px-3">
            {/* 1. Dashboard */}
            <button
              onClick={() => handleNavClick("dashboard")}
              className={`w-full flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                currentTab === "dashboard"
                  ? "bg-[#1E60D5] text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Home className="w-4 h-4 mr-3 shrink-0" />
              <span>Dashboard</span>
            </button>

            {/* 2. Assets (Dropdown) */}
            <div>
              <div
                onClick={() => {
                  setAssetsOpen(true);
                  handleNavClick("assets", "all");
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  currentTab === "assets"
                    ? "bg-[#1E60D5] text-white shadow-sm"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <div className="flex items-center">
                  <Server className="w-4 h-4 mr-3 shrink-0" />
                  <span>Assets</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAssetsOpen(!assetsOpen);
                  }}
                  className="p-0.5 rounded hover:bg-white/20 transition-colors"
                >
                  {assetsOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                  )}
                </button>
              </div>
              {assetsOpen && (
                <div className="pl-7 pr-1 py-1 space-y-0.5 border-l border-slate-700/60 ml-4 my-1">
                  {[
                    { id: "all", label: "All Assets" },
                    { id: "devices", label: "Network Devices" },
                    { id: "categories", label: "Asset Categories" },
                    { id: "models", label: "Asset Models" },
                    { id: "ownership", label: "Asset Ownership" },
                  ].map((item) => {
                    const isActive = currentTab === "assets" && subCategory === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={(e) => handleSubClick("assets", item.id, e)}
                        className={`w-full text-left py-1.5 px-2 text-[11px] rounded transition-all cursor-pointer ${
                          isActive
                            ? "bg-blue-600/30 text-blue-300 font-bold border-l-2 border-blue-400 pl-1.5"
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Contracts (Dropdown) */}
            <div>
              <div
                onClick={() => {
                  setContractsOpen(true);
                  handleNavClick("contracts", "all");
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  currentTab === "contracts"
                    ? "bg-[#1E60D5] text-white shadow-sm"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-3 shrink-0" />
                  <span>Contracts</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setContractsOpen(!contractsOpen);
                  }}
                  className="p-0.5 rounded hover:bg-white/20 transition-colors"
                >
                  {contractsOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                  )}
                </button>
              </div>
              {contractsOpen && (
                <div className="pl-7 pr-1 py-1 space-y-0.5 border-l border-slate-700/60 ml-4 my-1">
                  {[
                    { id: "all", label: "All Contracts" },
                    { id: "rental", label: "Rental Agreements" },
                    { id: "maintenance", label: "Maintenance Contracts" },
                    { id: "support", label: "Support Contracts" },
                    { id: "expiring", label: "Contract Expiration" },
                  ].map((item) => {
                    const isActive = currentTab === "contracts" && subCategory === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={(e) => handleSubClick("contracts", item.id, e)}
                        className={`w-full text-left py-1.5 px-2 text-[11px] rounded transition-all cursor-pointer ${
                          isActive
                            ? "bg-blue-600/30 text-blue-300 font-bold border-l-2 border-blue-400 pl-1.5"
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 4. Vendors */}
            <button
              onClick={() => handleNavClick("vendors")}
              className={`w-full flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                currentTab === "vendors"
                  ? "bg-[#1E60D5] text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Handshake className="w-4 h-4 mr-3 shrink-0" />
              <span>Vendors</span>
            </button>

            {/* 5. Locations (Dropdown) */}
            <div>
              <div
                onClick={() => {
                  setLocationsOpen(true);
                  handleNavClick("locations", "sites");
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  currentTab === "locations"
                    ? "bg-[#1E60D5] text-white shadow-sm"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-3 shrink-0" />
                  <span>Locations</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLocationsOpen(!locationsOpen);
                  }}
                  className="p-0.5 rounded hover:bg-white/20 transition-colors"
                >
                  {locationsOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                  )}
                </button>
              </div>
              {locationsOpen && (
                <div className="pl-7 pr-1 py-1 space-y-0.5 border-l border-slate-700/60 ml-4 my-1">
                  {[
                    { id: "sites", label: "Sites" },
                    { id: "buildings", label: "Buildings" },
                    { id: "floors", label: "Floors" },
                    { id: "datacenters", label: "Data Centers" },
                    { id: "racks", label: "Racks" },
                  ].map((item) => {
                    const isActive = currentTab === "locations" && subCategory === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={(e) => handleSubClick("locations", item.id, e)}
                        className={`w-full text-left py-1.5 px-2 text-[11px] rounded transition-all cursor-pointer ${
                          isActive
                            ? "bg-blue-600/30 text-blue-300 font-bold border-l-2 border-blue-400 pl-1.5"
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 6. Network Topology */}
            <button
              onClick={() => handleNavClick("topology")}
              className={`w-full flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                currentTab === "topology"
                  ? "bg-[#1E60D5] text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Share2 className="w-4 h-4 mr-3 shrink-0" />
              <span>Network Topology</span>
            </button>

            {/* 7. IP Address Management */}
            <button
              onClick={() => handleNavClick("ipam")}
              className={`w-full flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                currentTab === "ipam"
                  ? "bg-[#1E60D5] text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Globe className="w-4 h-4 mr-3 shrink-0" />
              <span>IP Address Management</span>
            </button>

            {/* 8. B2B Connections */}
            <button
              onClick={() => handleNavClick("b2b")}
              className={`w-full flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                currentTab === "b2b"
                  ? "bg-[#1E60D5] text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Network className="w-4 h-4 mr-3 shrink-0" />
              <span>B2B Connections</span>
            </button>

            {/* 9. Maintenance */}
            <button
              onClick={() => handleNavClick("maintenance")}
              className={`w-full flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                currentTab === "maintenance"
                  ? "bg-[#1E60D5] text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Wrench className="w-4 h-4 mr-3 shrink-0" />
              <span>Maintenance</span>
            </button>

            {/* 9. Spare Parts & Inventory */}
            <button
              onClick={() => handleNavClick("spares")}
              className={`w-full flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                currentTab === "spares"
                  ? "bg-[#1E60D5] text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Package className="w-4 h-4 mr-3 shrink-0" />
              <span>Spare Parts & Inventory</span>
            </button>

            {/* 10. Reports (Dropdown) */}
            <div>
              <div
                onClick={() => {
                  setReportsOpen(true);
                  handleNavClick("reports", "asset_register");
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  currentTab === "reports"
                    ? "bg-[#1E60D5] text-white shadow-sm"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <div className="flex items-center">
                  <BarChart3 className="w-4 h-4 mr-3 shrink-0" />
                  <span>Reports</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setReportsOpen(!reportsOpen);
                  }}
                  className="p-0.5 rounded hover:bg-white/20 transition-colors"
                >
                  {reportsOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                  )}
                </button>
              </div>
              {reportsOpen && (
                <div className="pl-7 pr-1 py-1 space-y-0.5 border-l border-slate-700/60 ml-4 my-1">
                  {[
                    { id: "asset_register", label: "Asset Register" },
                    { id: "rental_report", label: "Rental Report" },
                    { id: "contract_register", label: "Contract Register" },
                    { id: "eol_eos_report", label: "EOL/EOS Report" },
                  ].map((item) => {
                    const isActive = currentTab === "reports" && subCategory === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={(e) => handleSubClick("reports", item.id, e)}
                        className={`w-full text-left py-1.5 px-2 text-[11px] rounded transition-all cursor-pointer ${
                          isActive
                            ? "bg-blue-600/30 text-blue-300 font-bold border-l-2 border-blue-400 pl-1.5"
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 11. Settings (Dropdown) */}
            <div>
              <div
                onClick={() => {
                  setSettingsOpen(true);
                  handleNavClick("settings", "users");
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  currentTab === "settings"
                    ? "bg-[#1E60D5] text-white shadow-sm"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <div className="flex items-center">
                  <Settings className="w-4 h-4 mr-3 shrink-0" />
                  <span>Settings</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSettingsOpen(!settingsOpen);
                  }}
                  className="p-0.5 rounded hover:bg-white/20 transition-colors"
                >
                  {settingsOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                  )}
                </button>
              </div>
              {settingsOpen && (
                <div className="pl-7 pr-1 py-1 space-y-0.5 border-l border-slate-700/60 ml-4 my-1">
                  {[
                    { id: "users", label: "User Management" },
                    { id: "roles", label: "Roles & Permissions" },
                    { id: "alerts", label: "Alert Automation & Rules" },
                    { id: "audit", label: "Audit Logs" },
                    { id: "system", label: "System Configuration" },
                  ].map((item) => {
                    const isActive = currentTab === "settings" && subCategory === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={(e) => handleSubClick("settings", item.id, e)}
                        className={`w-full text-left py-1.5 px-2 text-[11px] rounded transition-all cursor-pointer ${
                          isActive
                            ? "bg-blue-600/30 text-blue-300 font-bold border-l-2 border-blue-400 pl-1.5"
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Bottom Skyline Graphic & Version Badge */}
        <div className="relative pt-4 pb-4 px-4 overflow-hidden border-t border-slate-800/80 shrink-0 bg-[#071324]/80">
          {/* Hong Kong Skyline Graphic Image */}
          <div className="relative w-full h-20 mb-2 rounded-lg overflow-hidden border border-slate-800/60 bg-[#0A192F] group">
            <Image
              src="/hk_skyline_sidebar.png"
              alt="Hong Kong Central Financial District Skyline"
              fill
              className="object-cover object-bottom opacity-50 group-hover:opacity-80 transition-opacity"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A192F]/90 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-1 left-2 text-[9px] font-mono text-cyan-400/80 tracking-widest uppercase">
              Victoria Harbour HK
            </div>
          </div>
          <div className="text-[11px] font-bold text-slate-200 leading-tight">
            Phillip Securities (Hong Kong)
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center justify-between">
            <span>Network Asset Mgmt</span>
            <span className="text-emerald-400 font-bold">v1.0.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}
