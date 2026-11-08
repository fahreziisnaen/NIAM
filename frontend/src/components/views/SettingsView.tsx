"use client";

import React, { useState, useEffect } from "react";
import { Settings, Users, Shield, History, Key, Check, Plus, AlertCircle, ShieldCheck, ShieldAlert, Smartphone, RefreshCw, Trash2, Send, Mail, BellRing } from "lucide-react";
import { TwoFactorSetupModal } from "@/components/auth/TwoFactorSetupModal";
import { AlertRulesView } from "@/components/views/AlertRulesView";
import { apiUrl } from "@/lib/api";

interface SettingsViewProps {
  initialTab?: string;
  currentUser?: any;
  onRefreshUser?: () => void;
}

export function SettingsView({ initialTab = "users", currentUser, onRefreshUser }: SettingsViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"users" | "roles" | "audit" | "system" | "alerts">(
    initialTab === "roles" || initialTab === "audit" || initialTab === "system" || initialTab === "alerts" ? initialTab : "users"
  );

  useEffect(() => {
    if (initialTab === "roles" || initialTab === "audit" || initialTab === "system" || initialTab === "users" || initialTab === "alerts") {
      setActiveSubTab(initialTab as any);
    }
  }, [initialTab]);

  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 2FA Setup Modal State
  const [twoFactorModalOpen, setTwoFactorModalOpen] = useState(false);
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);

  // New User Form State
  const [newUserOpen, setNewUserOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDepartment, setNewDepartment] = useState("IT Infrastructure");
  const [newRole, setNewRole] = useState("VIEWER");
  const [newPassword, setNewPassword] = useState("Phillip2026!");
  const [formError, setFormError] = useState<string | null>(null);

  // Alert & Notification Gateway Configuration State
  const [gatewayApiEndpoint, setGatewayApiEndpoint] = useState("https://api.gateway.com/send");
  const [gatewayApiKey, setGatewayApiKey] = useState("API_KEY_ANDA");
  const [gatewayTargetId, setGatewayTargetId] = useState("628123456789");
  const [gatewayFromSender, setGatewayFromSender] = useState("respon");
  const [gatewayEmailRecipients, setGatewayEmailRecipients] = useState("noc@phillip.com.hk, infrastructure-team@phillip.com.hk");
  const [gatewaySaving, setGatewaySaving] = useState(false);
  const [gatewaySaveMsg, setGatewaySaveMsg] = useState<string | null>(null);

  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const loadAlertSettings = () => {
    fetch(apiUrl("/api/v1/notifications/config/settings"))
      .then((res) => res.json())
      .then((data) => {
        if (data.api_endpoint) setGatewayApiEndpoint(data.api_endpoint);
        if (data.api_key) setGatewayApiKey(data.api_key);
        if (data.target_id) setGatewayTargetId(data.target_id);
        if (data.from_sender) setGatewayFromSender(data.from_sender);
        if (data.email_recipients) setGatewayEmailRecipients(data.email_recipients);
      })
      .catch(() => {});
  };

  const handleSaveAlertSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setGatewaySaving(true);
    setGatewaySaveMsg(null);
    try {
      const res = await fetch(apiUrl("/api/v1/notifications/config/settings"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_endpoint: gatewayApiEndpoint.trim(),
          api_key: gatewayApiKey.trim(),
          target_id: gatewayTargetId.trim(),
          from_sender: gatewayFromSender.trim(),
          email_recipients: gatewayEmailRecipients.trim(),
        }),
      });
      if (res.ok) {
        setGatewaySaveMsg("Alert Gateway configuration saved successfully!");
      }
    } catch {
      setGatewaySaveMsg("Failed to save gateway configuration");
    } finally {
      setGatewaySaving(false);
    }
  };

  const handleSendTestAlert = async () => {
    setTestSending(true);
    setTestResult(null);
    try {
      const res = await fetch(apiUrl("/api/v1/notifications/send-alert"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Phillip Securities HK Alert Gateway Test",
          message: "Hello World! Test alert from Phillip Securities Hong Kong Network Asset Management System.",
          channels: ["api", "email"],
          api_endpoint: gatewayApiEndpoint.trim(),
          api_key: gatewayApiKey.trim(),
          target_id: gatewayTargetId.trim(),
          from_sender: gatewayFromSender.trim(),
          email_to: gatewayEmailRecipients.trim(),
        }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch {
      setTestResult({ success: false, message: "Gateway connection failed" });
    } finally {
      setTestSending(false);
    }
  };

  const getAuthToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("phillip_token") || "";
    }
    return "";
  };

  const loadUsers = () => {
    const token = getAuthToken();
    fetch(apiUrl("/api/v1/auth/users"), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setUsers(data);
      })
      .catch(() => {});
  };

  const loadAuditLogs = () => {
    const token = getAuthToken();
    fetch(apiUrl("/api/v1/auth/audit-logs?limit=50"), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setAuditLogs(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadUsers();
    loadAuditLogs();
    loadAlertSettings();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) {
      setFormError("Username is required.");
      return;
    }

    setFormError(null);
    try {
      const token = getAuthToken();
      const payload: any = {
        username: newUsername.trim(),
        full_name: newName.trim(),
        title: newTitle.trim() || undefined,
        department: newDepartment.trim() || "IT Infrastructure",
        role_name: newRole,
        password: newPassword,
      };

      // Email is strictly optional
      if (newEmail.trim()) {
        payload.email = newEmail.trim();
      }

      const res = await fetch(apiUrl("/api/v1/auth/users"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        setFormError(err.detail || "Failed to create user");
        return;
      }

      setNewUserOpen(false);
      setNewUsername("");
      setNewEmail("");
      setNewName("");
      setNewTitle("");
      loadUsers();
      loadAuditLogs();
    } catch {
      setFormError("Error submitting user form");
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm("Are you sure you want to disable Google Authenticator 2FA for this account?")) {
      return;
    }
    setIsDisabling2FA(true);
    try {
      const token = getAuthToken();
      const res = await fetch(apiUrl("/api/v1/auth/2fa/disable"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        alert("Two-Factor Authentication has been disabled.");
        loadUsers();
        if (onRefreshUser) onRefreshUser();
      } else {
        alert("Failed to disable 2FA.");
      }
    } catch {
      alert("Error contacting server.");
    } finally {
      setIsDisabling2FA(false);
    }
  };

  const isCurrent2FAActive = Boolean(currentUser?.is_two_factor_enabled);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          System Administration & Governance
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Role-Based Access Control (RBAC), user provisioning, Google Authenticator 2FA, immutable audit trails, and system parameters.
        </p>
      </div>

      {/* Settings Sub-Tabs */}
      <div className="flex border-b border-slate-200 space-x-4 overflow-x-auto no-scrollbar">
        {[
          { id: "users", label: "User Management & 2FA", icon: Users },
          { id: "roles", label: "Roles & Permissions", icon: Shield },
          { id: "alerts", label: "Alert Automation & Rules", icon: BellRing },
          { id: "audit", label: "Audit Logs", icon: History },
          { id: "system", label: "System Configuration", icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center space-x-2 py-3 px-2 text-xs font-semibold border-b-2 transition-all ${
                isActive
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Subtab 1: User Management & 2FA */}
      {activeSubTab === "users" && (
        <div className="space-y-5">
          {/* 2FA Security Banner Card */}
          <div className="bg-gradient-to-r from-[#0A192F] to-[#162D4D] rounded-2xl p-5 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-bold text-sm tracking-tight text-white">
                    Google Authenticator 2FA
                  </h4>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isCurrent2FAActive
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                        : "bg-amber-500/20 text-amber-300 border border-amber-400/30"
                    }`}
                  >
                    {isCurrent2FAActive ? "Protected (Active)" : "Action Recommended"}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Secure your account (<span className="font-semibold text-blue-200">{currentUser?.username || "admin"}</span>) using Time-based One-Time Password (TOTP).
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 shrink-0 w-full md:w-auto justify-end">
              {isCurrent2FAActive ? (
                <>
                  <button
                    onClick={() => setTwoFactorModalOpen(true)}
                    className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg border border-white/20 transition-all flex items-center space-x-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reconfigure 2FA</span>
                  </button>
                  <button
                    onClick={handleDisable2FA}
                    disabled={isDisabling2FA}
                    className="px-3.5 py-1.5 bg-red-600/80 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-all"
                  >
                    {isDisabling2FA ? "Disabling..." : "Disable 2FA"}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setTwoFactorModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center space-x-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Configure Google Authenticator</span>
                </button>
              )}
            </div>
          </div>

          {/* Provisioned Users Table */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold text-slate-800">
                  Provisioned Enterprise Users ({users.length})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Login is authenticated by username and password. Email is optional.
                </p>
              </div>
              <button
                onClick={() => {
                  setFormError(null);
                  setNewUserOpen(true);
                }}
                className="flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add User</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 text-[11px] uppercase bg-slate-50/60">
                    <th className="py-2.5 px-3">Username</th>
                    <th className="py-2.5 px-3">Full Name</th>
                    <th className="py-2.5 px-3">Email (Optional)</th>
                    <th className="py-2.5 px-3">Title</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Assigned Role</th>
                    <th className="py-2.5 px-3">2FA Security</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-blue-700">
                        {u.username}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{u.full_name}</td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {u.email ? (
                          u.email
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">— None (Optional) —</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-700">{u.title || "—"}</td>
                      <td className="py-3 px-3 text-slate-600">{u.department}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {u.roles?.join(", ") || "VIEWER"}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {u.is_two_factor_enabled ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>2FA Active</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                            Disabled
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: Roles & Permissions Matrix */}
      {activeSubTab === "roles" && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-800">
            Role-Based Access Control (RBAC) Permission Matrix
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 text-[11px] bg-slate-50">
                  <th className="py-2 px-3">Privilege / Scope</th>
                  <th className="py-2 px-3 text-center">SUPER ADMIN</th>
                  <th className="py-2 px-3 text-center">NETWORK ADMIN</th>
                  <th className="py-2 px-3 text-center">ASSET MANAGER</th>
                  <th className="py-2 px-3 text-center">CONTRACT MGR</th>
                  <th className="py-2 px-3 text-center">VIEWER</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {[
                  { name: "View Dashboard & Assets", roles: [true, true, true, true, true] },
                  { name: "Create & Edit Assets", roles: [true, true, true, false, false] },
                  { name: "Decommission & Delete Assets", roles: [true, false, false, false, false] },
                  { name: "Manage IPAM & Subnets", roles: [true, true, false, false, false] },
                  { name: "Configure Network Topology", roles: [true, true, false, false, false] },
                  { name: "Register Contracts & Rentals", roles: [true, false, false, true, false] },
                  { name: "Log Maintenance Tickets", roles: [true, true, true, false, false] },
                  { name: "Transact Spare Parts Stock", roles: [true, true, true, false, false] },
                  { name: "Export Financial & Asset Reports", roles: [true, true, true, true, true] },
                  { name: "Manage Users, 2FA & System Config", roles: [true, false, false, false, false] },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-medium text-slate-800">{row.name}</td>
                    {row.roles.map((has, rIdx) => (
                      <td key={rIdx} className="py-2.5 px-3 text-center">
                        {has ? (
                          <span className="inline-flex w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 items-center justify-center font-bold text-xs">
                            ✓
                          </span>
                        ) : (
                          <span className="text-slate-300 font-bold">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 3: Audit Logs */}
      {activeSubTab === "audit" && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-800">
            Immutable Security & Operations Audit Trail
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 text-[11px] bg-slate-50">
                  <th className="py-2 px-3">Timestamp (UTC)</th>
                  <th className="py-2 px-3">User</th>
                  <th className="py-2 px-3">Action</th>
                  <th className="py-2 px-3">Entity Type</th>
                  <th className="py-2 px-3">Entity ID</th>
                  <th className="py-2 px-3">Audit Details</th>
                  <th className="py-2 px-3">IP Origin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {log.created_at?.slice(0, 19).replace("T", " ")}
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-800">{log.user_email}</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-600">{log.entity_type}</td>
                    <td className="py-2 px-3 font-mono font-semibold text-blue-600">{log.entity_id}</td>
                    <td className="py-2 px-3 text-slate-700 max-w-sm truncate">{log.details}</td>
                    <td className="py-2 px-3 font-mono text-slate-400 text-[11px]">{log.ip_address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 4: System Configuration */}
      {activeSubTab === "system" && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2">
            Enterprise System Configuration Parameters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-3">
              <div>
                <label className="text-slate-500 block mb-1 font-semibold">Application Title</label>
                <input
                  type="text"
                  defaultValue="Phillip Securities Hong Kong – Network Infrastructure Asset Management"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-slate-50"
                  readOnly
                />
              </div>
              <div>
                <label className="text-slate-500 block mb-1 font-semibold">Primary Database Engine</label>
                <input
                  type="text"
                  defaultValue="PostgreSQL 16 Enterprise Relational Database (Alembic Versioned)"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-slate-50"
                  readOnly
                />
              </div>
              <div>
                <label className="text-slate-500 block mb-1 font-semibold">Authentication Engine</label>
                <input
                  type="text"
                  defaultValue="Username & Password Auth + RFC 6238 TOTP (Google Authenticator)"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-slate-50"
                  readOnly
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-slate-500 block mb-1 font-semibold">Contract Expiration Notification Window</label>
                <input
                  type="text"
                  defaultValue="90 Days, 60 Days, 30 Days, 7 Days"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="text-slate-500 block mb-1 font-semibold">Document Storage Backend</label>
                <input
                  type="text"
                  defaultValue="Local NVMe Storage / AWS S3 Compatible Object Store"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="text-slate-500 block mb-1 font-semibold">Daily Backup Time</label>
                <input
                  type="text"
                  defaultValue="02:00 HKT (Automated Snapshots with 30-day retention)"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Card: Alert Gateway Integration (API & Email) */}
          <div className="pt-6 border-t border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <Send className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Outbound Alert & Notification Gateway Configuration (Email & API Webhook)
                </h3>
              </div>
              <span className="text-[10px] bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded font-semibold border border-blue-200">
                Format: Bearer Token & Body JSON &#123;id, message, from&#125;
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Configure outbound alert gateway integrations to automatically forward NOC emergency alerts, expiring contracts, and device telemetry to external WhatsApp / Webhook endpoints and infrastructure team email distribution lists.
            </p>

            {gatewaySaveMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{gatewaySaveMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveAlertSettings} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-800 flex items-center text-xs">
                    <Smartphone className="w-4 h-4 mr-1.5 text-blue-600" />
                    API Webhook / WhatsApp Gateway Parameters
                  </h4>

                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">
                      API Endpoint URL *
                    </label>
                    <input
                      type="text"
                      value={gatewayApiEndpoint}
                      onChange={(e) => setGatewayApiEndpoint(e.target.value)}
                      placeholder="https://api.gateway.com/send"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">
                      API Authorization Key (Header: <span className="font-mono text-blue-700">Bearer API_KEY</span>) *
                    </label>
                    <input
                      type="text"
                      value={gatewayApiKey}
                      onChange={(e) => setGatewayApiKey(e.target.value)}
                      placeholder="YOUR_API_KEY"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-600 block mb-1 font-semibold">
                        Default Destination ID (<span className="font-mono font-bold">id</span>) *
                      </label>
                      <input
                        type="text"
                        value={gatewayTargetId}
                        onChange={(e) => setGatewayTargetId(e.target.value)}
                        placeholder="628123456789"
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-slate-600 block mb-1 font-semibold">
                        Default Sender (<span className="font-mono font-bold">from</span>) *
                      </label>
                      <input
                        type="text"
                        value={gatewayFromSender}
                        onChange={(e) => setGatewayFromSender(e.target.value)}
                        placeholder="respon"
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-[11px] font-mono text-slate-600 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Payload JSON Format:</span>
                    <pre className="text-slate-800 text-[10px]">
{`{
  "id": "${gatewayTargetId}",
  "message": "Hello World!",
  "from": "${gatewayFromSender}"
}`}
                    </pre>
                  </div>
                </div>

                <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-800 flex items-center text-xs">
                    <Mail className="w-4 h-4 mr-1.5 text-emerald-600" />
                    NOC Email Distribution Parameters
                  </h4>

                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">
                      NOC Email Recipients (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={gatewayEmailRecipients}
                      onChange={(e) => setGatewayEmailRecipients(e.target.value)}
                      placeholder="noc@phillip.com.hk, infrastructure-team@phillip.com.hk"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">
                      Internal SMTP Relay Server
                    </label>
                    <input
                      type="text"
                      defaultValue="smtp.phillip.com.hk:587 (TLS Enabled)"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-500"
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">
                      Sender Address
                    </label>
                    <input
                      type="text"
                      defaultValue="noc-alerts@phillip.com.hk"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-500"
                      readOnly
                    />
                  </div>

                  {testResult && (
                    <div className="p-3 bg-white rounded-lg border border-slate-200 text-[11px] space-y-1">
                      <div className="font-bold text-slate-900 flex items-center space-x-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Test Result: {testResult.message}</span>
                      </div>
                      {testResult.results?.map((res: any, idx: number) => (
                        <div key={idx} className="text-slate-600 text-[10px]">
                          • <span className="font-bold">{res.channel}</span>: {res.status} ({res.recipient || res.recipient_id})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSendTestAlert}
                  disabled={testSending}
                  className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
                >
                  {testSending ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5 text-blue-600" />
                  )}
                  <span>Send Test Alert Dispatch</span>
                </button>

                <button
                  type="submit"
                  disabled={gatewaySaving}
                  className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  {gatewaySaving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Save Gateway Settings</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subtab: Alert Automation & Rules */}
      {activeSubTab === "alerts" && (
        <div className="pt-2">
          <AlertRulesView />
        </div>
      )}

      {/* Add User Modal */}
      {newUserOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center">
              <Users className="w-4 h-4 mr-2 text-blue-600" />
              Provision New Enterprise User
            </h3>

            {formError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">
                  Username * <span className="text-[10px] text-slate-400 font-normal">(Used for Login)</span>
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. netops_hk"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:border-blue-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">
                  Password *
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:border-blue-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-semibold">Email Address</label>
                  <span className="text-[10px] text-slate-400 italic">Optional</span>
                </div>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. user@phillip.com.hk (Optional)"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Full Name *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Raymond Wong"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Job Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. NOC Specialist"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Department</label>
                  <input
                    type="text"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    placeholder="e.g. Network Engineering"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Role *</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:border-blue-600 focus:outline-none"
                >
                  <option value="SUPER_ADMIN">SUPER ADMIN</option>
                  <option value="NETWORK_ADMIN">NETWORK ADMIN</option>
                  <option value="ASSET_MANAGER">ASSET MANAGER</option>
                  <option value="CONTRACT_MANAGER">CONTRACT MANAGER</option>
                  <option value="VIEWER">VIEWER</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setNewUserOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  Provision User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Two-Factor Authentication Setup Modal */}
      <TwoFactorSetupModal
        isOpen={twoFactorModalOpen}
        onClose={() => setTwoFactorModalOpen(false)}
        token={getAuthToken()}
        username={currentUser?.username || "admin"}
        onSuccess={() => {
          loadUsers();
          if (onRefreshUser) onRefreshUser();
        }}
      />
    </div>
  );
}
