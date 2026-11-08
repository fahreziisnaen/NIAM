"use client";

import React, { useState, useEffect } from "react";
import { apiUrl } from "@/lib/api";
import {
  X,
  Bell,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  Mail,
  Smartphone,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
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
  const [sendChannels, setSendChannels] = useState<{ api: boolean; email: boolean }>({
    api: true,
    email: true,
  });

  const [apiEndpoint, setApiEndpoint] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [targetId, setTargetId] = useState("628123456789");
  const [fromSender, setFromSender] = useState("respon");
  const [emailTo, setEmailTo] = useState("noc@phillip.com.hk");
  const [customMessage, setCustomMessage] = useState("");
  const [showAdvancedApi, setShowAdvancedApi] = useState(false);

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
      setDispatchResult(null);
      setDispatchError(null);

      fetch(apiUrl("/api/v1/notifications/config/settings"))
        .then((res) => res.json())
        .then((cfg) => {
          if (cfg) {
            setApiEndpoint(cfg.api_endpoint || "https://api.gateway.internal/v1/send-message");
            setApiKey(cfg.api_key || "PHILLIP_SEC_API_KEY_2026");
            setTargetId(cfg.default_target_id || "628123456789");
            setFromSender(cfg.default_from_sender || "respon");
            setEmailTo(cfg.default_email_to || "noc@phillip.com.hk");
            setSendChannels({
              api: cfg.enable_api_dispatch ?? true,
              email: cfg.enable_email_dispatch ?? true,
            });
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

  const handleSendAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendChannels.api && !sendChannels.email) {
      setDispatchError("Please select at least one dispatch channel (API or Email).");
      return;
    }

    setIsSending(true);
    setDispatchError(null);
    setDispatchResult(null);

    const activeChannels: string[] = [];
    if (sendChannels.api) activeChannels.push("api");
    if (sendChannels.email) activeChannels.push("email");

    try {
      const res = await fetch(apiUrl("/api/v1/notifications/send-alert"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notification_id: notification.id,
          title: notification.title,
          message: customMessage.trim() || notification.message,
          channels: activeChannels,
          api_endpoint: apiEndpoint.trim(),
          api_key: apiKey.trim(),
          target_id: targetId.trim(),
          from_sender: fromSender.trim(),
          email_to: emailTo.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to dispatch alert notification");
      }

      setDispatchResult(data);
      // Automatically mark as read once dispatched
      handleMarkAsRead();
    } catch (err: any) {
      setDispatchError(err.message || "Failed to connect to notification gateway");
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
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-700">
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

          {/* Alert Dispatch Section: Outbound Email & API */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center space-x-2">
                <Send className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-slate-900 text-xs">
                  Dispatch Alert to Email & API Gateway
                </h4>
              </div>
              <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold border border-blue-200">
                Outbound Gateway
              </span>
            </div>

            <form onSubmit={handleSendAlert} className="space-y-4">
              {/* Channel Selector */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-2">
                  Dispatch Channels:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* API Webhook Channel */}
                  <label
                    className={`flex items-start space-x-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                      sendChannels.api
                        ? "bg-blue-50/50 border-blue-300 text-blue-900 font-semibold"
                        : "bg-white border-slate-200 text-slate-600"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={sendChannels.api}
                      onChange={(e) =>
                        setSendChannels({ ...sendChannels, api: e.target.checked })
                      }
                      className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <Smartphone className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <div className="text-xs">API Webhook / WhatsApp Gateway</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        Bearer Token + JSON Payload (id, message, from)
                      </div>
                    </div>
                  </label>

                  {/* Email Channel */}
                  <label
                    className={`flex items-start space-x-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                      sendChannels.email
                        ? "bg-emerald-50/50 border-emerald-300 text-emerald-900 font-semibold"
                        : "bg-white border-slate-200 text-slate-600"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={sendChannels.email}
                      onChange={(e) =>
                        setSendChannels({ ...sendChannels, email: e.target.checked })
                      }
                      className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-xs">Email Notification</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        Send to NOC team distribution lists
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* API Parameters: id and from */}
              {sendChannels.api && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 flex items-center">
                      <Smartphone className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                      Target API Gateway Configuration
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAdvancedApi(!showAdvancedApi)}
                      className="text-[10px] text-blue-600 hover:underline flex items-center cursor-pointer"
                    >
                      <span>{showAdvancedApi ? "Hide Advanced Settings" : "Custom Endpoint & Key"}</span>
                      {showAdvancedApi ? (
                        <ChevronUp className="w-3 h-3 ml-0.5" />
                      ) : (
                        <ChevronDown className="w-3 h-3 ml-0.5" />
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-600 block mb-1">
                        Target ID / Destination Number (<span className="font-mono font-bold">id</span>) *
                      </label>
                      <input
                        type="text"
                        value={targetId}
                        onChange={(e) => setTargetId(e.target.value)}
                        placeholder="e.g. 628123456789"
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500/20"
                        required={sendChannels.api}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-600 block mb-1">
                        Sender / Identity (<span className="font-mono font-bold">from</span>) *
                      </label>
                      <input
                        type="text"
                        value={fromSender}
                        onChange={(e) => setFromSender(e.target.value)}
                        placeholder="e.g. respon"
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500/20"
                        required={sendChannels.api}
                      />
                    </div>
                  </div>

                  {showAdvancedApi && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 block mb-1">
                          API Endpoint URL
                        </label>
                        <input
                          type="text"
                          value={apiEndpoint}
                          onChange={(e) => setApiEndpoint(e.target.value)}
                          placeholder="https://api.gateway.com/send"
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-[11px]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 block mb-1">
                          Bearer Authorization Key
                        </label>
                        <input
                          type="text"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="YOUR_API_KEY"
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-[11px]"
                        />
                      </div>
                    </div>
                  )}

                  <div className="p-2 bg-white rounded border border-slate-200 font-mono text-[10px] text-slate-600 space-y-0.5">
                    <div className="text-[9px] text-slate-400 uppercase font-bold">Header Format:</div>
                    <div className="text-blue-700">Authorization: Bearer {apiKey ? `${apiKey.slice(0, 6)}***` : "API_KEY"}</div>
                    <div className="text-[9px] text-slate-400 uppercase font-bold pt-1">Body Format:</div>
                    <div className="text-slate-800">
                      {JSON.stringify({ id: targetId, message: "...", from: fromSender })}
                    </div>
                  </div>
                </div>
              )}

              {/* Email Parameters */}
              {sendChannels.email && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    NOC Email Recipients (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="noc@phillip.com.hk, infrastructure-team@phillip.com.hk"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              )}

              {/* Message Content preview */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Alert Message Body (Editable) *
                </label>
                <textarea
                  rows={3}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono leading-relaxed focus:bg-white"
                  required
                />
              </div>

              {/* Dispatch Error Notification */}
              {dispatchError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{dispatchError}</span>
                </div>
              )}

              {/* Dispatch Success Report */}
              {dispatchResult && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 space-y-2">
                  <div className="flex items-center space-x-1.5 font-bold text-emerald-700">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Alert Successfully Dispatched!</span>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    {dispatchResult.results?.map((r: any, idx: number) => (
                      <div key={idx} className="flex items-start space-x-2">
                        <span className="font-bold uppercase text-[10px] px-1.5 py-0.2 bg-emerald-200 text-emerald-900 rounded">
                          {r.channel}
                        </span>
                        <span>
                          {r.channel === "API"
                            ? `Dispatched to ID ${r.recipient_id} (Status: ${r.status})`
                            : `Dispatched to ${r.recipient} (Status: ${r.status})`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Close
                </button>

                <button
                  type="submit"
                  disabled={isSending}
                  className="flex items-center space-x-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSending ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Dispatching Alert...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Dispatch Outbound Alert</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
