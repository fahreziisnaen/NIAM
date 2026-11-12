"use client";

import React, { useState, useEffect } from "react";
import { X, Server, Check, AlertCircle } from "lucide-react";
import { apiUrl } from "@/lib/api";

interface AssetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
  isEdit?: boolean;
}

export function AssetFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  isEdit = false,
}: AssetFormModalProps) {
  const [locations, setLocations] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    asset_id: "AUTO",
    hostname: "",
    serial_number: "",
    asset_tag: "",
    manufacturer: "",
    model_name: "",
    category_name: "Switch",
    device_role: "",
    ownership_type: "Company Owned",
    rental_provider: "",
    rental_agreement_ref: "",
    monthly_rental_cost: 0,
    management_ip: "",
    mac_address: "",
    firmware_version: "",
    operating_system: "",
    location_code: "",
    rack_position: "",
    vlan: "",
    subnet: "",
    operational_status: "Deployed",
    asset_condition: "Operational",
    purchase_price: 0,
    description: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch(apiUrl("/api/v1/locations"))
      .then((res) => res.json())
      .then((data) => setLocations(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        asset_id: initialData.asset_id || "",
        hostname: initialData.hostname || "",
        serial_number: initialData.serial_number || "",
        asset_tag: initialData.asset_tag || "",
        manufacturer: initialData.manufacturer || "",
        model_name: initialData.model || initialData.model_name || "",
        category_name: initialData.category_name || "Switch",
        device_role: initialData.device_role || "",
        ownership_type: initialData.ownership || initialData.ownership_type || "Company Owned",
        rental_provider: initialData.rental_provider || "",
        rental_agreement_ref: initialData.rental_agreement_ref || "",
        monthly_rental_cost: initialData.monthly_rental_cost || 0,
        management_ip: initialData.management_ip || "",
        mac_address: initialData.mac_address || "",
        firmware_version: initialData.firmware_version || "",
        operating_system: initialData.operating_system || "",
        location_code: initialData.location?.split(" / ")[0] || "",
        rack_position: initialData.location || "",
        vlan: initialData.vlan || "",
        subnet: initialData.subnet || "",
        operational_status: initialData.status || initialData.operational_status || "Deployed",
        asset_condition: initialData.asset_condition || "Operational",
        purchase_price: initialData.purchase_price || 0,
        description: initialData.description || "",
      });
    } else {
      setFormData({
        asset_id: "AUTO",
        hostname: "",
        serial_number: "",
        asset_tag: "",
        manufacturer: "",
        model_name: "",
        category_name: "Switch",
        device_role: "",
        ownership_type: "Company Owned",
        rental_provider: "",
        rental_agreement_ref: "",
        monthly_rental_cost: 0,
        management_ip: "",
        mac_address: "",
        firmware_version: "",
        operating_system: "",
        location_code: "",
        rack_position: "",
        vlan: "",
        subnet: "",
        operational_status: "Deployed",
        asset_condition: "Operational",
        purchase_price: 0,
        description: "",
      });
    }
    setErrorMsg(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.hostname.trim()) {
      setErrorMsg("Device hostname is required");
      return;
    }
    if (!formData.serial_number.trim()) {
      setErrorMsg("Serial number is required");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const isRent = formData.ownership_type === "Rental" || formData.ownership_type === "Leased";

    const payload = {
      asset_id: formData.asset_id === "AUTO" ? "" : formData.asset_id,
      hostname: formData.hostname.trim(),
      serial_number: formData.serial_number.trim(),
      asset_tag: formData.asset_tag.trim(),
      manufacturer: formData.manufacturer,
      device_name: formData.model_name ? `${formData.model_name} (${formData.hostname})` : formData.hostname,
      description: formData.description,
      device_type: "Network Infrastructure",
      device_role: formData.device_role,
      ownership_type: formData.ownership_type,
      rental_provider: isRent ? (formData.rental_provider || null) : null,
      rental_agreement_ref: isRent ? (formData.rental_agreement_ref || null) : null,
      monthly_rental_cost: isRent ? (Number(formData.monthly_rental_cost) || 0) : 0,
      management_ip: formData.management_ip.trim(),
      mac_address: formData.mac_address.trim(),
      firmware_version: formData.firmware_version,
      operating_system: formData.operating_system,
      location_display: formData.location_code && formData.rack_position
        ? `${formData.location_code} / ${formData.rack_position}`
        : formData.location_code || formData.rack_position || "",
      vlan: formData.vlan,
      subnet: formData.subnet,
      operational_status: formData.operational_status,
      asset_condition: formData.asset_condition,
      purchase_price: Number(formData.purchase_price) || 0,
      currency: "HKD",
    };

    try {
      const url = isEdit
        ? apiUrl(`/api/v1/assets/${initialData.id || initialData.asset_id}`)
        : apiUrl("/api/v1/assets");
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to save asset record");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while saving the asset.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <Server className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              {isEdit ? `Edit Network Asset (${formData.asset_id})` : "Register New Network Asset"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Identification Section */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 text-blue-700">
              1. Device Identification
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Hostname *</label>
                <input
                  type="text"
                  name="hostname"
                  value={formData.hostname}
                  onChange={handleChange}
                  placeholder="e.g. SW-03-HK"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Serial Number *</label>
                <input
                  type="text"
                  name="serial_number"
                  value={formData.serial_number}
                  onChange={handleChange}
                  placeholder="e.g. FGL29482011"
                  className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Asset Tag</label>
                <input
                  type="text"
                  name="asset_tag"
                  value={formData.asset_tag}
                  onChange={handleChange}
                  placeholder="e.g. PSHK-00123"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* 2. Hardware & Manufacturer (Principal) */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 text-blue-700">
              2. Hardware & Manufacturer (Principal OEM)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Manufacturer (Principal) *
                </label>
                <select
                  name="manufacturer"
                  value={formData.manufacturer}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Cisco">Cisco Systems</option>
                  <option value="Palo Alto">Palo Alto Networks</option>
                  <option value="Fortinet">Fortinet</option>
                  <option value="Huawei">Huawei Technologies</option>
                  <option value="Aruba">Aruba / HPE</option>
                  <option value="Juniper">Juniper Networks</option>
                  <option value="Arista">Arista Networks</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Model Name</label>
                <input
                  type="text"
                  name="model_name"
                  value={formData.model_name}
                  onChange={handleChange}
                  placeholder="e.g. C9300-48P"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Category</label>
                <select
                  name="category_name"
                  value={formData.category_name}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Switch">Switch</option>
                  <option value="Router">Router</option>
                  <option value="Firewall">Firewall</option>
                  <option value="Wireless">Wireless AP</option>
                  <option value="Others">Others / Controller</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. Ownership & Operational Status */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 text-blue-700">
              3. Ownership & Operational Status
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Ownership Type</label>
                <select
                  name="ownership_type"
                  value={formData.ownership_type}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Company Owned">Company Owned</option>
                  <option value="Rental">Rental</option>
                  <option value="Leased">Leased</option>
                  <option value="Vendor Provided">Vendor Provided</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Operational Status</label>
                <select
                  name="operational_status"
                  value={formData.operational_status}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Deployed">Deployed</option>
                  <option value="In Maintenance">In Maintenance</option>
                  <option value="In Stock">In Stock</option>
                  <option value="Decommissioned">Decommissioned</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Site Location</label>
                <select
                  name="location_code"
                  value={formData.location_code}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">Select Location</option>
                  {locations.map((loc) => (
                    <option key={loc.id || loc.code} value={loc.code}>
                      {loc.code} - {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Conditional Rental / Leased Distributor Configuration */}
            {(formData.ownership_type === "Rental" || formData.ownership_type === "Leased") && (
              <div className="mt-3 p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between text-amber-900 text-[11px] font-bold">
                  <span className="flex items-center">
                    <span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5 inline-block"></span>
                    Rental Provider & Distributor Information
                  </span>
                  <span className="text-[10px] font-normal text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
                    Non-Principal Leasing
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-700 block mb-1">
                      Distributor / Rental Provider *
                    </label>
                    <input
                      type="text"
                      name="rental_provider"
                      value={formData.rental_provider}
                      onChange={handleChange}
                      list="distributor-options"
                      placeholder="e.g. HKT Enterprise Solutions"
                      className="w-full px-3 py-1.5 text-xs border border-amber-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                    />
                    <datalist id="distributor-options">
                      <option value="HKT Enterprise Solutions" />
                      <option value="PCCW Solutions" />
                      <option value="SiS Technologies HK" />
                      <option value="Automated Systems HK (ASL)" />
                      <option value="Synnex Technology HK" />
                      <option value="Ingram Micro HK" />
                      <option value="HKBN Enterprise Solutions" />
                    </datalist>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-700 block mb-1">
                      Monthly Rental Cost (HKD)
                    </label>
                    <input
                      type="number"
                      name="monthly_rental_cost"
                      value={formData.monthly_rental_cost}
                      onChange={handleChange}
                      placeholder="e.g. 4500"
                      className="w-full px-3 py-1.5 text-xs font-mono border border-amber-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-700 block mb-1">
                      Rental Agreement Ref / Contract #
                    </label>
                    <input
                      type="text"
                      name="rental_agreement_ref"
                      value={formData.rental_agreement_ref}
                      onChange={handleChange}
                      placeholder="e.g. RA-2024-HKT-99"
                      className="w-full px-3 py-1.5 text-xs font-mono border border-amber-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-amber-800 leading-relaxed">
                  💡 <b>Distributor Architecture:</b> The hardware manufacturer remains recorded as the Principal (<b>{formData.manufacturer}</b>), while the local commercial entity leasing the equipment and invoicing monthly is recorded as the <b>Distributor / Rental Provider</b>.
                </p>
              </div>
            )}
          </div>

          {/* 4. Technical Network Configuration */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 text-blue-700">
              4. Technical & Network Parameters
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Management IP</label>
                <input
                  type="text"
                  name="management_ip"
                  value={formData.management_ip}
                  onChange={handleChange}
                  placeholder="e.g. 10.200.10.45"
                  className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">MAC Address</label>
                <input
                  type="text"
                  name="mac_address"
                  value={formData.mac_address}
                  onChange={handleChange}
                  placeholder="e.g. 00:1B:17:XX:YY:ZZ"
                  className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">VLAN</label>
                <input
                  type="text"
                  name="vlan"
                  value={formData.vlan}
                  onChange={handleChange}
                  placeholder="e.g. VLAN 100"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Rack Position</label>
                <input
                  type="text"
                  name="rack_position"
                  value={formData.rack_position}
                  onChange={handleChange}
                  placeholder="e.g. Rack A1 / U24"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">Operational Description / Notes</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              placeholder="Primary uplink, rack notes, interface configuration..."
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#1E60D5] hover:bg-blue-700 rounded-lg shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isEdit ? "Update Asset" : "Register Asset"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
