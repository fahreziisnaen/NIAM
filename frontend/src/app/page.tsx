"use client";

import React, { useState, useEffect, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { apiUrl } from "@/lib/api";
import { Sidebar, NavItem } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

// Dashboard Components
import { KPICards } from "@/components/dashboard/KPICards";
import { AssetDistributionChart } from "@/components/dashboard/AssetDistributionChart";
import { AttentionRequiredCard } from "@/components/dashboard/AttentionRequiredCard";
import { ContractTimelineChart } from "@/components/dashboard/ContractTimelineChart";
import { DeviceInventoryTable, DeviceItem } from "@/components/dashboard/DeviceInventoryTable";
import { QuickLinksCard } from "@/components/dashboard/QuickLinksCard";
import { KeyInformationCard } from "@/components/dashboard/KeyInformationCard";

// Modals
import { AssetDetailModal } from "@/components/assets/AssetDetailModal";
import { AssetFormModal } from "@/components/assets/AssetFormModal";
import { TwoFactorSetupModal } from "@/components/auth/TwoFactorSetupModal";

// Auth & Login
import { LoginView } from "@/components/auth/LoginView";

// Module Views
import { AssetsView } from "@/components/views/AssetsView";
import { ContractsView } from "@/components/views/ContractsView";
import { VendorsView } from "@/components/views/VendorsView";
import { LocationsView } from "@/components/views/LocationsView";
import { TopologyView } from "@/components/views/TopologyView";
import { IPAMView } from "@/components/views/IPAMView";
import { B2BConnectionsView } from "@/components/views/B2BConnectionsView";
import { MaintenanceView } from "@/components/views/MaintenanceView";
import { SparesView } from "@/components/views/SparesView";
import { ReportsView } from "@/components/views/ReportsView";
import { SettingsView } from "@/components/views/SettingsView";

export default function Home() {
  // Authentication & Session State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authToken, setAuthToken] = useState<string>("");
  const [twoFactorModalOpen, setTwoFactorModalOpen] = useState(false);

  // Navigation State
  const [currentTab, setCurrentTab] = useState<NavItem>("dashboard");
  const [subCategory, setSubCategory] = useState<string>("all");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dashboard Stats State
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("07 Nov 2025, 14:32");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Table State
  const [assets, setAssets] = useState<DeviceItem[]>([]);
  const [totalAssets, setTotalAssets] = useState(1248);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(6);
  const [tableSearch, setTableSearch] = useState("");
  const [tableLoading, setTableLoading] = useState(false);

  // Modal State
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [assetFormOpen, setAssetFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any>(null);

  // Initialize and verify user authentication
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("phillip_token");
      const storedUser = localStorage.getItem("phillip_user");

      if (token) {
        setAuthToken(token);
        if (storedUser) {
          try {
            setCurrentUser(JSON.parse(storedUser));
          } catch (e) {}
        }

        // Verify token with backend
        fetch(apiUrl("/api/v1/auth/me"), {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => {
            if (res.ok) return res.json();
            throw new Error("Session invalid");
          })
          .then((user) => {
            setCurrentUser(user);
            localStorage.setItem("phillip_user", JSON.stringify(user));
            setIsAuthenticated(true);
          })
          .catch(() => {
            // Invalid or expired token
            setIsAuthenticated(false);
          });
      } else {
        // No session stored -> prompt login
        setIsAuthenticated(false);
      }
    }
  }, []);

  const refreshUserProfile = useCallback(() => {
    const token = authToken || (typeof window !== "undefined" ? localStorage.getItem("phillip_token") : null);
    if (!token) return;
    fetch(apiUrl("/api/v1/auth/me"), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((user) => {
        if (user) {
          setCurrentUser(user);
          localStorage.setItem("phillip_user", JSON.stringify(user));
        }
      })
      .catch(() => {});
  }, [authToken]);

  // Fetch Dashboard Stats
  const fetchDashboardStats = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(apiUrl("/api/v1/dashboard/stats"));
      if (res.ok) {
        const data = await res.json();
        setDashboardStats(data);
        if (data.last_updated) {
          setLastUpdated(data.last_updated);
        }
      }
    } catch (e) {
      console.error("Could not fetch dashboard stats", e);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Fetch Assets for Table
  const fetchAssets = useCallback(async () => {
    setTableLoading(true);
    try {
      let endpoint = `/api/v1/assets?page=${currentPage}&page_size=${pageSize}`;
      if (tableSearch.trim()) {
        endpoint += `&search=${encodeURIComponent(tableSearch.trim())}`;
      }
      const res = await fetch(apiUrl(endpoint));
      if (res.ok) {
        const data = await res.json();
        const formatted: DeviceItem[] = data.items.map((item: any) => ({
          id: item.id,
          asset_id: item.asset_id,
          hostname: item.hostname,
          model: item.model_name || "Device",
          vendor: item.vendor_name || item.manufacturer,
          serial_number: item.serial_number,
          location: item.location_display || "HK-DC1 / Rack A1",
          status: item.operational_status,
          ownership: item.ownership_type,
        }));
        setAssets(formatted);
        setTotalAssets(data.total);
      }
    } catch (e) {
      console.error("Could not fetch assets", e);
    } finally {
      setTableLoading(false);
    }
  }, [currentPage, pageSize, tableSearch]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardStats();
      fetchAssets();
    }
  }, [isAuthenticated, fetchDashboardStats, fetchAssets]);

  const handleRefresh = () => {
    const now = new Date();
    const formatted = `${now.getDate().toString().padStart(2, "0")} Nov 2025, ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    setLastUpdated(formatted);
    fetchDashboardStats();
    fetchAssets();
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm(`Are you sure you want to delete asset ${assetId}?`)) return;
    try {
      const res = await fetch(apiUrl(`/api/v1/assets/${assetId}`), {
        method: "DELETE",
      });
      if (res.ok) {
        fetchAssets();
        fetchDashboardStats();
      } else {
        const data = await res.json();
        alert(data.detail || "Failed to delete asset");
      }
    } catch {
      alert("Error contacting API to delete asset");
    }
  };

  const handleExportData = () => {
    window.open(apiUrl("/api/v1/assets/export/csv"), "_blank");
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("phillip_token");
      localStorage.removeItem("phillip_user");
    }
    setAuthToken("");
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  // While determining session status
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#0A192F] flex flex-col items-center justify-center text-white space-y-3">
        <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
        <p className="text-xs text-slate-300 font-semibold tracking-wide">
          Connecting to Phillip Securities HK Asset Management Portal...
        </p>
      </div>
    );
  }

  // If not authenticated, render Login View
  if (!isAuthenticated) {
    return (
      <LoginView
        onLoginSuccess={(token, user) => {
          setAuthToken(token);
          setCurrentUser(user);
          setIsAuthenticated(true);
        }}
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans antialiased text-slate-900 select-none">
      {/* Dark Navy Sidebar (Desktop Sidebar & Mobile Drawer) */}
      <Sidebar
        currentTab={currentTab}
        subCategory={subCategory}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onSelectTab={(tab, sub) => {
          setCurrentTab(tab);
          if (sub) setSubCategory(sub);
          else setSubCategory("all");
        }}
        onSelectSubCategory={(sub) => setSubCategory(sub)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Top White Header */}
        <Header
          currentUser={currentUser}
          onRefreshUser={refreshUserProfile}
          onToggleMobileMenu={() => setMobileMenuOpen((open) => !open)}
          onSearch={(query) => {
            setTableSearch(query);
            if (currentTab !== "dashboard" && currentTab !== "assets") {
              setCurrentTab("assets");
            }
          }}
          onOpenTwoFactorSetup={() => setTwoFactorModalOpen(true)}
          onLogout={handleLogout}
          onNavigate={(tab, sub) => {
            setCurrentTab(tab as NavItem);
            if (sub) setSubCategory(sub);
            else setSubCategory("all");
          }}
        />

        {/* Dynamic Main Workspace */}
        <main className="flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6">
          {/* DASHBOARD MODULE */}
          {currentTab === "dashboard" && (
            <>
              {/* Dashboard Title & Real-time Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    Network Infrastructure Overview
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real-time asset status and key information
                  </p>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3 text-xs self-start sm:self-auto">
                  <div className="flex items-center space-x-1.5 text-slate-600 bg-white px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] sm:text-[11px]">Last Updated: {lastUpdated}</span>
                  </div>
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 shadow-sm transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* 4 KPI Cards */}
              <KPICards
                totalAssets={dashboardStats?.total_assets ?? 1248}
                companyOwned={dashboardStats?.company_owned ?? 876}
                rentalLeased={dashboardStats?.rental_leased ?? 372}
                activeContracts={dashboardStats?.active_contracts ?? 32}
                contractsExpiringSoon={dashboardStats?.contracts_expiring_soon ?? 8}
                onCardClick={(type) => {
                  if (type === "contracts") setCurrentTab("contracts");
                  else {
                    setCurrentTab("assets");
                    if (type === "company") setSubCategory("company");
                    else if (type === "rental") setSubCategory("rental");
                    else setSubCategory("all");
                  }
                }}
              />

              {/* Middle Row: 3 Visual Analysis Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AssetDistributionChart
                  totalAssets={dashboardStats?.total_assets ?? 1248}
                  distribution={dashboardStats?.device_distribution}
                  onCategoryClick={(category) => {
                    setCurrentTab("assets");
                    const catMap: Record<string, string> = {
                      "Switches": "Switch",
                      "Routers": "Router",
                      "Firewalls": "Firewall",
                      "Wireless": "Wireless",
                      "Others": "all",
                    };
                    setSubCategory(catMap[category] || "all");
                  }}
                />

                <AttentionRequiredCard
                  contractsExpiring={dashboardStats?.contracts_expiring_soon ?? 8}
                  warrantiesExpiring={dashboardStats?.warranties_expiring_soon ?? 14}
                  devicesUnderMaintenance={dashboardStats?.devices_under_maintenance ?? 6}
                  onViewAll={() => {
                    setCurrentTab("contracts");
                    setSubCategory("all");
                  }}
                  onContractsClick={() => {
                    setCurrentTab("contracts");
                    setSubCategory("expiring");
                  }}
                  onWarrantiesClick={() => {
                    setCurrentTab("contracts");
                    setSubCategory("support");
                  }}
                  onMaintenanceClick={() => {
                    setCurrentTab("maintenance");
                    setSubCategory("all");
                  }}
                />

                <ContractTimelineChart
                  timelineData={dashboardStats?.contract_timeline}
                  onViewCalendar={() => setCurrentTab("contracts")}
                />
              </div>

              {/* Bottom Row: 2/3 Data Table & 1/3 Quick Links / Key Information */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2/3: Device Inventory Table */}
                <div className="lg:col-span-2">
                  <DeviceInventoryTable
                    devices={assets}
                    totalCount={totalAssets}
                    currentPage={currentPage}
                    pageSize={pageSize}
                    onPageChange={(page) => setCurrentPage(page)}
                    onSearch={(q) => {
                      setTableSearch(q);
                      setCurrentPage(1);
                    }}
                    onFilterClick={() => setCurrentTab("assets")}
                    onAddAsset={() => {
                      setEditingAsset(null);
                      setAssetFormOpen(true);
                    }}
                    onViewAsset={(assetId) => setSelectedAssetId(assetId)}
                    onEditAsset={(asset) => {
                      setEditingAsset(asset);
                      setAssetFormOpen(true);
                    }}
                    onDeleteAsset={handleDeleteAsset}
                    isLoading={tableLoading}
                  />
                </div>

                {/* Right 1/3: Quick Links Card & Key Information Card */}
                <div className="space-y-4">
                  <QuickLinksCard
                    onNavigate={(tab) => setCurrentTab(tab as NavItem)}
                    onExport={handleExportData}
                  />

                  <KeyInformationCard
                    activeContracts={dashboardStats?.active_contracts ?? 32}
                    expiringSoon={dashboardStats?.contracts_expiring_soon ?? 8}
                    totalVendors={dashboardStats?.total_vendors ?? 14}
                    totalSites={dashboardStats?.total_locations ?? 6}
                    onNavigate={(tab, sub) => {
                      setCurrentTab(tab as NavItem);
                      if (sub) setSubCategory(sub);
                      else setSubCategory("all");
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {/* ASSETS MODULE */}
          {currentTab === "assets" && (
            <AssetsView
              subCategory={subCategory}
              onAddAsset={() => {
                setEditingAsset(null);
                setAssetFormOpen(true);
              }}
              onViewAsset={(assetId) => setSelectedAssetId(assetId)}
              onEditAsset={(asset) => {
                setEditingAsset(asset);
                setAssetFormOpen(true);
              }}
              onDeleteAsset={handleDeleteAsset}
            />
          )}

          {/* CONTRACTS MODULE */}
          {currentTab === "contracts" && (
            <ContractsView
              initialType={
                subCategory === "rental"
                  ? "Rental Agreement"
                  : subCategory === "maintenance"
                  ? "Maintenance Contract"
                  : subCategory === "support"
                  ? "Hardware Support Contract"
                  : ""
              }
              initialStatus={subCategory === "expiring" ? "Expiring Soon" : ""}
              onSelectAsset={(assetId) => setSelectedAssetId(assetId)}
            />
          )}

          {/* VENDORS MODULE */}
          {currentTab === "vendors" && <VendorsView />}

          {/* LOCATIONS MODULE */}
          {currentTab === "locations" && <LocationsView initialSub={subCategory} />}

          {/* TOPOLOGY MODULE */}
          {currentTab === "topology" && <TopologyView />}

          {/* IPAM MODULE */}
          {currentTab === "ipam" && <IPAMView />}

          {/* B2B CONNECTIONS MODULE */}
          {currentTab === "b2b" && <B2BConnectionsView />}

          {/* MAINTENANCE MODULE */}
          {currentTab === "maintenance" && <MaintenanceView />}

          {/* SPARES MODULE */}
          {currentTab === "spares" && <SparesView />}

          {/* REPORTS MODULE */}
          {currentTab === "reports" && (
            <ReportsView initialReport={subCategory && subCategory !== "all" ? subCategory : "asset_register"} />
          )}

          {/* SETTINGS MODULE */}
          {currentTab === "settings" && (
            <SettingsView
              initialTab={subCategory && subCategory !== "all" ? subCategory : "users"}
              currentUser={currentUser}
              onRefreshUser={refreshUserProfile}
            />
          )}
        </main>

        {/* Bottom Footer */}
        <Footer />
      </div>

      {/* Global Asset Detail Modal (7 Tabs) */}
      <AssetDetailModal
        assetId={selectedAssetId}
        onClose={() => setSelectedAssetId(null)}
        onEdit={(asset) => {
          setSelectedAssetId(null);
          setEditingAsset(asset);
          setAssetFormOpen(true);
        }}
      />

      {/* Global Add / Edit Asset Modal */}
      <AssetFormModal
        isOpen={assetFormOpen}
        onClose={() => setAssetFormOpen(false)}
        onSuccess={() => {
          fetchAssets();
          fetchDashboardStats();
        }}
        initialData={editingAsset}
      />

      {/* Two-Factor Authentication Setup Modal */}
      <TwoFactorSetupModal
        isOpen={twoFactorModalOpen}
        onClose={() => setTwoFactorModalOpen(false)}
        token={authToken || (typeof window !== "undefined" ? localStorage.getItem("phillip_token") || "" : "")}
        username={currentUser?.username || "admin"}
        onSuccess={refreshUserProfile}
      />
    </div>
  );
}
