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
  HardDrive
} from "lucide-react";
import { apiUrl } from "@/lib/api";

interface LocationsViewProps {
  initialSub?: string;
}

export function LocationsView({ initialSub = "sites" }: LocationsViewProps) {
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
    room: "Main Server Hall",
    total_u: 42,
    power_feed: "Dual A+B Redundant (32A)",
    max_power_kw: "10kW",
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
      room: "Server Hall A",
      total_u: 42,
      power_feed: "Dual A+B Redundant (32A)",
      max_power_kw: "10kW",
    });
    setRackModalOpen(true);
  };

  const openEditRack = (r: any) => {
    setEditingRack(r);
    setRackForm({
      rack_name: r.rack_name,
      rack_number: r.rack_number,
      floor_id: r.floor_id,
      room: r.room || "Server Hall A",
      total_u: r.total_u || 42,
      power_feed: r.power_feed || "Dual A+B Redundant (32A)",
      max_power_kw: r.max_power_kw || "10kW",
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

                <h3 className="text-sm font-bold text-slate-900 mt-2">{loc.name}</h3>
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
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="block text-[10px] text-slate-400 font-semibold uppercase">Buildings</span>
                  <span className="font-bold text-slate-800">{loc.building_count}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="block text-[10px] text-slate-400 font-semibold uppercase">Racks</span>
                  <span className="font-bold text-slate-800">{loc.rack_count}</span>
                </div>
                <div className="bg-blue-50/60 p-2 rounded-lg">
                  <span className="block text-[10px] text-blue-600 font-semibold uppercase">Assets</span>
                  <span className="font-bold text-blue-700">{loc.asset_count}</span>
                </div>
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
                <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5 font-mono font-bold text-slate-800">{b.code}</td>
                  <td className="px-5 py-3.5 font-semibold text-slate-900">{b.name}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                      {b.location_name} ({b.location_code})
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 max-w-xs truncate">{b.address || "—"}</td>
                  <td className="px-5 py-3.5 text-center font-bold text-slate-700">{b.floor_count}</td>
                  <td className="px-5 py-3.5 text-center font-bold text-blue-600">{b.rack_count}</td>
                  <td className="px-5 py-3.5 text-right space-x-2">
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
              {filteredFloors.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5 font-mono font-bold text-blue-600 text-sm">{f.floor_number}</td>
                  <td className="px-5 py-3.5 font-semibold text-slate-900">{f.floor_name}</td>
                  <td className="px-5 py-3.5 text-slate-700 font-medium">{f.building_name}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {f.location_name}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center font-bold text-slate-800">{f.rack_count}</td>
                  <td className="px-5 py-3.5 text-right space-x-2">
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
              ))}
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
              {filteredRacks.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-slate-900">{r.rack_name}</td>
                  <td className="px-5 py-3.5 font-mono text-[11px] text-slate-600">{r.rack_number}</td>
                  <td className="px-5 py-3.5 font-medium text-slate-800">
                    {r.location_name} ({r.location_code})
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">
                    {r.floor_name} • {r.room}
                  </td>
                  <td className="px-5 py-3.5 text-[11px]">
                    <span className="font-semibold text-slate-700">{r.power_feed}</span>
                    <span className="text-slate-400 ml-1">({r.max_power_kw})</span>
                  </td>
                  <td className="px-5 py-3.5 text-center font-bold text-slate-700">{r.total_u}U</td>
                  <td className="px-5 py-3.5 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <span className="font-bold text-blue-600">{r.asset_count} assets</span>
                      <span className="text-[10px] text-slate-400">({r.utilization_pct}%)</span>
                    </div>
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full mx-auto mt-1 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${Math.min(r.utilization_pct, 100)}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      onClick={() => {
                        setSelectedElevationRackId(r.id);
                        setActiveTab("elevation");
                      }}
                      className="px-2 py-1 text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors inline-flex items-center space-x-1"
                      title="View 42U Elevation"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Elevation</span>
                    </button>
                    <button
                      onClick={() => openEditRack(r)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100 transition-colors inline-block"
                      title="Edit Rack"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => confirmDelete("rack", r.id, r.rack_name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition-colors inline-block"
                      title="Delete Rack"
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

      {/* TAB 6: 42U DYNAMIC VISUAL ELEVATION */}
      {activeTab === "elevation" && (
        <div className="space-y-6">
          {/* Rack Selector Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <Server className="w-5 h-5 text-blue-600" />
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400">Select Rack to Inspect</label>
                <select
                  value={selectedElevationRackId || ""}
                  onChange={(e) => setSelectedElevationRackId(Number(e.target.value))}
                  className="mt-0.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {racks.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.rack_name} ({r.rack_number}) — {r.location_name} / {r.room}
                    </option>
                  ))}
                </select>
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
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Device Hostname</span>
                    <span className="font-bold text-base text-slate-900">{selectedUnitItem.hostname}</span>
                    <span className="text-xs text-slate-500 block font-mono mt-0.5">{selectedUnitItem.asset_id}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Manufacturer</span>
                      <span className="font-semibold text-slate-800">{selectedUnitItem.manufacturer || "Cisco Systems"}</span>
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

                  <div className="pt-4 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Operational State</span>
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="font-bold text-emerald-700">{selectedUnitItem.operational_status || "Operational"}</span>
                    </div>
                  </div>
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
                    placeholder="noc@phillip.com.hk"
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
    </div>
  );
}
