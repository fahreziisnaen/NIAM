"use client";

import React, { useState, useEffect } from "react";
import { Handshake, Search, Phone, Mail, Globe, Shield, Plus, Building2, X, AlertCircle, Info, Layers, Tag } from "lucide-react";
import { apiUrl } from "@/lib/api";

export function VendorsView() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Principal / OEM (Manufacturer)");
  const [newContact, setNewContact] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newStatus, setNewStatus] = useState("Active");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadVendors = () => {
    setLoading(true);
    let endpoint = "/api/v1/vendors?page=1&page_size=50";
    if (search) endpoint += `&search=${encodeURIComponent(search)}`;
    fetch(apiUrl(endpoint))
      .then((res) => res.json())
      .then((data) => {
        setVendors(data.items || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadVendors();
  }, [search]);

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("phillip_token") : null;
      const res = await fetch(apiUrl("/api/v1/vendors"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          vendor_code: newCode.trim(),
          name: newName.trim(),
          category: newCategory,
          manufacturer: newName.trim(),
          primary_contact: newContact.trim(),
          email: newEmail.trim() || undefined,
          phone: newPhone.trim() || undefined,
          address: newAddress.trim() || undefined,
          status: newStatus,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to create vendor");
      }

      setModalOpen(false);
      setNewCode("");
      setNewName("");
      setNewContact("");
      setNewEmail("");
      setNewPhone("");
      setNewAddress("");
      loadVendors();
    } catch (err: any) {
      setFormError(err.message || "Failed to create vendor");
    } finally {
      setSubmitting(false);
    }
  };

  const getVendorRoleBadge = (category: string, name: string) => {
    const c = category.toLowerCase();
    const n = name.toLowerCase();

    if (c.includes("rental") || c.includes("distributor") || n.includes("hkt") || n.includes("solutions") || n.includes("sis") || n.includes("automated")) {
      return {
        label: "Distributor / Rental Partner",
        bg: "bg-amber-50 text-amber-700 border-amber-200",
        type: "DISTRIBUTOR",
      };
    }
    if (c.includes("data center") || n.includes("mega-i") || n.includes("equinix")) {
      return {
        label: "Data Center Operator",
        bg: "bg-purple-50 text-purple-700 border-purple-200",
        type: "DATACENTER",
      };
    }
    if (c.includes("carrier") || c.includes("transit") || n.includes("pccw global")) {
      return {
        label: "Carrier & Connectivity",
        bg: "bg-cyan-50 text-cyan-700 border-cyan-200",
        type: "CARRIER",
      };
    }
    return {
      label: "Principal / OEM (Manufacturer)",
      bg: "bg-blue-50 text-blue-700 border-blue-200",
      type: "PRINCIPAL",
    };
  };

  const filteredVendors = vendors.filter((v) => {
    if (selectedCategory === "ALL") return true;
    const badge = getVendorRoleBadge(v.category || "", v.name || "");
    return badge.type === selectedCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Vendor Master Database
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Directory of hardware principals (OEM), authorized leasing distributors, telco carriers, and datacenter partners in Hong Kong.
          </p>
        </div>

        <button
          onClick={() => {
            setNewCode(`VND-0${vendors.length + 1}`);
            setFormError(null);
            setModalOpen(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-white bg-[#1E60D5] hover:bg-blue-700 rounded-lg shadow-sm transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Vendor</span>
        </button>
      </div>

      {/* Explanatory Banner: Principal vs Distributor / Rental Provider */}
      <div className="p-4 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-slate-50 border border-blue-200/70 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-blue-600 text-white rounded-xl shadow-sm shrink-0 mt-0.5">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">
              Role Distinction: Principal (OEM) vs Authorized Distributor & Rental Provider
            </h4>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed max-w-4xl">
              Network hardware is manufactured by <b>Principals / OEMs</b> (such as Cisco, Palo Alto, Huawei, Fortinet) who author firmware and hold global licensing. However, in enterprise leasing (<b>Rental / Leased</b>), contracts, monthly invoicing, and local field replacement are handled by <b>Authorized Local Distributors & Systems Integrators</b> (such as HKT Enterprise Solutions, PCCW Solutions, SiS Technologies, Automated Systems HK). This directory tracks both tiers, ensuring asset lifecycles, SLAs, and recurring rental billing stay synchronized.
            </p>
          </div>
        </div>
      </div>

      {/* Controls: Search & Category Chips */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendor name, contact..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
        </div>

        {/* Category Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "ALL", label: "All Vendors" },
            { id: "PRINCIPAL", label: "Principal / OEM" },
            { id: "DISTRIBUTOR", label: "Distributor & Rental" },
            { id: "CARRIER", label: "Carriers" },
            { id: "DATACENTER", label: "Data Centers" },
          ].map((chip) => (
            <button
              key={chip.id}
              onClick={() => setSelectedCategory(chip.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === chip.id
                  ? "bg-[#0A192F] text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Vendor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 py-12 text-center text-slate-400 text-xs">
            Loading vendors directory...
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="col-span-3 py-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
            No vendors found matching this category filter.
          </div>
        ) : (
          filteredVendors.map((v) => {
            const roleBadge = getVendorRoleBadge(v.category || "", v.name || "");
            return (
              <div
                key={v.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      {v.vendor_code}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {v.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mt-2">
                    {v.name}
                  </h3>

                  {/* Role Pill */}
                  <div className="mt-1.5 flex items-center space-x-1.5">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${roleBadge.bg}`}>
                      {roleBadge.label}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{v.address || "Hong Kong"}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{v.phone || "+852 2888 8888"}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{v.email || "support@vendor.com"}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Metrics */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-4">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Assets</span>
                      <span className="font-bold text-slate-800">{v.asset_count}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Contracts</span>
                      <span className="font-bold text-blue-600">{v.contract_count}</span>
                    </div>
                  </div>

                  <a
                    href={v.website || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-slate-50 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Visit Website"
                  >
                    <Globe className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Vendor Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center">
                <Handshake className="w-4 h-4 mr-2 text-blue-600" />
                Register New Enterprise Vendor
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateVendor} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Vendor Code *</label>
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="e.g. VND-015"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:border-blue-600 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Role / Category *</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:border-blue-600 focus:outline-none"
                  >
                    <option value="Principal / OEM (Manufacturer)">Principal / OEM (Manufacturer)</option>
                    <option value="Distributor & Rental Partner">Distributor & Rental Partner</option>
                    <option value="System Integrator (SI)">System Integrator (SI)</option>
                    <option value="Telecom & Connectivity">Telecom & Connectivity</option>
                    <option value="Data Center Operator">Data Center Operator</option>
                    <option value="Network Hardware">Network Hardware</option>
                    <option value="Security">Security</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Vendor / Company Name *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. SiS Technologies HK / Cisco Systems"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Primary Contact *</label>
                  <input
                    type="text"
                    value={newContact}
                    onChange={(e) => setNewContact(e.target.value)}
                    placeholder="e.g. Marcus Kwok"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Phone</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="e.g. +852 2888 8888"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Support Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. support-hk@vendor.com"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Physical Address</label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="e.g. Quarry Bay / Central, Hong Kong"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm cursor-pointer"
                >
                  {submitting ? "Saving..." : "Register Vendor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
