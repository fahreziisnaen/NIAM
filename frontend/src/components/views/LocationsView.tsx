"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin,
  Server,
  Building as BuildingIcon,
  Layers,
  Eye,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ShieldCheck,
  Search,
  Filter,
  X,
  ChevronRight,
  RefreshCw,
  HardDrive,
  Phone,
  Mail,
  ArrowUpRight,
  Box,
  Shield,
  ExternalLink
} from "lucide-react";
import { apiUrl } from "@/lib/api";
import { SearchableSelect } from "@/components/common/SearchableSelect";

interface LocationsViewProps {
  initialSub?: string;
  onSelectAsset?: (assetId: string) => void;
}

export function LocationsView({ initialSub = "sites", onSelectAsset }: LocationsViewProps) {
  // Active Tab
  const [activeTab, setActiveTab] = useState<string>("sites");

  // Data lists
  const [locations, setLocations] = useState<any[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [racks, setRacks] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Elevation state
  const [selectedElevationRackId, setSelectedElevationRackId] = useState<number | null>(null);
  const [elevationData, setElevationData] = useState<any>(null);
  const [elevationLoading, setElevationLoading] = useState<boolean>(false);
  const [selectedUnitItem, setSelectedUnitItem] = useState<any>(null);

  // Modals state
  const [siteModalOpen, setSiteModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<any>(null);

  const [buildingModalOpen, setBuildingModalOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<any>(null);

  const [floorModalOpen, setFloorModalOpen] = useState(false);
  const [editingFloor, setEditingFloor] = useState<any>(null);

  const [rackModalOpen, setRackModalOpen] = useState(false);
  const [editingRack, setEditingRack] = useState<any>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: string; id: number; name: string } | null>(null);

  // Interactive Detail Modals State
  const [detailSiteModalOpen, setDetailSiteModalOpen] = useState(false);
  const [selectedSiteDetail, setSelectedSiteDetail] = useState<any>(null);
  const [siteAssets, setSiteAssets] = useState<any[]>([]);
  const [siteDetailLoading, setSiteDetailLoading] = useState(false);
  const [siteDetailTab, setSiteDetailTab] = useState<"overview" | "buildings" | "racks" | "assets">("overview");
  const [siteAssetSearch, setSiteAssetSearch] = useState("");

  const [detailBuildingModalOpen, setDetailBuildingModalOpen] = useState(false);
  const [selectedBuildingDetail, setSelectedBuildingDetail] = useState<any>(null);
  const [buildingAssets, setBuildingAssets] = useState<any[]>([]);
  const [buildingDetailLoading, setBuildingDetailLoading] = useState(false);
  const [buildingDetailTab, setBuildingDetailTab] = useState<"overview" | "floors" | "racks" | "assets">("overview");
  const [buildingAssetSearch, setBuildingAssetSearch] = useState("");

  const [detailRackModalOpen, setDetailRackModalOpen] = useState(false);
  const [selectedRackDetail, setSelectedRackDetail] = useState<any>(null);
  const [rackAssets, setRackAssets] = useState<any[]>([]);
  const [rackDetailLoading, setRackDetailLoading] = useState(false);
  const [rackDetailTab, setRackDetailTab] = useState<"overview" | "assets">("overview");
  const [rackAssetSearch, setRackAssetSearch] = useState("");

  // Form inputs
  const [siteForm, setSiteForm] = useState({
    code: "",
    name: "",
    type: "Data Center",
    country: "Hong Kong",
    city: "Hong Kong",
    address: "",
    contact_person: "",
    contact_phone: "",
    contact_email: "",
  });

  const [buildingForm, setBuildingForm] = useState({
    code: "",
    name: "",
    location_id: 1,
    address: "",
  });

  const [floorForm, setFloorForm] = useState({
    floor_number: "",
    floor_name: "",
    building_id: 1,
  });

  const [rackForm, setRackForm] = useState({
    rack_name: "",
    rack_number: "",
    floor_id: 1,
    room: "",
    total_u: 42,
    power_feed: "",
    max_power_kw: "",
  });

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const getAuthToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("phillip_token") || "";
    }
    return "";
  };

  const getAuthHeaders = () => {
    const token = getAuthToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  };

  // Sync initialSub with activeTab
  useEffect(() => {
    if (initialSub) {
      if (initialSub === "sites" || initialSub === "buildings" || initialSub === "floors" || initialSub === "datacenters" || initialSub === "racks") {
        setActiveTab(initialSub);
      }
    }
  }, [initialSub]);

  // Master Data Refresh
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [locRes, bldRes, flrRes, rckRes] = await Promise.all([
        fetch(apiUrl("/api/v1/locations")),
        fetch(apiUrl("/api/v1/locations/buildings/all")),
        fetch(apiUrl("/api/v1/locations/floors/all")),
        fetch(apiUrl("/api/v1/locations/racks")),
      ]);

      const locs = await locRes.json();
      const blds = await bldRes.json();
      const flrs = await flrRes.json();
      const rcks = await rckRes.json();

      setLocations(Array.isArray(locs) ? locs : []);
      setBuildings(Array.isArray(blds) ? blds : []);
      setFloors(Array.isArray(flrs) ? flrs : []);
      setRacks(Array.isArray(rcks) ? rcks : []);

      if (Array.isArray(rcks) && rcks.length > 0 && !selectedElevationRackId) {
        setSelectedElevationRackId(rcks[0].id);
      }
    } catch (e) {
      console.error("Error loading location infrastructure data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Load Rack Elevation when selected
  useEffect(() => {
    if (selectedElevationRackId && activeTab === "elevation") {
      setElevationLoading(true);
      fetch(apiUrl(`/api/v1/locations/racks/${selectedElevationRackId}/elevation`))
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load elevation");
          return res.json();
        })
        .then((data) => {
          setElevationData(data);
          setElevationLoading(false);
        })
        .catch(() => setElevationLoading(false));
    }
  }, [selectedElevationRackId, activeTab]);

  // Show Toast
  const notifySuccess = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3500);
  };
  const notifyError = (msg: string) => {
    setActionError(msg);
    setTimeout(() => setActionError(null), 5000);
  };

  // ============================================================================
  // Interactive Detail Modal Openers
  // ============================================================================
  const openSiteDetail = async (site: any, tab: "overview" | "buildings" | "racks" | "assets" = "overview") => {
    setSelectedSiteDetail(site);
    setSiteDetailTab(tab);
    setDetailSiteModalOpen(true);
    setSiteDetailLoading(true);
    setSiteAssetSearch("");
    try {
      const [locRes, astRes] = await Promise.all([
        fetch(apiUrl(`/api/v1/locations/${site.id}`)),
        fetch(apiUrl(`/api/v1/locations/${site.id}/assets`))
      ]);
      if (locRes.ok) {
        const locData = await locRes.json();
        setSelectedSiteDetail(locData);
      }
      if (astRes.ok) {
        const astData = await astRes.json();
        setSiteAssets(Array.isArray(astData) ? astData : []);
      } else {
        setSiteAssets([]);
      }
    } catch {
      setSiteAssets([]);
    } finally {
      setSiteDetailLoading(false);
    }
  };

  const openBuildingDetail = async (bldg: any, tab: "overview" | "floors" | "racks" | "assets" = "overview") => {
    setSelectedBuildingDetail(bldg);
    setBuildingDetailTab(tab);
    setDetailBuildingModalOpen(true);
    setBuildingDetailLoading(true);
    setBuildingAssetSearch("");
    try {
      const [bldRes, astRes] = await Promise.all([
        fetch(apiUrl(`/api/v1/locations/buildings/${bldg.id}`)),
        fetch(apiUrl(`/api/v1/locations/buildings/${bldg.id}/assets`))
      ]);
      if (bldRes.ok) {
        const bldData = await bldRes.json();
        setSelectedBuildingDetail(bldData);
      }
      if (astRes.ok) {
        const astData = await astRes.json();
        setBuildingAssets(Array.isArray(astData) ? astData : []);
      } else {
        setBuildingAssets([]);
      }
    } catch {
      setBuildingAssets([]);
    } finally {
      setBuildingDetailLoading(false);
    }
  };

  const openRackDetail = async (rack: any, tab: "overview" | "assets" = "overview") => {
    setSelectedRackDetail(rack);
    setRackDetailTab(tab);
    setDetailRackModalOpen(true);
    setRackDetailLoading(true);
    setRackAssetSearch("");
    try {
      const [rckRes, astRes] = await Promise.all([
        fetch(apiUrl(`/api/v1/locations/racks/${rack.id}`)),
        fetch(apiUrl(`/api/v1/locations/racks/${rack.id}/assets`))
      ]);
      if (rckRes.ok) {
        const rckData = await rckRes.json();
        setSelectedRackDetail(rckData);
      }
      if (astRes.ok) {
        const astData = await astRes.json();
        setRackAssets(Array.isArray(astData) ? astData : []);
      } else {
        setRackAssets([]);
      }
    } catch {
      setRackAssets([]);
    } finally {
      setRackDetailLoading(false);
    }
  };

  // ============================================================================
  // Site CRUD Handlers
  // ============================================================================
  const openAddSite = () => {
    setEditingSite(null);
    setSiteForm({
      code: "",
      name: "",
      type: activeTab === "datacenters" ? "Data Center" : "Headquarters",
      country: "Hong Kong",
      city: "Hong Kong",
      address: "",
      contact_person: "",
      contact_phone: "",
      contact_email: "",
    });
    setSiteModalOpen(true);
  };

  const openEditSite = (loc: any) => {
    setEditingSite(loc);
    setSiteForm({
      code: loc.code,
      name: loc.name,
      type: loc.type,
      country: loc.country || "Hong Kong",
      city: loc.city || "Hong Kong",
      address: loc.address || "",
      contact_person: loc.contact_person || "",
      contact_phone: loc.contact_phone || "",
      contact_email: loc.contact_email || "",
    });
    setSiteModalOpen(true);
  };

  const handleSaveSite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingSite
        ? apiUrl(`/api/v1/locations/${editingSite.id}`)
        : apiUrl("/api/v1/locations");
      const method = editingSite ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(siteForm),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to save location");
      }

      setSiteModalOpen(false);
      notifySuccess(`Location ${editingSite ? "updated" : "created"} successfully!`);
      loadAllData();
    } catch (err: any) {
      notifyError(err.message);
    }
  };

  // ============================================================================
  // Building CRUD Handlers
  // ============================================================================
  const openAddBuilding = () => {
    setEditingBuilding(null);
    setBuildingForm({
      code: "",
      name: "",
      location_id: locations.length > 0 ? locations[0].id : 1,
      address: "",
    });
    setBuildingModalOpen(true);
  };

  const openEditBuilding = (bld: any) => {
    setEditingBuilding(bld);
    setBuildingForm({
      code: bld.code,
      name: bld.name,
      location_id: bld.location_id,
      address: bld.address || "",
    });
    setBuildingModalOpen(true);
  };

  const handleSaveBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingBuilding
        ? apiUrl(`/api/v1/locations/buildings/${editingBuilding.id}`)
        : apiUrl("/api/v1/locations/buildings");
      const method = editingBuilding ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(buildingForm),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to save building");
      }

      setBuildingModalOpen(false);
      notifySuccess(`Building ${editingBuilding ? "updated" : "created"} successfully!`);
      loadAllData();
    } catch (err: any) {
      notifyError(err.message);
    }
  };

  // ============================================================================
  // Floor CRUD Handlers
  // ============================================================================
  const openAddFloor = () => {
    setEditingFloor(null);
    setFloorForm({
      floor_number: "",
      floor_name: "",
      building_id: buildings.length > 0 ? buildings[0].id : 1,
    });
    setFloorModalOpen(true);
  };

  const openEditFloor = (flr: any) => {
    setEditingFloor(flr);
    setFloorForm({
      floor_number: flr.floor_number,
      floor_name: flr.floor_name || "",
      building_id: flr.building_id,
    });
    setFloorModalOpen(true);
  };

  const handleSaveFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingFloor
        ? apiUrl(`/api/v1/locations/floors/${editingFloor.id}`)
        : apiUrl("/api/v1/locations/floors");
      const method = editingFloor ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(floorForm),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to save floor");
      }

      setFloorModalOpen(false);
      notifySuccess(`Floor ${editingFloor ? "updated" : "created"} successfully!`);
      loadAllData();
    } catch (err: any) {
      notifyError(err.message);
    }
  };

  // ============================================================================
  // Rack CRUD Handlers
  // ============================================================================
  const openAddRack = () => {
    setEditingRack(null);
    setRackForm({
      rack_name: "",
      rack_number: "",
      floor_id: floors.length > 0 ? floors[0].id : 1,
      room: "",
      total_u: 42,
      power_feed: "",
      max_power_kw: "",
    });
    setRackModalOpen(true);
  };

  const openEditRack = (r: any) => {
    setEditingRack(r);
    setRackForm({
      rack_name: r.rack_name,
      rack_number: r.rack_number,
      floor_id: r.floor_id,
      room: r.room || "",
      total_u: r.total_u || 42,
      power_feed: r.power_feed || "",
      max_power_kw: r.max_power_kw || "",
    });
    setRackModalOpen(true);
  };

  const handleSaveRack = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingRack
        ? apiUrl(`/api/v1/locations/racks/${editingRack.id}`)
        : apiUrl("/api/v1/locations/racks");
      const method = editingRack ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(rackForm),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to save rack");
      }

      setRackModalOpen(false);
      notifySuccess(`Rack ${editingRack ? "updated" : "created"} successfully!`);
      loadAllData();
    } catch (err: any) {
      notifyError(err.message);
    }
  };

  // ============================================================================
  // Delete Confirmation Handler
  // ============================================================================
  const confirmDelete = (type: "site" | "building" | "floor" | "rack", id: number, name: string) => {
    setItemToDelete({ type, id, name });
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    try {
      let endpoint = "";
      if (itemToDelete.type === "site") endpoint = `/api/v1/locations/${itemToDelete.id}`;
      else if (itemToDelete.type === "building") endpoint = `/api/v1/locations/buildings/${itemToDelete.id}`;
      else if (itemToDelete.type === "floor") endpoint = `/api/v1/locations/floors/${itemToDelete.id}`;
      else if (itemToDelete.type === "rack") endpoint = `/api/v1/locations/racks/${itemToDelete.id}`;

      const res = await fetch(apiUrl(endpoint), {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Deletion failed");
      }

      setDeleteModalOpen(false);
      setItemToDelete(null);
      notifySuccess(`${itemToDelete.name} deleted successfully!`);
      loadAllData();
    } catch (err: any) {
      setDeleteModalOpen(false);
      notifyError(err.message);
    }
  };

  // Filtered lists
  const filteredSites = locations.filter((loc) => {
    if (activeTab === "datacenters" && loc.type !== "Data Center") return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        loc.name.toLowerCase().includes(q) ||
        loc.code.toLowerCase().includes(q) ||
        (loc.address && loc.address.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const filteredBuildings = buildings.filter((b) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q) || (b.location_name && b.location_name.toLowerCase().includes(q));
  });

  const filteredFloors = floors.filter((f) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return f.floor_number.toLowerCase().includes(q) || (f.floor_name && f.floor_name.toLowerCase().includes(q)) || (f.building_name && f.building_name.toLowerCase().includes(q));
  });

  const filteredRacks = racks.filter((r) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return r.rack_name.toLowerCase().includes(q) || r.rack_number.toLowerCase().includes(q) || (r.room && r.room.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {actionSuccess && (
        <div className="flex items-center space-x-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="flex items-center space-x-2 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium animate-fadeIn">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Datacenter & Location Infrastructure
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Hierarchical facility management across carrier-neutral Hong Kong data centers, headquarters, branches, buildings, floors, and 42U rack elevations.
          </p>
        </div>

        {/* Global Action Button */}
        <div className="flex items-center space-x-2">
          <button
            onClick={loadAllData}
            className="p-2 bg-white rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer shadow-sm transition-all"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
          </button>

          {(activeTab === "sites" || activeTab === "datacenters") && (
            <button
              onClick={openAddSite}
              className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#1E60D5] hover:bg-blue-700 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add {activeTab === "datacenters" ? "Data Center" : "Location"}</span>
            </button>
          )}

          {activeTab === "buildings" && (
            <button
              onClick={openAddBuilding}
              className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#1E60D5] hover:bg-blue-700 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Building</span>
            </button>
          )}

          {activeTab === "floors" && (
            <button
              onClick={openAddFloor}
              className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#1E60D5] hover:bg-blue-700 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Floor</span>
            </button>
          )}

          {activeTab === "racks" && (
            <button
              onClick={openAddRack}
              className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#1E60D5] hover:bg-blue-700 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Rack</span>
            </button>
          )}

          {activeTab === "elevation" && (
            <button
              onClick={() => setActiveTab("racks")}
              className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Server className="w-4 h-4 text-slate-500" />
              <span>Manage Racks</span>
            </button>
          )}
        </div>
      </div>

      {/* Submenu Tab Bar */}
      <div className="flex items-center space-x-2 border-b border-slate-200 overflow-x-auto pb-px">
        {[
          { id: "sites", label: "Sites & Offices", icon: MapPin, count: locations.length },
          {
            id: "datacenters",
            label: "Data Centers",
            icon: ShieldCheck,
            count: locations.filter((l) => l.type === "Data Center").length,
          },
          { id: "buildings", label: "Buildings", icon: BuildingIcon, count: buildings.length },
          { id: "floors", label: "Floors", icon: Layers, count: floors.length },
          { id: "racks", label: "Racks", icon: Server, count: racks.length },
          { id: "elevation", label: "42U Visual Elevation", icon: HardDrive, count: null },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "border-blue-600 text-blue-600 bg-blue-50/40 rounded-t-lg font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    isActive ? "bg-blue-600 text-white font-bold" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search Bar for Table Views */}
      {activeTab !== "elevation" && (
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={`Search in ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>
      )}

      {/* TAB 1 & 2: SITES & DATA CENTERS */}
      {(activeTab === "sites" || activeTab === "datacenters") && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSites.map((loc) => (
            <div
              key={loc.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {loc.code}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        loc.type === "Data Center"
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : loc.type === "Headquarters"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {loc.type}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openSiteDetail(loc, "overview")}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                      title="View Site Infrastructure Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openEditSite(loc)}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                      title="Edit Location"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => confirmDelete("site", loc.id, loc.name)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      title="Delete Location"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3
                  onClick={() => openSiteDetail(loc, "overview")}
                  className="text-sm font-bold text-slate-900 mt-2 cursor-pointer hover:text-blue-600 transition-colors flex items-center justify-between group"
                  title="Click to view site details"
                >
                  <span className="group-hover:underline">{loc.name}</span>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all shrink-0 ml-1" />
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                  <span className="truncate">{loc.address || `${loc.city}, ${loc.country}`}</span>
                </p>

                {loc.contact_person && (
                  <div className="mt-3 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <div className="font-semibold text-slate-700">{loc.contact_person}</div>
                    <div className="text-slate-400">{loc.contact_phone || loc.contact_email}</div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                <button
                  type="button"
                  onClick={() => openSiteDetail(loc, "buildings")}
                  className="bg-slate-50 hover:bg-blue-50/80 p-2 rounded-lg cursor-pointer transition-all border border-slate-100 hover:border-blue-200 group text-left sm:text-center"
                  title="Click to inspect buildings in this site"
                >
                  <span className="block text-[10px] text-slate-400 group-hover:text-blue-600 font-semibold uppercase">Buildings</span>
                  <span className="font-bold text-slate-800 group-hover:text-blue-700">{loc.building_count}</span>
                </button>
                <button
                  type="button"
                  onClick={() => openSiteDetail(loc, "racks")}
                  className="bg-slate-50 hover:bg-blue-50/80 p-2 rounded-lg cursor-pointer transition-all border border-slate-100 hover:border-blue-200 group text-left sm:text-center"
                  title="Click to inspect racks in this site"
                >
                  <span className="block text-[10px] text-slate-400 group-hover:text-blue-600 font-semibold uppercase">Racks</span>
                  <span className="font-bold text-slate-800 group-hover:text-blue-700">{loc.rack_count}</span>
                </button>
                <button
                  type="button"
                  onClick={() => openSiteDetail(loc, "assets")}
                  className="bg-blue-50/60 hover:bg-blue-100/90 p-2 rounded-lg cursor-pointer transition-all border border-blue-100 hover:border-blue-300 group text-left sm:text-center"
                  title="Click to inspect all active assets in this site"
                >
                  <span className="block text-[10px] text-blue-600 font-semibold uppercase">Assets</span>
                  <span className="font-bold text-blue-700 group-hover:underline">{loc.asset_count}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: BUILDINGS */}
      {activeTab === "buildings" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Code</th>
                <th className="px-5 py-3.5">Building Name</th>
                <th className="px-5 py-3.5">Parent Site</th>
                <th className="px-5 py-3.5">Address</th>
                <th className="px-5 py-3.5 text-center">Floors</th>
                <th className="px-5 py-3.5 text-center">Racks</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBuildings.map((b) => (
                <tr
                  key={b.id}
                  onClick={() => openBuildingDetail(b, "overview")}
                  className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                >
                  <td className="px-5 py-3.5 font-mono font-bold text-slate-800 group-hover:text-blue-600">
                    {b.code}
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-slate-900 group-hover:text-blue-600">
                    <div className="flex items-center space-x-1.5">
                      <span>{b.name}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                    </div>
                  </td>
                  <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => {
                        const s = locations.find((l) => l.id === b.location_id || l.code === b.location_code || l.name === b.location_name);
                        if (s) openSiteDetail(s, "overview");
                      }}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer border border-blue-200"
                      title="Click to view parent site"
                    >
                      {b.location_name} ({b.location_code})
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 max-w-xs truncate">{b.address || "—"}</td>
                  <td className="px-5 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => openBuildingDetail(b, "floors")}
                      className="px-2 py-0.5 rounded-full font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Click to view floors in this building"
                    >
                      {b.floor_count}
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => openBuildingDetail(b, "racks")}
                      className="px-2 py-0.5 rounded-full font-bold text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
                      title="Click to view racks in this building"
                    >
                      {b.rack_count}
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openBuildingDetail(b, "overview")}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100 transition-colors"
                      title="View Building Details & Devices"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openEditBuilding(b)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100 transition-colors"
                      title="Edit Building"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => confirmDelete("building", b.id, b.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition-colors"
                      title="Delete Building"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: FLOORS */}
      {activeTab === "floors" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Floor / Level</th>
                <th className="px-5 py-3.5">Floor Description</th>
                <th className="px-5 py-3.5">Building</th>
                <th className="px-5 py-3.5">Facility Location</th>
                <th className="px-5 py-3.5 text-center">Racks Housed</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFloors.map((f) => {
                const parentBldg = buildings.find((x) => x.id === f.building_id || x.name === f.building_name);
                const parentSite = locations.find((l) => l.name === f.location_name || l.code === f.location_code);
                return (
                  <tr
                    key={f.id}
                    onClick={() => {
                      if (parentBldg) openBuildingDetail(parentBldg, "floors");
                    }}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                  >
                    <td className="px-5 py-3.5 font-mono font-bold text-blue-600 text-sm group-hover:underline">
                      {f.floor_number}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900">{f.floor_name}</td>
                    <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => {
                          if (parentBldg) openBuildingDetail(parentBldg, "overview");
                        }}
                        className="text-slate-700 font-medium hover:text-blue-600 hover:underline cursor-pointer"
                        title="Click to view building details"
                      >
                        {f.building_name}
                      </button>
                    </td>
                    <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => {
                          if (parentSite) openSiteDetail(parentSite, "overview");
                        }}
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                        title="Click to view site details"
                      >
                        {f.location_name}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => {
                          if (parentBldg) openBuildingDetail(parentBldg, "racks");
                        }}
                        className="font-bold text-slate-800 hover:text-blue-600 px-2 py-0.5 rounded hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Click to view racks in this building floor"
                      >
                        {f.rack_count}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openEditFloor(f)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100 transition-colors"
                        title="Edit Floor"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => confirmDelete("floor", f.id, f.floor_number)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition-colors"
                        title="Delete Floor"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 5: RACKS */}
      {activeTab === "racks" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Rack Name</th>
                <th className="px-5 py-3.5">Rack Number</th>
                <th className="px-5 py-3.5">Facility Location</th>
                <th className="px-5 py-3.5">Floor / Room</th>
                <th className="px-5 py-3.5">Power Spec</th>
                <th className="px-5 py-3.5 text-center">Total U</th>
                <th className="px-5 py-3.5 text-center">Occupancy</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRacks.map((r) => {
                const parentSite = locations.find((l) => l.name === r.location_name || l.code === r.location_code);
                const parentBldg = buildings.find((b) => b.name === r.building_name);
                return (
                  <tr
                    key={r.id}
                    onClick={() => openRackDetail(r, "overview")}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                  >
                    <td className="px-5 py-3.5 font-bold text-slate-900 group-hover:text-blue-600">
                      <div className="flex items-center space-x-1.5">
                        <span>{r.rack_name}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[11px] text-slate-600">{r.rack_number}</td>
                    <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => {
                          if (parentSite) openSiteDetail(parentSite, "racks");
                        }}
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors cursor-pointer border border-blue-200"
                        title="Click to view parent site"
                      >
                        {r.location_name} ({r.location_code})
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => {
                          if (parentBldg) openBuildingDetail(parentBldg, "floors");
                        }}
                        className="hover:text-blue-600 hover:underline cursor-pointer"
                        title="Click to view building floors"
                      >
                        {r.floor_name} • {r.room}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-[11px]">
                      <span className="font-semibold text-slate-700">{r.power_feed}</span>
                      <span className="text-slate-400 ml-1">({r.max_power_kw})</span>
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-slate-700">{r.total_u}U</td>
                    <td className="px-5 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => openRackDetail(r, "assets")}
                        className="p-1 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer group/occ"
                        title="Click to inspect installed assets in this rack"
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <span className="font-bold text-blue-600 group-hover/occ:underline">{r.asset_count} assets</span>
                          <span className="text-[10px] text-slate-400">({r.utilization_pct}%)</span>
                        </div>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full mx-auto mt-1 overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${Math.min(r.utilization_pct, 100)}%` }}
                          />
                        </div>
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => openRackDetail(r, "overview")}
                        className="px-2 py-1 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors inline-flex items-center space-x-1 cursor-pointer"
                        title="View Rack Details & Assets"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Details</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedElevationRackId(r.id);
                          setActiveTab("elevation");
                        }}
                        className="px-2 py-1 text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors inline-flex items-center space-x-1 cursor-pointer"
                        title="View 42U Visual Elevation"
                      >
                        <HardDrive className="w-3 h-3" />
                        <span>Elevation</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditRack(r)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100 transition-colors inline-block cursor-pointer"
                        title="Edit Rack"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => confirmDelete("rack", r.id, r.rack_name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition-colors inline-block cursor-pointer"
                        title="Delete Rack"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 6: 42U DYNAMIC VISUAL ELEVATION */}
      {activeTab === "elevation" && (
        <div className="space-y-6">
          {/* Rack Selector Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <Server className="w-5 h-5 text-blue-600 shrink-0" />
              <div className="w-72 sm:w-80">
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Select Rack to Inspect</label>
                <SearchableSelect
                  options={racks.map((r) => ({
                    value: r.id,
                    label: `${r.rack_name} (${r.rack_number})`,
                    subLabel: `${r.location_name} / ${r.room}`,
                  }))}
                  value={selectedElevationRackId}
                  onChange={(val) => setSelectedElevationRackId(Number(val))}
                  placeholder="Select rack to inspect..."
                  searchPlaceholder="Search rack name or room..."
                  searchThreshold={10}
                />
              </div>
            </div>

            {elevationData?.rack && (
              <div className="flex items-center space-x-6 text-xs text-slate-600">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Power Feed</span>
                  <span className="font-bold text-slate-800">{elevationData.rack.power_feed}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Capacity (U)</span>
                  <span className="font-bold text-slate-800">{elevationData.rack.total_u}U</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Installed Assets</span>
                  <span className="font-bold text-blue-600">{elevationData.rack.asset_count} units</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Utilization</span>
                  <span className="font-bold text-emerald-600">{elevationData.rack.utilization_pct}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Elevation Graphic Canvas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 42U Server Rack Graphic */}
            <div className="lg:col-span-2 bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-white tracking-widest uppercase">
                    {elevationData?.rack?.rack_name || "Server Rack"} • FRONT ELEVATION
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {elevationData?.rack?.location_name} • {elevationData?.rack?.room}
                </span>
              </div>

              {elevationLoading ? (
                <div className="py-20 text-center text-slate-500 text-xs">Loading 42U rack units from database...</div>
              ) : (
                <div className="space-y-1 max-h-[680px] overflow-y-auto pr-2">
                  {elevationData?.units?.map((u: any) => {
                    const isOccupied = u.is_occupied;
                    const isSelected = selectedUnitItem?.u_position === u.u_position;
                    return (
                      <div
                        key={u.u_position}
                        onClick={() => {
                          if (isOccupied) setSelectedUnitItem(u);
                        }}
                        className={`flex items-center rounded px-3 py-1.5 font-mono text-xs transition-all cursor-pointer border ${
                          isOccupied
                            ? isSelected
                              ? "bg-blue-600/30 border-blue-400 text-white shadow-md ring-2 ring-blue-500/30"
                              : "bg-slate-800/90 border-slate-700 text-slate-200 hover:bg-slate-700/80 hover:border-slate-500"
                            : "bg-slate-950/40 border-slate-800/60 text-slate-600 hover:bg-slate-900"
                        }`}
                      >
                        {/* Unit Number */}
                        <span className="w-10 font-bold text-[11px] text-slate-400 shrink-0">
                          U{String(u.u_position).padStart(2, "0")}
                        </span>

                        {isOccupied ? (
                          <div className="flex-1 flex items-center justify-between overflow-hidden">
                            <div className="flex items-center space-x-3 truncate">
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  u.operational_status === "Deployed" || u.operational_status === "Operational"
                                    ? "bg-emerald-400"
                                    : "bg-amber-400"
                                }`}
                              />
                              <span className="font-bold text-white truncate">{u.hostname}</span>
                              <span className="text-[11px] text-slate-400 truncate hidden sm:inline">
                                {u.model_name}
                              </span>
                            </div>

                            <div className="flex items-center space-x-2 shrink-0 text-[11px]">
                              <span className="px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-300 border border-blue-700/50 text-[10px]">
                                {u.category}
                              </span>
                              <span className="text-slate-400 font-mono hidden md:inline">
                                {u.management_ip || u.asset_id}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 flex items-center justify-between text-[11px] text-slate-600">
                            <span>[ Available Slot ]</span>
                            <span className="text-[10px] text-slate-700">Empty 1U</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected Device Inspection Panel */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Unit Inspector
                </h3>
                {selectedUnitItem && (
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold font-mono">
                    Slot U{selectedUnitItem.u_position}
                  </span>
                )}
              </div>

              {selectedUnitItem ? (
                <div className="space-y-4 text-xs">
                  <div
                    onClick={() => onSelectAsset && onSelectAsset(selectedUnitItem.asset_id)}
                    className="cursor-pointer group hover:bg-blue-50/70 p-2.5 -m-1 rounded-xl transition-colors border border-transparent hover:border-blue-200"
                    title="Click to view full asset details"
                  >
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Device Hostname</span>
                    <span className="font-bold text-base text-slate-900 group-hover:text-blue-600 flex items-center justify-between">
                      <span>{selectedUnitItem.hostname}</span>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
                    </span>
                    <span className="text-xs text-blue-600 font-mono mt-0.5 block group-hover:underline">{selectedUnitItem.asset_id}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Manufacturer</span>
                      <span className="font-semibold text-slate-800">{selectedUnitItem.manufacturer || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Model</span>
                      <span className="font-semibold text-slate-800">{selectedUnitItem.model_name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Category</span>
                      <span className="font-semibold text-blue-600">{selectedUnitItem.category}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Form Factor</span>
                      <span className="font-semibold text-slate-800">{selectedUnitItem.rack_units || 1}U Standard</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Management IP</span>
                      <span className="font-mono font-bold text-slate-900">{selectedUnitItem.management_ip || "N/A"}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">Operational State</span>
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="font-bold text-emerald-700">{selectedUnitItem.operational_status || "Operational"}</span>
                      </div>
                    </div>
                  </div>

                  {onSelectAsset && (
                    <button
                      type="button"
                      onClick={() => onSelectAsset(selectedUnitItem.asset_id)}
                      className="w-full mt-2 py-2 px-3 text-xs font-semibold text-white bg-[#1E60D5] hover:bg-blue-700 rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Full Asset Profile (7 Tabs)</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="py-16 text-center text-slate-400 text-xs">
                  <HardDrive className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p>Click on any occupied unit in the 42U elevation diagram to view detailed asset attributes and network configuration.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================== */}
      {/* MODAL 1: ADD / EDIT SITE                                                 */}
      {/* ======================================================================== */}
      {siteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <h3 className="text-sm font-bold text-slate-900">
                {editingSite ? "Edit Facility Location" : "Add New Facility / Data Center"}
              </h3>
              <button
                type="button"
                onClick={() => setSiteModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSite} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Site Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DC-MEGA"
                    value={siteForm.code}
                    onChange={(e) => setSiteForm({ ...siteForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Facility Type *</label>
                  <select
                    value={siteForm.type}
                    onChange={(e) => setSiteForm({ ...siteForm, type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="Data Center">Data Center</option>
                    <option value="Headquarters">Headquarters</option>
                    <option value="Branch Office">Branch Office</option>
                    <option value="Disaster Recovery">Disaster Recovery</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Site / Facility Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MEGA-i Carrier Neutral DC"
                  value={siteForm.name}
                  onChange={(e) => setSiteForm({ ...siteForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={siteForm.country}
                    onChange={(e) => setSiteForm({ ...siteForm, country: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={siteForm.city}
                    onChange={(e) => setSiteForm({ ...siteForm, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Street Address</label>
                <input
                  type="text"
                  placeholder="e.g. 399 Chai Wan Road, Hong Kong"
                  value={siteForm.address}
                  onChange={(e) => setSiteForm({ ...siteForm, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. DC Manager"
                    value={siteForm.contact_person}
                    onChange={(e) => setSiteForm({ ...siteForm, contact_person: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+852 2843 xxxx"
                    value={siteForm.contact_phone}
                    onChange={(e) => setSiteForm({ ...siteForm, contact_phone: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="noc@example.com"
                    value={siteForm.contact_email}
                    onChange={(e) => setSiteForm({ ...siteForm, contact_email: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSiteModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1E60D5] hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm"
                >
                  {editingSite ? "Save Changes" : "Create Location"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================== */}
      {/* MODAL 2: ADD / EDIT BUILDING                                             */}
      {/* ======================================================================== */}
      {buildingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <h3 className="text-sm font-bold text-slate-900">
                {editingBuilding ? "Edit Building" : "Add New Building"}
              </h3>
              <button
                type="button"
                onClick={() => setBuildingModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBuilding} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Parent Location *</label>
                <select
                  value={buildingForm.location_id}
                  onChange={(e) => setBuildingForm({ ...buildingForm, location_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold focus:bg-white"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Building Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BLD-HQ-01"
                  value={buildingForm.code}
                  onChange={(e) => setBuildingForm({ ...buildingForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Building Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. United Centre Tower"
                  value={buildingForm.name}
                  onChange={(e) => setBuildingForm({ ...buildingForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Address / Wing</label>
                <input
                  type="text"
                  placeholder="e.g. 95 Queensway, Admiralty"
                  value={buildingForm.address}
                  onChange={(e) => setBuildingForm({ ...buildingForm, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBuildingModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1E60D5] hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm"
                >
                  {editingBuilding ? "Save Changes" : "Create Building"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================== */}
      {/* MODAL 3: ADD / EDIT FLOOR                                                */}
      {/* ======================================================================== */}
      {floorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <h3 className="text-sm font-bold text-slate-900">
                {editingFloor ? "Edit Floor" : "Add New Floor"}
              </h3>
              <button
                type="button"
                onClick={() => setFloorModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFloor} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Building *</label>
                <select
                  value={floorForm.building_id}
                  onChange={(e) => setFloorForm({ ...floorForm, building_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold focus:bg-white"
                >
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.location_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Floor Level / Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 11/F or B2 or Server Hall 3"
                  value={floorForm.floor_number}
                  onChange={(e) => setFloorForm({ ...floorForm, floor_number: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Floor Description / Hall Name</label>
                <input
                  type="text"
                  placeholder="e.g. Core Network & Trading Server Hall"
                  value={floorForm.floor_name}
                  onChange={(e) => setFloorForm({ ...floorForm, floor_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setFloorModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1E60D5] hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm"
                >
                  {editingFloor ? "Save Changes" : "Create Floor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================== */}
      {/* MODAL 4: ADD / EDIT RACK                                                 */}
      {/* ======================================================================== */}
      {rackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <h3 className="text-sm font-bold text-slate-900">
                {editingRack ? "Edit Server Rack" : "Add New Server Rack"}
              </h3>
              <button
                type="button"
                onClick={() => setRackModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRack} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Floor Location *</label>
                <select
                  value={rackForm.floor_id}
                  onChange={(e) => setRackForm({ ...rackForm, floor_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold focus:bg-white"
                >
                  {floors.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.floor_number} - {f.building_name} ({f.location_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Rack Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rack A1"
                    value={rackForm.rack_name}
                    onChange={(e) => setRackForm({ ...rackForm, rack_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Rack Number</label>
                  <input
                    type="text"
                    placeholder="e.g. RK-DC-A1"
                    value={rackForm.rack_number}
                    onChange={(e) => setRackForm({ ...rackForm, rack_number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Room / Cage</label>
                  <input
                    type="text"
                    placeholder="e.g. Cage 702"
                    value={rackForm.room}
                    onChange={(e) => setRackForm({ ...rackForm, room: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Total Height (U)</label>
                  <select
                    value={rackForm.total_u}
                    onChange={(e) => setRackForm({ ...rackForm, total_u: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold focus:bg-white"
                  >
                    <option value={42}>42U (Standard)</option>
                    <option value={45}>45U (Tall)</option>
                    <option value={48}>48U (Hyperscale)</option>
                    <option value={24}>24U (Half Rack)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Power Feed</label>
                  <input
                    type="text"
                    placeholder="e.g. Dual A+B (32A)"
                    value={rackForm.power_feed}
                    onChange={(e) => setRackForm({ ...rackForm, power_feed: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Max Power (kW)</label>
                  <input
                    type="text"
                    placeholder="e.g. 10kW"
                    value={rackForm.max_power_kw}
                    onChange={(e) => setRackForm({ ...rackForm, max_power_kw: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRackModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1E60D5] hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm"
                >
                  {editingRack ? "Save Changes" : "Create Rack"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================== */}
      {/* MODAL 5: DELETE CONFIRMATION                                             */}
      {/* ======================================================================== */}
      {deleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm p-6 text-center animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Confirm Deletion</h3>
            <p className="text-xs text-slate-500 mt-2">
              Are you sure you want to delete <span className="font-bold text-slate-800">{itemToDelete.name}</span>?
              This action cannot be undone.
            </p>
            <div className="flex items-center justify-center space-x-3 mt-6">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-50 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-xs shadow-sm"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================== */}
      {/* MODAL 6: SITE & DATA CENTER INTERACTIVE DETAIL                           */}
      {/* ======================================================================== */}
      {detailSiteModalOpen && selectedSiteDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-fadeIn my-6 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">
                      {selectedSiteDetail.code}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        selectedSiteDetail.type === "Data Center"
                          ? "bg-purple-100 text-purple-700 border border-purple-200"
                          : selectedSiteDetail.type === "Headquarters"
                          ? "bg-amber-100 text-amber-700 border border-amber-200"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {selectedSiteDetail.type}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedSiteDetail.name}</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailSiteModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Subtabs */}
            <div className="flex items-center space-x-2 px-6 border-b border-slate-200 bg-white shrink-0 overflow-x-auto">
              {[
                { id: "overview", label: "Overview & Facility Info" },
                {
                  id: "buildings",
                  label: `Buildings (${buildings.filter((b) => b.location_id === selectedSiteDetail.id || b.location_code === selectedSiteDetail.code).length})`,
                },
                {
                  id: "racks",
                  label: `Racks (${selectedSiteDetail.racks?.length || racks.filter((r) => r.location_code === selectedSiteDetail.code || r.location_name === selectedSiteDetail.name).length})`,
                },
                { id: "assets", label: `Installed Assets (${siteAssets.length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSiteDetailTab(tab.id as any)}
                  className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    siteDetailTab === tab.id
                      ? "border-blue-600 text-blue-600 font-bold"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Body Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
              {/* TAB: OVERVIEW */}
              {siteDetailTab === "overview" && (
                <div className="space-y-5">
                  {/* Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Buildings</span>
                      <span className="text-xl font-bold text-slate-900 mt-1 block">
                        {selectedSiteDetail.building_count ?? selectedSiteDetail.buildings?.length ?? 0}
                      </span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Floors</span>
                      <span className="text-xl font-bold text-slate-900 mt-1 block">
                        {selectedSiteDetail.floor_count ?? 0}
                      </span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Racks</span>
                      <span className="text-xl font-bold text-slate-900 mt-1 block">
                        {selectedSiteDetail.rack_count || selectedSiteDetail.racks?.length || 0}
                      </span>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-xl">
                      <span className="text-[10px] text-blue-600 font-bold uppercase block">Installed Assets</span>
                      <span className="text-xl font-bold text-blue-700 mt-1 block">
                        {siteAssets.length} units
                      </span>
                    </div>
                  </div>

                  {/* Physical Address & Contact */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Physical Location</span>
                      <p className="font-semibold text-slate-800 text-sm">{selectedSiteDetail.name}</p>
                      <p className="text-slate-600 flex items-start space-x-2">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <span>{selectedSiteDetail.address || "—"}</span>
                      </p>
                      <p className="text-slate-500 pt-1">
                        Region: <span className="font-semibold text-slate-700">{selectedSiteDetail.city || "—"}{selectedSiteDetail.country ? `, ${selectedSiteDetail.country}` : ""}</span>
                      </p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">On-Site Facility Contact</span>
                      <p className="font-semibold text-slate-800 text-sm">{selectedSiteDetail.contact_person || "—"}</p>
                      {selectedSiteDetail.contact_phone && (
                        <p className="text-slate-600 flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="font-mono">{selectedSiteDetail.contact_phone}</span>
                        </p>
                      )}
                      {selectedSiteDetail.contact_email && (
                        <p className="text-slate-600 flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{selectedSiteDetail.contact_email}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Quick Action Navigation */}
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSiteDetailTab("buildings")}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer"
                    >
                      <BuildingIcon className="w-4 h-4 text-slate-600" />
                      <span>Explore Buildings</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSiteDetailTab("racks")}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Server className="w-4 h-4 text-slate-600" />
                      <span>Explore Racks</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSiteDetailTab("assets")}
                      className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer"
                    >
                      <HardDrive className="w-4 h-4 text-blue-600" />
                      <span>Inspect All {siteAssets.length} Assets</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB: BUILDINGS */}
              {siteDetailTab === "buildings" && (
                <div className="space-y-4">
                  {buildings.filter((b) => b.location_id === selectedSiteDetail.id || b.location_code === selectedSiteDetail.code).length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500">
                      No standalone buildings registered for this site yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {buildings
                        .filter((b) => b.location_id === selectedSiteDetail.id || b.location_code === selectedSiteDetail.code)
                        .map((b) => (
                          <div
                            key={b.id}
                            className="bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                                  {b.code}
                                </span>
                                <span className="text-[11px] font-semibold text-blue-600">{b.rack_count} racks</span>
                              </div>
                              <h4 className="text-sm font-bold text-slate-900 mt-2">{b.name}</h4>
                              <p className="text-slate-500 text-xs mt-1 truncate">{b.address || "—"}</p>
                              <div className="mt-2 text-[11px] text-slate-600">
                                Total Floors: <span className="font-bold text-slate-800">{b.floor_count}</span>
                              </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  setDetailSiteModalOpen(false);
                                  openBuildingDetail(b, "overview");
                                }}
                                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
                              >
                                <span>Inspect Building</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB: RACKS */}
              {siteDetailTab === "racks" && (
                <div className="space-y-4">
                  {racks.filter((r) => r.location_code === selectedSiteDetail.code || r.location_name === selectedSiteDetail.name).length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500">
                      No racks registered under this site yet.
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="px-4 py-3">Rack</th>
                            <th className="px-4 py-3">Room / Floor</th>
                            <th className="px-4 py-3">Power Spec</th>
                            <th className="px-4 py-3 text-center">Capacity</th>
                            <th className="px-4 py-3 text-center">Occupancy</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {racks
                            .filter((r) => r.location_code === selectedSiteDetail.code || r.location_name === selectedSiteDetail.name)
                            .map((r) => (
                              <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="px-4 py-3">
                                  <div className="font-bold text-slate-900">{r.rack_name}</div>
                                  <div className="font-mono text-[10px] text-slate-500">{r.rack_number}</div>
                                </td>
                                <td className="px-4 py-3 text-slate-600">
                                  {r.floor_name} • {r.room}
                                </td>
                                <td className="px-4 py-3 text-slate-600">
                                  {r.power_feed} <span className="text-slate-400">({r.max_power_kw})</span>
                                </td>
                                <td className="px-4 py-3 text-center font-bold text-slate-700">{r.total_u}U</td>
                                <td className="px-4 py-3 text-center">
                                  <span className="font-bold text-blue-600">{r.asset_count} assets</span>
                                  <span className="text-slate-400 text-[10px] ml-1">({r.utilization_pct}%)</span>
                                </td>
                                <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDetailSiteModalOpen(false);
                                      openRackDetail(r, "overview");
                                    }}
                                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded transition-colors cursor-pointer"
                                  >
                                    Details
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedElevationRackId(r.id);
                                      setActiveTab("elevation");
                                      setDetailSiteModalOpen(false);
                                    }}
                                    className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded transition-colors inline-flex items-center space-x-1 cursor-pointer"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>Elevation</span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: INSTALLED ASSETS */}
              {siteDetailTab === "assets" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search assets by hostname, IP, model, rack..."
                        value={siteAssetSearch}
                        onChange={(e) => setSiteAssetSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <span className="text-slate-400 text-xs">
                      Total: <span className="font-bold text-slate-800">{siteAssets.length}</span> devices
                    </span>
                  </div>

                  {siteDetailLoading ? (
                    <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
                      <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                      <span>Loading site assets...</span>
                    </div>
                  ) : siteAssets.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500">
                      No assets currently associated with this site.
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden max-h-[460px] overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] sticky top-0">
                          <tr>
                            <th className="px-4 py-2.5">Asset ID</th>
                            <th className="px-4 py-2.5">Hostname</th>
                            <th className="px-4 py-2.5">Model / Vendor</th>
                            <th className="px-4 py-2.5">Category</th>
                            <th className="px-4 py-2.5">Management IP</th>
                            <th className="px-4 py-2.5">Rack / Position</th>
                            <th className="px-4 py-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {siteAssets
                            .filter((a) => {
                              if (!siteAssetSearch) return true;
                              const q = siteAssetSearch.toLowerCase();
                              return (
                                (a.hostname && a.hostname.toLowerCase().includes(q)) ||
                                (a.asset_id && a.asset_id.toLowerCase().includes(q)) ||
                                (a.model && a.model.toLowerCase().includes(q)) ||
                                (a.category && a.category.toLowerCase().includes(q)) ||
                                (a.ip_address && a.ip_address.toLowerCase().includes(q)) ||
                                (a.rack_name && a.rack_name.toLowerCase().includes(q))
                              );
                            })
                            .map((a) => (
                              <tr
                                key={a.id}
                                onClick={() => {
                                  if (onSelectAsset) {
                                    setDetailSiteModalOpen(false);
                                    onSelectAsset(String(a.id || a.asset_id));
                                  }
                                }}
                                className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                                title="Click to view full asset details"
                              >
                                <td className="px-4 py-2.5 font-mono font-bold text-blue-600 group-hover:underline">
                                  {a.asset_id}
                                </td>
                                <td className="px-4 py-2.5 font-semibold text-slate-900 group-hover:text-blue-600">
                                  {a.hostname}
                                </td>
                                <td className="px-4 py-2.5 text-slate-600">
                                  {a.model} <span className="text-slate-400">({a.manufacturer})</span>
                                </td>
                                <td className="px-4 py-2.5">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700">
                                    {a.category}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 font-mono text-slate-600">{a.ip_address || "—"}</td>
                                <td className="px-4 py-2.5 text-slate-600">
                                  {a.rack_name || "—"} {a.rack_position ? `(${a.rack_position})` : ""}
                                </td>
                                <td className="px-4 py-2.5">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                      a.status === "Deployed" || a.status === "Operational"
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        : "bg-amber-50 text-amber-700 border border-amber-200"
                                    }`}
                                  >
                                    {a.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================== */}
      {/* MODAL 7: BUILDING INTERACTIVE DETAIL                                     */}
      {/* ======================================================================== */}
      {detailBuildingModalOpen && selectedBuildingDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-fadeIn my-6 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <BuildingIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                      {selectedBuildingDetail.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const s = locations.find((l) => l.id === selectedBuildingDetail.location_id || l.name === selectedBuildingDetail.location_name);
                        if (s) {
                          setDetailBuildingModalOpen(false);
                          openSiteDetail(s, "overview");
                        }
                      }}
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 cursor-pointer"
                      title="Click to view parent site"
                    >
                      Site: {selectedBuildingDetail.location_name}
                    </button>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedBuildingDetail.name}</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailBuildingModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Subtabs */}
            <div className="flex items-center space-x-2 px-6 border-b border-slate-200 bg-white shrink-0 overflow-x-auto">
              {[
                { id: "overview", label: "Overview & Specs" },
                {
                  id: "floors",
                  label: `Floors & Rooms (${selectedBuildingDetail.floors?.length || selectedBuildingDetail.floor_count || 0})`,
                },
                {
                  id: "racks",
                  label: `Racks (${selectedBuildingDetail.racks?.length || selectedBuildingDetail.rack_count || 0})`,
                },
                { id: "assets", label: `Installed Assets (${buildingAssets.length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setBuildingDetailTab(tab.id as any)}
                  className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    buildingDetailTab === tab.id
                      ? "border-indigo-600 text-indigo-600 font-bold"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Body Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
              {/* TAB: OVERVIEW */}
              {buildingDetailTab === "overview" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Floors</span>
                      <span className="text-xl font-bold text-slate-900 mt-1 block">
                        {selectedBuildingDetail.floors?.length || selectedBuildingDetail.floor_count || 0}
                      </span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Racks</span>
                      <span className="text-xl font-bold text-slate-900 mt-1 block">
                        {selectedBuildingDetail.racks?.length || selectedBuildingDetail.rack_count || 0}
                      </span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Parent Site</span>
                      <span className="text-sm font-bold text-slate-800 mt-1 block truncate">
                        {selectedBuildingDetail.location_name || "—"}
                      </span>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-200 p-3.5 rounded-xl">
                      <span className="text-[10px] text-indigo-600 font-bold uppercase block">Installed Assets</span>
                      <span className="text-xl font-bold text-indigo-700 mt-1 block">
                        {buildingAssets.length} units
                      </span>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Address / Location</span>
                    <p className="font-semibold text-slate-800 text-sm">{selectedBuildingDetail.name}</p>
                    <p className="text-slate-600 flex items-start space-x-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>{selectedBuildingDetail.address || "—"}</span>
                    </p>
                  </div>
                </div>
              )}

              {/* TAB: FLOORS */}
              {buildingDetailTab === "floors" && (
                <div className="space-y-4">
                  {!selectedBuildingDetail.floors || selectedBuildingDetail.floors.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500">
                      No floor levels recorded for this building.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedBuildingDetail.floors.map((flr: any) => (
                        <div key={flr.id} className="bg-white border border-slate-200 rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-base text-blue-600">{flr.floor_number}</span>
                            <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                              {flr.rack_count} racks
                            </span>
                          </div>
                          <div className="font-semibold text-slate-800 mt-1">{flr.floor_name}</div>
                          {flr.racks && flr.racks.length > 0 && (
                            <div className="mt-3 pt-2 border-t border-slate-100 space-y-1">
                              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Racks in this floor:</span>
                              <div className="flex flex-wrap gap-1.5">
                                {flr.racks.map((rk: any) => (
                                  <button
                                    key={rk.id}
                                    type="button"
                                    onClick={() => {
                                      setDetailBuildingModalOpen(false);
                                      openRackDetail(rk, "overview");
                                    }}
                                    className="px-2 py-0.5 rounded bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 text-[10px] font-semibold cursor-pointer transition-colors"
                                  >
                                    {rk.rack_name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB: RACKS */}
              {buildingDetailTab === "racks" && (
                <div className="space-y-4">
                  {!selectedBuildingDetail.racks || selectedBuildingDetail.racks.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500">
                      No racks housed in this building yet.
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="px-4 py-3">Rack</th>
                            <th className="px-4 py-3">Floor / Room</th>
                            <th className="px-4 py-3">Power Spec</th>
                            <th className="px-4 py-3 text-center">Capacity</th>
                            <th className="px-4 py-3 text-center">Occupancy</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedBuildingDetail.racks.map((r: any) => (
                            <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="px-4 py-3">
                                <div className="font-bold text-slate-900">{r.rack_name}</div>
                                <div className="font-mono text-[10px] text-slate-500">{r.rack_number}</div>
                              </td>
                              <td className="px-4 py-3 text-slate-600">
                                {r.floor_name} • {r.room}
                              </td>
                              <td className="px-4 py-3 text-slate-600">
                                {r.power_feed} <span className="text-slate-400">({r.max_power_kw})</span>
                              </td>
                              <td className="px-4 py-3 text-center font-bold text-slate-700">{r.total_u}U</td>
                              <td className="px-4 py-3 text-center">
                                <span className="font-bold text-blue-600">{r.asset_count} assets</span>
                                <span className="text-slate-400 text-[10px] ml-1">({r.utilization_pct}%)</span>
                              </td>
                              <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDetailBuildingModalOpen(false);
                                    openRackDetail(r, "overview");
                                  }}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded transition-colors cursor-pointer"
                                >
                                  Details
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedElevationRackId(r.id);
                                    setActiveTab("elevation");
                                    setDetailBuildingModalOpen(false);
                                  }}
                                  className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded transition-colors inline-flex items-center space-x-1 cursor-pointer"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Elevation</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: ASSETS */}
              {buildingDetailTab === "assets" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search devices in this building..."
                        value={buildingAssetSearch}
                        onChange={(e) => setBuildingAssetSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <span className="text-slate-400 text-xs">
                      Total: <span className="font-bold text-slate-800">{buildingAssets.length}</span> devices
                    </span>
                  </div>

                  {buildingDetailLoading ? (
                    <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
                      <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin" />
                      <span>Loading building assets...</span>
                    </div>
                  ) : buildingAssets.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500">
                      No assets found housed in this building.
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden max-h-[460px] overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] sticky top-0">
                          <tr>
                            <th className="px-4 py-2.5">Asset ID</th>
                            <th className="px-4 py-2.5">Hostname</th>
                            <th className="px-4 py-2.5">Model / Vendor</th>
                            <th className="px-4 py-2.5">Category</th>
                            <th className="px-4 py-2.5">Management IP</th>
                            <th className="px-4 py-2.5">Rack & Floor</th>
                            <th className="px-4 py-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {buildingAssets
                            .filter((a) => {
                              if (!buildingAssetSearch) return true;
                              const q = buildingAssetSearch.toLowerCase();
                              return (
                                (a.hostname && a.hostname.toLowerCase().includes(q)) ||
                                (a.asset_id && a.asset_id.toLowerCase().includes(q)) ||
                                (a.model && a.model.toLowerCase().includes(q)) ||
                                (a.category && a.category.toLowerCase().includes(q)) ||
                                (a.ip_address && a.ip_address.toLowerCase().includes(q)) ||
                                (a.rack_name && a.rack_name.toLowerCase().includes(q))
                              );
                            })
                            .map((a) => (
                              <tr
                                key={a.id}
                                onClick={() => {
                                  if (onSelectAsset) {
                                    setDetailBuildingModalOpen(false);
                                    onSelectAsset(String(a.id || a.asset_id));
                                  }
                                }}
                                className="hover:bg-indigo-50/50 transition-colors cursor-pointer group"
                                title="Click to view full asset details"
                              >
                                <td className="px-4 py-2.5 font-mono font-bold text-indigo-600 group-hover:underline">
                                  {a.asset_id}
                                </td>
                                <td className="px-4 py-2.5 font-semibold text-slate-900 group-hover:text-indigo-600">
                                  {a.hostname}
                                </td>
                                <td className="px-4 py-2.5 text-slate-600">
                                  {a.model} <span className="text-slate-400">({a.manufacturer})</span>
                                </td>
                                <td className="px-4 py-2.5">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700">
                                    {a.category}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 font-mono text-slate-600">{a.ip_address || "—"}</td>
                                <td className="px-4 py-2.5 text-slate-600">
                                  {a.rack_name || "—"} {a.rack_position ? `(${a.rack_position})` : ""}
                                </td>
                                <td className="px-4 py-2.5">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                      a.status === "Deployed" || a.status === "Operational"
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        : "bg-amber-50 text-amber-700 border border-amber-200"
                                    }`}
                                  >
                                    {a.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================== */}
      {/* MODAL 8: RACK INTERACTIVE DETAIL                                         */}
      {/* ======================================================================== */}
      {detailRackModalOpen && selectedRackDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-fadeIn my-6 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {selectedRackDetail.rack_number || `RK-${selectedRackDetail.rack_name}`}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                      {selectedRackDetail.total_u || 42}U Standard Rack
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedRackDetail.rack_name}</h3>
                  <p className="text-[11px] text-slate-500">
                    Location: {selectedRackDetail.location_name}{selectedRackDetail.building_name ? ` • ${selectedRackDetail.building_name}` : ""}{selectedRackDetail.floor_name ? ` • ${selectedRackDetail.floor_name}` : ""}{selectedRackDetail.room ? ` • ${selectedRackDetail.room}` : ""}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailRackModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Subtabs */}
            <div className="flex items-center space-x-2 px-6 border-b border-slate-200 bg-white shrink-0 overflow-x-auto">
              {[
                { id: "overview", label: "Rack Specifications & Power" },
                { id: "assets", label: `Mounted Devices (${rackAssets.length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setRackDetailTab(tab.id as any)}
                  className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    rackDetailTab === tab.id
                      ? "border-blue-600 text-blue-600 font-bold"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Body Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
              {/* TAB: OVERVIEW */}
              {rackDetailTab === "overview" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Capacity</span>
                      <span className="text-xl font-bold text-slate-900 mt-1 block">
                        {selectedRackDetail.total_u || 42}U
                      </span>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-xl">
                      <span className="text-[10px] text-blue-600 font-bold uppercase block">Occupied Units</span>
                      <span className="text-xl font-bold text-blue-700 mt-1 block">
                        {selectedRackDetail.occupied_u || rackAssets.length}U
                      </span>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl">
                      <span className="text-[10px] text-emerald-600 font-bold uppercase block">Available Units</span>
                      <span className="text-xl font-bold text-emerald-700 mt-1 block">
                        {Math.max(0, (selectedRackDetail.total_u || 42) - (selectedRackDetail.occupied_u || rackAssets.length))}U
                      </span>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 p-3.5 rounded-xl">
                      <span className="text-[10px] text-purple-600 font-bold uppercase block">Space Utilization</span>
                      <span className="text-xl font-bold text-purple-700 mt-1 block">
                        {selectedRackDetail.utilization_pct || Math.round(((rackAssets.length / (selectedRackDetail.total_u || 42)) * 100) * 10) / 10}%
                      </span>
                    </div>
                  </div>

                  {/* Utilization Progress Bar */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">Vertical Space Consumption</span>
                      <span className="font-bold text-blue-600">
                        {selectedRackDetail.occupied_u || rackAssets.length} of {selectedRackDetail.total_u || 42}U Utilized
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                        style={{
                          width: `${Math.min(
                            ((selectedRackDetail.occupied_u || rackAssets.length) / (selectedRackDetail.total_u || 42)) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Power & Facility Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Power Specification</span>
                      <p className="font-semibold text-slate-800 text-sm flex items-center space-x-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <span>{selectedRackDetail.power_feed}</span>
                      </p>
                      <p className="text-slate-500 pt-1">
                        Max Power Capacity: <span className="font-bold text-slate-700">{selectedRackDetail.max_power_kw}</span>
                      </p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Hall & Enclosure</span>
                      <p className="font-semibold text-slate-800 text-sm flex items-center space-x-2">
                        <Box className="w-4 h-4 text-blue-500" />
                        <span>{selectedRackDetail.room}</span>
                      </p>
                      <p className="text-slate-500 pt-1">
                        Floor Level: <span className="font-bold text-slate-700">{selectedRackDetail.floor_name}</span>
                      </p>
                    </div>
                  </div>

                  {/* Jump to Elevation Graphic */}
                  <div className="pt-2 flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedElevationRackId(selectedRackDetail.id);
                        setActiveTab("elevation");
                        setDetailRackModalOpen(false);
                      }}
                      className="px-4 py-2.5 bg-[#1E60D5] hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm transition-all flex items-center space-x-2 cursor-pointer"
                    >
                      <HardDrive className="w-4 h-4" />
                      <span>Open 42U Visual Elevation Map</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRackDetailTab("assets")}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-all cursor-pointer"
                    >
                      Inspect Devices Table ({rackAssets.length})
                    </button>
                  </div>
                </div>
              )}

              {/* TAB: MOUNTED DEVICES */}
              {rackDetailTab === "assets" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search devices mounted in this rack..."
                        value={rackAssetSearch}
                        onChange={(e) => setRackAssetSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedElevationRackId(selectedRackDetail.id);
                        setActiveTab("elevation");
                        setDetailRackModalOpen(false);
                      }}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-semibold flex items-center space-x-1 cursor-pointer"
                    >
                      <HardDrive className="w-3.5 h-3.5" />
                      <span>View Elevation</span>
                    </button>
                  </div>

                  {rackDetailLoading ? (
                    <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
                      <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                      <span>Loading mounted rack devices...</span>
                    </div>
                  ) : rackAssets.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500">
                      No devices currently mounted in this rack.
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden max-h-[460px] overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] sticky top-0">
                          <tr>
                            <th className="px-4 py-2.5">Slot / U</th>
                            <th className="px-4 py-2.5">Asset ID</th>
                            <th className="px-4 py-2.5">Hostname</th>
                            <th className="px-4 py-2.5">Model / Vendor</th>
                            <th className="px-4 py-2.5">Category</th>
                            <th className="px-4 py-2.5">Management IP</th>
                            <th className="px-4 py-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {rackAssets
                            .filter((a) => {
                              if (!rackAssetSearch) return true;
                              const q = rackAssetSearch.toLowerCase();
                              return (
                                (a.hostname && a.hostname.toLowerCase().includes(q)) ||
                                (a.asset_id && a.asset_id.toLowerCase().includes(q)) ||
                                (a.model && a.model.toLowerCase().includes(q)) ||
                                (a.category && a.category.toLowerCase().includes(q)) ||
                                (a.ip_address && a.ip_address.toLowerCase().includes(q)) ||
                                (a.rack_position && a.rack_position.toLowerCase().includes(q))
                              );
                            })
                            .map((a) => (
                              <tr
                                key={a.id}
                                onClick={() => {
                                  if (onSelectAsset) {
                                    setDetailRackModalOpen(false);
                                    onSelectAsset(String(a.id || a.asset_id));
                                  }
                                }}
                                className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                                title="Click to view full asset details"
                              >
                                <td className="px-4 py-2.5">
                                  <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-100 text-slate-800">
                                    {a.rack_position || "U--"}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 font-mono font-bold text-blue-600 group-hover:underline">
                                  {a.asset_id}
                                </td>
                                <td className="px-4 py-2.5 font-semibold text-slate-900 group-hover:text-blue-600">
                                  {a.hostname}
                                </td>
                                <td className="px-4 py-2.5 text-slate-600">
                                  {a.model} <span className="text-slate-400">({a.manufacturer})</span>
                                </td>
                                <td className="px-4 py-2.5">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700">
                                    {a.category}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 font-mono text-slate-600">{a.ip_address || "—"}</td>
                                <td className="px-4 py-2.5">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                      a.status === "Deployed" || a.status === "Operational"
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        : "bg-amber-50 text-amber-700 border border-amber-200"
                                    }`}
                                  >
                                    {a.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
