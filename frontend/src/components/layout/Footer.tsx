"use client";

import React, { useState } from "react";
import { Info, HelpCircle, PhoneCall, X, ShieldCheck, Mail, MapPin, ExternalLink, Cpu, Terminal } from "lucide-react";

export function Footer() {
  const [modalType, setModalType] = useState<"about" | "help" | "contact" | null>(null);

  return (
    <>
      <footer className="min-h-10 py-2 sm:py-0 bg-white border-t border-slate-200 px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-0 text-xs text-slate-500 shrink-0">
        <div className="italic text-slate-600 font-medium tracking-tight">
          Trusted Partner. Connecting Markets.
        </div>
        <div className="flex items-center space-x-3 text-slate-500 font-medium">
          <button
            type="button"
            onClick={() => setModalType("about")}
            className="hover:text-blue-600 transition-colors cursor-pointer"
          >
            About
          </button>
          <span className="text-slate-300">|</span>
          <button
            type="button"
            onClick={() => setModalType("help")}
            className="hover:text-blue-600 transition-colors cursor-pointer"
          >
            Help
          </button>
          <span className="text-slate-300">|</span>
          <button
            type="button"
            onClick={() => setModalType("contact")}
            className="hover:text-blue-600 transition-colors cursor-pointer"
          >
            Contact IT
          </button>
        </div>
      </footer>

      {/* About Modal */}
      {modalType === "about" && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                  P
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Phillip Securities (Hong Kong)</h3>
                  <p className="text-[11px] text-slate-500">Network Asset Management System</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p>
                An enterprise-grade internal platform designed for the complete lifecycle management of corporate network devices, data center racks, vendor maintenance contracts, rental equipment, IPAM allocations, and real-time topology relationships.
              </p>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">System Version:</span>
                  <span className="font-mono font-bold text-slate-900">v1.0.0 Enterprise</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Architecture:</span>
                  <span className="text-slate-800">Next.js 16 + FastAPI + PostgreSQL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Security:</span>
                  <span className="text-emerald-700 font-semibold flex items-center">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1" /> TOTP Google Authenticator 2FA
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Compliance:</span>
                  <span className="text-slate-800">HK SFC Regulatory Standards</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                © {new Date().getFullYear()} Phillip Securities Group. All internal assets and confidential records protected under corporate compliance policies.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {modalType === "help" && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center">
                <HelpCircle className="w-4 h-4 mr-2 text-blue-600" />
                System User Guide & Search Hints
              </h3>
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div>
                <h4 className="font-bold text-slate-900 mb-1">Global Header Search</h4>
                <p>
                  Press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-[10px]">Enter</kbd> in the top search bar to filter across all physical assets by Serial Number, Hostname, Management IP, or Asset ID.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">Navigation & Sub-Menus</h4>
                <p>
                  Click the chevron icon next to Assets, Contracts, Locations, Reports, or Settings in the left sidebar to expand specific sub-views such as Network Devices, Rental Agreements, Data Centers, and Roles.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">Google 2FA Authentication</h4>
                <p>
                  Click your profile avatar at the top right, select <span className="font-semibold text-blue-600">Setup Google Authenticator</span>, scan the QR code with Google Authenticator on your mobile device, and submit the 6-digit TOTP code.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">Excel & CSV Exports</h4>
                <p>
                  Official audit spreadsheets can be exported directly from the Quick Links on the dashboard or within the Reports module.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact IT Modal */}
      {modalType === "contact" && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center">
                <PhoneCall className="w-4 h-4 mr-2 text-blue-600" />
                IT NOC & Infrastructure Support Contacts
              </h3>
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Support Operations Hotline</span>
                  <span className="font-mono font-bold text-blue-600">
                    —
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Emergency Support Email</span>
                  <span className="text-blue-600 font-mono">
                    noc@internal.local
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Datacenter Escalation</span>
                  <span className="font-mono text-slate-900">—</span>
                </div>
              </div>

              <div className="space-y-1.5 text-slate-600">
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    Primary Network Operations & Datacenter Facility
                  </span>
                </div>
                <div className="flex items-start space-x-2">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>Asset Management NOC Ticketing: #ticket-noc internal portal</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
