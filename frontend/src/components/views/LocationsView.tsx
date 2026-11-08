"use client";

import React, { useState, useEffect } from "react";
import { MapPin, Server, Building, Layers, Eye, ShieldCheck, Zap } from "lucide-react";
import { apiUrl } from "@/lib/api";

interface LocationsViewProps {
  initialSub?: string;
}

export function LocationsView({ initialSub = "sites" }: LocationsViewProps) {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSite, setSelectedSite] = useState<any>(null);
  const [selectedRack, setSelectedRack] = useState<any>(null);

  useEffect(() => {
    fetch(apiUrl("/api/v1/locations"))
      .then((res) => res.json())
      .then((data) => {
        setLocations(data);
        if (data.length > 0) {
          let chosen = data[0];
          if (initialSub === "datacenters") {
            const dc = data.find((l: any) => l.type === "Data Center");
            if (dc) chosen = dc;
          }
          setSelectedSite(chosen);
          if (chosen.racks && chosen.racks.length > 0) {
            setSelectedRack(chosen.racks[0]);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [initialSub]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Datacenter & Location Infrastructure
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Hierarchical facility tracking across Headquarters, Hong Kong carrier-neutral data centers, branch offices, and disaster recovery sites.
        </p>
      </div>

      {/* Sites Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {locations.map((loc) => {
          const isSelected = selectedSite?.id === loc.id;
          return (
            <button
              key={loc.id}
              onClick={() => {
                setSelectedSite(loc);
                if (loc.racks && loc.racks.length > 0) {
                  setSelectedRack(loc.racks[0]);
                }
              }}
              className={`p-4 rounded-xl border text-left transition-all ${
                isSelected
                  ? "bg-white border-blue-600 ring-2 ring-blue-500/20 shadow-md"
                  : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold font-mono text-slate-400">
                  {loc.code}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 mt-1 truncate">
                {loc.name}
              </h3>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">{loc.type}</p>
              <div className="mt-3 flex items-center justify-between text-[11px] pt-2 border-t border-slate-100">
                <span className="text-slate-500">{loc.rack_count} Racks</span>
                <span className="font-bold text-blue-600">{loc.asset_count} Assets</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Detailed Facility & 42U Rack Elevation View */}
      {selectedSite && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Site Overview Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <MapPin className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-800">
                {selectedSite.name} ({selectedSite.code})
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Physical Address</span>
                <span className="text-slate-800 font-medium">{selectedSite.address}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block text-[11px]">Facility Type</span>
                  <span className="font-semibold text-slate-900">{selectedSite.type}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Primary NOC Contact</span>
                  <span className="font-semibold text-slate-900">{selectedSite.contact_person}</span>
                </div>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">NOC Operations Hotline</span>
                <span className="font-mono text-blue-600 font-bold">{selectedSite.contact_phone}</span>
              </div>
            </div>

            {/* Racks Selector */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 mb-2">Available Racks</h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {selectedSite.racks?.map((r: any) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRack(r)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-colors ${
                      selectedRack?.id === r.id
                        ? "bg-blue-50 text-blue-700 font-semibold border border-blue-200"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Server className="w-3.5 h-3.5" />
                      <span>{r.rack_name}</span>
                    </div>
                    <span className="text-[11px] text-slate-500">{r.asset_count} units</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 42U Visual Rack Elevation */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center space-x-2">
                <Server className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-800">
                  Rack Elevation: {selectedRack ? selectedRack.rack_name : "Select Rack"} (42U Standard)
                </h3>
              </div>
              <div className="flex items-center space-x-3 text-[11px]">
                <div className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded bg-blue-600" />
                  <span className="text-slate-600">Occupied U</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded bg-slate-100 border border-slate-200" />
                  <span className="text-slate-600">Available U</span>
                </div>
              </div>
            </div>

            {/* 42U Chassis Visualizer */}
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 flex flex-col space-y-1 font-mono text-[10px] text-slate-400 max-h-[460px] overflow-y-auto">
              {Array.from({ length: 24 }).map((_, i) => {
                const uNum = 42 - i;
                const isOccupied = [42, 41, 40, 36, 35, 34, 30, 29, 24, 20, 18, 12, 10, 6, 2].includes(uNum);
                const deviceLabel =
                  uNum === 42 ? "Cisco Nexus 93180YC (Leaf-01)" :
                  uNum === 40 ? "Palo Alto PA-3220 (FW-01-HK)" :
                  uNum === 36 ? "Cisco Catalyst 9300-48P (SW-01-HK)" :
                  uNum === 30 ? "Huawei CloudEngine S5735 (SW-02-HK)" :
                  uNum === 24 ? "Fortinet FortiGate 100F (FW-02-HK)" :
                  uNum === 20 ? "Cisco ISR4431 Multi-Service WAN Router" :
                  uNum === 10 ? "Console Access Server (Opengear 24-port)" : null;

                return (
                  <div
                    key={uNum}
                    className={`h-7 px-3 rounded flex items-center justify-between border ${
                      isOccupied
                        ? "bg-[#142B50] border-blue-500/50 text-white font-medium"
                        : "bg-slate-800/40 border-slate-700/30 text-slate-500"
                    }`}
                  >
                    <span className="w-6 shrink-0 text-slate-400">U{uNum}</span>
                    <span className="truncate flex-1 px-3">
                      {isOccupied ? deviceLabel : "— Empty Slot —"}
                    </span>
                    <span className="shrink-0 text-[9px] uppercase tracking-wider">
                      {isOccupied ? (
                        <span className="inline-flex items-center text-emerald-400">
                          <Zap className="w-2.5 h-2.5 mr-1" /> Dual PDU
                        </span>
                      ) : (
                        "Ready"
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

