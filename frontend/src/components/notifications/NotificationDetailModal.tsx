"use client";

import React, { useState, useEffect } from "react";
import { apiUrl } from "@/lib/api";
import {
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  Mail,
  Smartphone,
  Check,
  ExternalLink,
  RefreshCw,
  Info,
} from "lucide-react";

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  severity: "info" | "warning" | "danger";
  is_read: boolean;
  created_at: string;
  reference_type?: string;
  reference_id?: string;
}

interface NotificationDetailModalProps {
  isOpen: boolean;
  notification: NotificationItem | null;
  onClose: () => void;
  onMarkRead?: (id: number) => void;
  onNavigateToResource?: (tab: string, sub?: string) => void;
}

export function NotificationDetailModal({
  isOpen,
  notification,
  onClose,
  onMarkRead,
  onNavigateToResource,
}: NotificationDetailModalProps) {
  const [activeChannel, setActiveChannel] = useState<"api" | "email" | null>(null);
  const [targetId, setTargetId] = useState("");
  const [emailTo, setEmailTo] = useState("");
  const [customMessage, setCustomMessage] = useState("");

  const [isSending, setIsSending] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<any>(null);
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  // Load gateway defaults on modal open
  useEffect(() => {
    if (isOpen && notification) {
      setCustomMessage(
        `[${notification.severity.toUpperCase()}] ${notification.title}\n${notification.message}${
          notification.reference_id ? ` (Ref: ${notification.reference_id})` : ""
        }`
      );
      setActiveChannel(null);
      setDispatchResult(null);
      setDispatchError(null);

      fetch(apiUrl("/api/v1/notifications/config/settings"))
        .then((res) => res.json())
        .then((cfg) => {
          if (cfg) {
            setTargetId(cfg.target_id || cfg.default_target_id || "");
            setEmailTo(cfg.email_recipients || cfg.default_email_to || "");
          }
        })
        .catch(() => {});
    }
  }, [isOpen, notification]);

  if (!isOpen || !notification) return null;

  const handleMarkAsRead = async () => {
    try {
      await fetch(apiUrl(`/api/v1/notifications/${notification.id}/read`), {
        method: "POST",
      });
      if (onMarkRead) onMarkRead(notification.id);
    } catch {}
  };

  const handleDispatch = async (channel: "api" | "email") => {
    setDispatchError(null);
    setDispatchResult(null);

    if (channel === "api" && !targetId.trim()) {
      setDispatchError("Nomor tujuan (Destination Number / Target ID) wajib diisi.");
      return;
    }

    if (channel === "email" && !emailTo.trim()) {
      setDispatchError("Email tujuan (Recipient Email) wajib diisi.");
      return;
    }

    setIsSending(true);

    try {
      const payload: any = {
        notification_id: notification.id,
        title: notification.title,
        message: customMessage.trim() || notification.message,
        channels: [channel],
      };

      if (channel === "api") {
        payload.target_id = targetId.trim();
      } else {
        payload.email_to = emailTo.trim();
      }

      const res = await fetch(apiUrl("/api/v1/notifications/send-alert"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Gagal mengirim notifikasi alert");
      }

      // Check for channel errors returned in payload results
      const failedResult = data.results?.find((r: any) => r.status === "ERROR" || r.status === "CONFIG_ERROR");
      if (failedResult) {
        throw new Error(failedResult.detail || `Gagal mengirim notifikasi via ${channel.toUpperCase()}`);
      }

      setDispatchResult(data);
      // Automatically mark as read once dispatched
      handleMarkAsRead();
    } catch (err: any) {
      setDispatchError(err.message || "Gagal menghubungi gateway notifikasi");
    } finally {
      setIsSending(false);
    }
  };

  const severityColor =
    notification.severity === "danger"
      ? "bg-red-50 text-red-700 border-red-200"
      : notification.severity === "warning"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-blue-50 text-blue-700 border-blue-200";

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${severityColor}`}
            >
              {notification.severity === "danger" ? (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              ) : notification.severity === "warning" ? (
                <Clock className="w-5 h-5 text-amber-600" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-900 leading-tight">
                  {notification.title}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${severityColor}`}
                >
                  {notification.severity}
                </span>
                {notification.is_read ? (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 text-slate-500">
                    Read
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-700">
                    New
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{notification.created_at}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-slate-700">
          {/* Notification Message Card */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="font-semibold text-slate-900 text-xs uppercase tracking-wider text-[11px] text-slate-500">
              Notification Event Details
            </div>
            <p className="text-sm text-slate-800 leading-relaxed font-normal">
              {notification.message}
            </p>

            {/* Reference Item & Navigation */}
            {notification.reference_id && (
              <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  <span className="text-slate-500">Linked Resource:</span>
                  <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {notification.reference_id}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {!notification.is_read && (
                    <button
                      type="button"
                      onClick={handleMarkAsRead}
                      className="px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg transition-colors cursor-pointer font-medium"
                    >
                      Mark as Read
                    </button>
                  )}

                  {onNavigateToResource && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        if (notification.reference_type === "contract") {
                          onNavigateToResource("contracts", "all");
                        } else if (notification.reference_type === "maintenance") {
                          onNavigateToResource("maintenance");
                        } else {
                          onNavigateToResource("assets", "all");
                        }
                      }}
                      className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      <span>Open Linked Record</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Alert Dispatch Section */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center space-x-2">
                <Send className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-slate-900 text-xs">
                  Dispatch Outbound Alert
                </h4>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                Pilih Saluran
              </span>
            </div>

            {/* Channel Selection Buttons */}
            <div>
              <p className="text-[11px] text-slate-500 mb-2">
                Klik tombol di bawah untuk membuka konfigurasi pengiriman:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* API Webhook / WhatsApp Button */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveChannel(activeChannel === "api" ? null : "api");
                    setDispatchResult(null);
                    setDispatchError(null);
                  }}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    activeChannel === "api"
                      ? "bg-blue-50/80 border-blue-400 text-blue-900 ring-2 ring-blue-500/20 shadow-xs"
                      : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        activeChannel === "api" ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">API Webhook / WhatsApp</div>
                      <div className="text-[10px] text-slate-400">Kirim ke nomor tujuan</div>
                    </div>
                  </div>
                  <span className={`text-[11px] font-semibold ${activeChannel === "api" ? "text-blue-700" : "text-slate-400"}`}>
                    {activeChannel === "api" ? "Tutup ▲" : "Buka ▼"}
                  </span>
                </button>

                {/* Email Notification Button */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveChannel(activeChannel === "email" ? null : "email");
                    setDispatchResult(null);
                    setDispatchError(null);
                  }}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    activeChannel === "email"
                      ? "bg-emerald-50/80 border-emerald-400 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs"
                      : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        activeChannel === "email" ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">Email Notification</div>
                      <div className="text-[10px] text-slate-400">Kirim ke email tujuan</div>
                    </div>
                  </div>
                  <span className={`text-[11px] font-semibold ${activeChannel === "email" ? "text-emerald-700" : "text-slate-400"}`}>
                    {activeChannel === "email" ? "Tutup ▲" : "Buka ▼"}
                  </span>
                </button>
              </div>
            </div>

            {/* Webhook Configuration Form */}
            {activeChannel === "api" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleDispatch("api");
                }}
                className="p-3.5 bg-blue-50/30 rounded-xl border border-blue-200/80 space-y-3 animate-in fade-in duration-150"
              >
                <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                  <span className="text-xs font-bold text-blue-900 flex items-center">
                    <Smartphone className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                    Konfigurasi Webhook / WhatsApp Gateway
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Info className="w-3 h-3 text-slate-400" />
                    Sender & Endpoint diatur di Settings
                  </span>
                </div>

                {/* Destination Number Only */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Nomor Tujuan / Destination Number (ID) *
                  </label>
                  <input
                    type="text"
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    placeholder="Contoh: 628123456789 atau ID Group"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    required
                  />
                </div>

                {/* Message Content */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Isi Pesan / Message Content *
                  </label>
                  <textarea
                    rows={3}
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono leading-relaxed focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    required
                  />
                </div>

                {/* Submit Row */}
                <div className="flex items-center justify-end space-x-2 pt-1 border-t border-blue-100">
                  <button
                    type="button"
                    onClick={() => setActiveChannel(null)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200/50 rounded-lg cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSending}
                    className="flex items-center space-x-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSending ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Mengirim via Webhook...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Kirim via Webhook</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Email Configuration Form */}
            {activeChannel === "email" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleDispatch("email");
                }}
                className="p-3.5 bg-emerald-50/30 rounded-xl border border-emerald-200/80 space-y-3 animate-in fade-in duration-150"
              >
                <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                  <span className="text-xs font-bold text-emerald-900 flex items-center">
                    <Mail className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                    Konfigurasi Email Notification
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Info className="w-3 h-3 text-slate-400" />
                    Sender & SMTP diatur di Settings
                  </span>
                </div>

                {/* Destination Email Only */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Email Tujuan / Recipient(s) *
                  </label>
                  <input
                    type="text"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="Contoh: noc-alerts@company.com, admin@company.com"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    required
                  />
                </div>

                {/* Message Content */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Isi Pesan / Message Content *
                  </label>
                  <textarea
                    rows={3}
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono leading-relaxed focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    required
                  />
                </div>

                {/* Submit Row */}
                <div className="flex items-center justify-end space-x-2 pt-1 border-t border-emerald-100">
                  <button
                    type="button"
                    onClick={() => setActiveChannel(null)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200/50 rounded-lg cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSending}
                    className="flex items-center space-x-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSending ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Mengirim Email...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-3.5 h-3.5" />
                        <span>Kirim via Email</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Error Notification */}
            {dispatchError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{dispatchError}</span>
              </div>
            )}

            {/* Success Report */}
            {dispatchResult && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 space-y-2">
                <div className="flex items-center space-x-1.5 font-bold text-emerald-700">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Notifikasi Alert Berhasil Dikirim!</span>
                </div>
                <div className="space-y-1 text-[11px]">
                  {dispatchResult.results?.map((r: any, idx: number) => (
                    <div key={idx} className="flex items-start space-x-2">
                      <span className="font-bold uppercase text-[10px] px-1.5 py-0.5 bg-emerald-200 text-emerald-900 rounded">
                        {r.channel}
                      </span>
                      <span>
                        {r.channel === "API"
                          ? `Terkirim ke ID ${r.recipient_id || targetId} (Status: ${r.status})`
                          : `Terkirim ke ${r.recipient || emailTo} (Status: ${r.status})`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
