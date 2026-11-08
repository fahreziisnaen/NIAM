"use client";

import React, { useState, useEffect } from "react";
import { apiUrl } from "@/lib/api";
import {
  BellRing,
  Play,
  Plus,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Send,
  Mail,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Filter,
  Check,
  X,
  FileText,
  Sliders,
  Flame,
  Database,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info,
} from "lucide-react";

export interface AlertRule {
  id: number;
  rule_code: string;
  name: string;
  description: string;
  category: "CONTRACT_EXPIRATION" | "WARRANTY_EXPIRATION" | "HARDWARE_STATUS" | "BUFFER_STOCK" | "MAINTENANCE_INCIDENT";
  condition_field: string;
  operator: string;
  threshold_value: string;
  severity: "danger" | "warning" | "info";
  channels: string[];
  auto_dispatch: boolean;
  is_enabled: boolean;
  custom_target_id?: string;
  custom_from_sender?: string;
  custom_email?: string;
  cooldown_hours: number;
  last_evaluated_at?: string;
  last_triggered_at?: string;
  trigger_count: number;
  created_at?: string;
}

export function AlertRulesView() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Summary Metrics
  const [summary, setSummary] = useState<any>(null);

  // Evaluating state
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);

  // Dispatch Audit Logs
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [selectedPayloadLog, setSelectedPayloadLog] = useState<any>(null);

  // Test Trigger Modal State
  const [testModalRule, setTestModalRule] = useState<AlertRule | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // New/Edit Rule Modal State
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState<string>("CONTRACT_EXPIRATION");
  const [formConditionField, setFormConditionField] = useState("days_to_expiration");
  const [formOperator, setFormOperator] = useState("<=");
  const [formThresholdValue, setFormThresholdValue] = useState("30");
  const [formSeverity, setFormSeverity] = useState<"danger" | "warning" | "info">("warning");
  const [formChannels, setFormChannels] = useState<string[]>(["api", "email"]);
  const [formAutoDispatch, setFormAutoDispatch] = useState(true);
  const [formTargetId, setFormTargetId] = useState("628123456789");
  const [formFromSender, setFormFromSender] = useState("respon");
  const [formEmail, setFormEmail] = useState("noc@phillip.com.hk");
  const [formCooldownHours, setFormCooldownHours] = useState(24);
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [resRules, resSummary, resLogs] = await Promise.all([
        fetch(apiUrl("/api/v1/alerts/rules")),
        fetch(apiUrl("/api/v1/alerts/summary")),
        fetch(apiUrl("/api/v1/alerts/dispatch-logs?limit=15")),
      ]);
      if (resRules.ok) {
        const rulesData = await resRules.json();
        setRules(rulesData);
      }
      if (resSummary.ok) {
        const summaryData = await resSummary.json();
        setSummary(summaryData);
      }
      if (resLogs.ok) {
        const logsData = await resLogs.json();
        setLogs(logsData);
      }
    } catch (e) {
      console.error("Failed to load alert rules", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Trigger instant evaluation
  const handleRunEvaluation = async () => {
    setEvaluating(true);
    setEvaluationResult(null);
    try {
      const res = await fetch(apiUrl("/api/v1/alerts/evaluate-now"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setEvaluationResult(data);
      fetchData();
    } catch (e) {
      console.error("Evaluation failed", e);
    } finally {
      setEvaluating(false);
    }
  };

  // Toggle Rule Enabled
  const handleToggleEnabled = async (rule: AlertRule) => {
    try {
      const res = await fetch(apiUrl(`/api/v1/alerts/rules/${rule.id}/toggle-enabled`), {
        method: "POST",
      });
      if (res.ok) {
        setRules((prev) =>
          prev.map((r) => (r.id === rule.id ? { ...r, is_enabled: !r.is_enabled } : r))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle Rule Auto-Dispatch
  const handleToggleAutoDispatch = async (rule: AlertRule) => {
    try {
      const res = await fetch(apiUrl(`/api/v1/alerts/rules/${rule.id}/toggle-auto-dispatch`), {
        method: "POST",
      });
      if (res.ok) {
        setRules((prev) =>
          prev.map((r) => (r.id === rule.id ? { ...r, auto_dispatch: !r.auto_dispatch } : r))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Test Trigger Rule
  const handleOpenTestModal = (rule: AlertRule) => {
    setTestModalRule(rule);
    setTestResult(null);
  };

  const handleExecuteTest = async () => {
    if (!testModalRule) return;
    setTestLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/v1/alerts/rules/${testModalRule.id}/test`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          custom_message: `Automated NOC Drill Test: Rule '${testModalRule.name}' verified for Phillip Securities Hong Kong.`,
        }),
      });
      const data = await res.json();
      setTestResult(data);
      // Refresh logs
      fetch(apiUrl("/api/v1/alerts/dispatch-logs?limit=15"))
        .then((r) => r.json())
        .then((d) => setLogs(d))
        .catch(() => {});
    } catch (e) {
      console.error("Test execution failed", e);
    } finally {
      setTestLoading(false);
    }
  };

  // Open Create / Edit Modal
  const handleOpenNewRuleModal = () => {
    setEditingRule(null);
    setFormName("");
    setFormDescription("");
    setFormCategory("CONTRACT_EXPIRATION");
    setFormConditionField("days_to_expiration");
    setFormOperator("<=");
    setFormThresholdValue("30");
    setFormSeverity("warning");
    setFormChannels(["api", "email"]);
    setFormAutoDispatch(true);
    setFormTargetId("628123456789");
    setFormFromSender("respon");
    setFormEmail("noc@phillip.com.hk");
    setFormCooldownHours(24);
    setFormError(null);
    setRuleModalOpen(true);
  };

  const handleOpenEditRuleModal = (rule: AlertRule) => {
    setEditingRule(rule);
    setFormName(rule.name);
    setFormDescription(rule.description || "");
    setFormCategory(rule.category);
    setFormConditionField(rule.condition_field);
    setFormOperator(rule.operator);
    setFormThresholdValue(rule.threshold_value);
    setFormSeverity(rule.severity);
    setFormChannels(rule.channels || ["api", "email"]);
    setFormAutoDispatch(rule.auto_dispatch);
    setFormTargetId(rule.custom_target_id || "628123456789");
    setFormFromSender(rule.custom_from_sender || "respon");
    setFormEmail(rule.custom_email || "noc@phillip.com.hk");
    setFormCooldownHours(rule.cooldown_hours || 24);
    setFormError(null);
    setRuleModalOpen(true);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError("Rule name is required.");
      return;
    }
    setFormSaving(true);
    setFormError(null);

    const payload = {
      name: formName.trim(),
      description: formDescription.trim(),
      category: formCategory,
      condition_field: formConditionField,
      operator: formOperator,
      threshold_value: formThresholdValue.trim(),
      severity: formSeverity,
      channels: formChannels.join(","),
      auto_dispatch: formAutoDispatch,
      is_enabled: true,
      custom_target_id: formTargetId.trim(),
      custom_from_sender: formFromSender.trim(),
      custom_email: formEmail.trim(),
      cooldown_hours: Number(formCooldownHours) || 24,
    };

    try {
      const url = editingRule
        ? apiUrl(`/api/v1/alerts/rules/${editingRule.id}`)
        : apiUrl("/api/v1/alerts/rules");
      const method = editingRule ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to save alert rule.");
      }

      setRuleModalOpen(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || "An error occurred.");
    } finally {
      setFormSaving(false);
    }
  };

  const handleDeleteRule = async (ruleId: number) => {
    if (!window.confirm("Are you sure you want to delete this alert rule?")) return;
    try {
      const res = await fetch(apiUrl(`/api/v1/alerts/rules/${ruleId}`), {
        method: "DELETE",
      });
      if (res.ok) {
        setRules((prev) => prev.filter((r) => r.id !== ruleId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filtered rules
  const filteredRules = rules.filter((r) => {
    const matchesCat = selectedCategory === "ALL" || r.category === selectedCategory;
    const matchesQuery =
      searchQuery === "" ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.rule_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case "CONTRACT_EXPIRATION":
        return { label: "Contract Expiration", bg: "bg-blue-50 text-blue-700 border-blue-200" };
      case "WARRANTY_EXPIRATION":
        return { label: "Hardware Warranty", bg: "bg-purple-50 text-purple-700 border-purple-200" };
      case "HARDWARE_STATUS":
        return { label: "Device Outage / Status", bg: "bg-rose-50 text-rose-700 border-rose-200" };
      case "BUFFER_STOCK":
        return { label: "Buffer Stock & Spares", bg: "bg-amber-50 text-amber-700 border-amber-200" };
      default:
        return { label: cat, bg: "bg-slate-100 text-slate-700 border-slate-200" };
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "danger":
        return { label: "Critical", bg: "bg-red-50 text-red-700 border-red-200", icon: ShieldAlert };
      case "warning":
        return { label: "Warning", bg: "bg-amber-50 text-amber-700 border-amber-200", icon: AlertTriangle };
      default:
        return { label: "Notice", bg: "bg-blue-50 text-blue-700 border-blue-200", icon: CheckCircle2 };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions Area */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Alert Automation & Rules Engine
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Fully Automated ⚡
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Automatically scan network contracts, device warranties, maintenance states, and buffer inventory to trigger real-time API Webhook and Email alerts.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          {/* Run Automated Scan Now Button */}
          <button
            type="button"
            onClick={handleRunEvaluation}
            disabled={evaluating}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center space-x-2 cursor-pointer"
          >
            {evaluating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                <span>Scanning Database...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />
                <span>Run Automated Scan Now</span>
              </>
            )}
          </button>

          {/* New Alert Rule Button */}
          <button
            type="button"
            onClick={handleOpenNewRuleModal}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Alert Rule</span>
          </button>
        </div>
      </div>

      {/* Evaluation Results Banner (when executed) */}
      {evaluationResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 animate-in fade-in duration-200 flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-emerald-900">
                Automated Evaluation Completed Successfully
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Evaluated <strong>{evaluationResult.evaluated_rules_count} rules</strong> across all active assets and contracts.
                Found <strong>{evaluationResult.total_matches} matching entities</strong>, generated{" "}
                <strong>{evaluationResult.notifications_created} system notifications</strong>, and dispatched{" "}
                <strong>{evaluationResult.auto_dispatches_sent} automated notifications</strong> via API Webhook and NOC Email Relay.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEvaluationResult(null)}
            className="text-emerald-500 hover:text-emerald-700 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Rules
            </span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Sliders className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {summary?.total_rules ?? rules.length}
            </span>
            <span className="text-xs font-medium text-emerald-600">
              ({summary?.enabled_rules ?? rules.filter((r) => r.is_enabled).length} active)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Configured inspection criteria</p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Auto-Dispatch Mode
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {summary?.auto_dispatch_rules ?? rules.filter((r) => r.auto_dispatch).length} Rules
            </span>
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">
            Instant API & Email push enabled
          </p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Dispatches
            </span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Send className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {summary?.total_dispatches ?? logs.length}
            </span>
            <span className="text-xs font-medium text-slate-500">outbound</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Last: {summary?.last_dispatch_at || "Recent scan"}
          </p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Gateway Target
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-base font-bold text-slate-900 font-mono truncate">
              {summary?.target_id || "628123456789"}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 truncate mt-1">
            Recipient: {summary?.email_recipients ? summary.email_recipients.split(",")[0] : "noc@phillip.com.hk"}
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Category Filter Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          {[
            { id: "ALL", label: "All Rules" },
            { id: "CONTRACT_EXPIRATION", label: "Contract Expiration" },
            { id: "WARRANTY_EXPIRATION", label: "Hardware Warranty" },
            { id: "HARDWARE_STATUS", label: "Device Outage / Status" },
            { id: "BUFFER_STOCK", label: "Buffer Stock & Spares" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                selectedCategory === cat.id
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by rule name or code..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* Rules Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Configured Alert Rules</h3>
            <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
              {filteredRules.length}
            </span>
          </div>
          <span className="text-xs text-slate-400">All automated rules run every 30 mins or upon scan</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span>Loading alert rules...</span>
          </div>
        ) : filteredRules.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No alert rules found matching the criteria.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredRules.map((rule) => {
              const catBadge = getCategoryBadge(rule.category);
              const sevBadge = getSeverityBadge(rule.severity);
              const SevIcon = sevBadge.icon;

              return (
                <div
                  key={rule.id}
                  className={`p-5 transition-colors hover:bg-slate-50/70 ${
                    !rule.is_enabled ? "opacity-60 bg-slate-50/40" : ""
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Info */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-400">
                          {rule.rule_code}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{rule.name}</h4>

                        {/* Category Badge */}
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${catBadge.bg}`}
                        >
                          {catBadge.label}
                        </span>

                        {/* Severity Badge */}
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center space-x-1 ${sevBadge.bg}`}
                        >
                          <SevIcon className="w-3 h-3" />
                          <span>{sevBadge.label}</span>
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                        {rule.description}
                      </p>

                      {/* Criteria & Details */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                        <div className="flex items-center space-x-1">
                          <span className="font-semibold text-slate-700">Condition:</span>
                          <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-[11px] font-mono">
                            {rule.condition_field} {rule.operator} {rule.threshold_value}
                            {rule.category.includes("EXPIRATION") ? " days" : ""}
                          </code>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <span className="font-semibold text-slate-700">Channels:</span>
                          {rule.channels.includes("api") && (
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200 flex items-center space-x-1">
                              <Send className="w-2.5 h-2.5" />
                              <span>Webhook API (Bearer)</span>
                            </span>
                          )}
                          {rule.channels.includes("email") && (
                            <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold text-[10px] border border-purple-200 flex items-center space-x-1">
                              <Mail className="w-2.5 h-2.5" />
                              <span>NOC Email Relay</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-1 text-slate-400 text-[11px]">
                          <span>Trigger Count:</span>
                          <span className="font-bold text-slate-700 font-mono">{rule.trigger_count}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Controls & Toggles */}
                    <div className="flex items-center space-x-4 lg:self-center shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      {/* Auto-Dispatch Toggle */}
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-slate-400 mb-1">Auto-Dispatch</span>
                        <button
                          type="button"
                          onClick={() => handleToggleAutoDispatch(rule)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center space-x-1.5 ${
                            rule.auto_dispatch
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                              : "bg-slate-100 text-slate-500 border-slate-300"
                          }`}
                          title={
                            rule.auto_dispatch
                              ? "Auto-Dispatch is ON: Alerts push automatically upon condition match"
                              : "Auto-Dispatch is OFF: In-app notification only"
                          }
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              rule.auto_dispatch ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                            }`}
                          />
                          <span>{rule.auto_dispatch ? "AUTO PUSH" : "IN-APP ONLY"}</span>
                        </button>
                      </div>

                      {/* Enabled Toggle */}
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-slate-400 mb-1">Status</span>
                        <button
                          type="button"
                          onClick={() => handleToggleEnabled(rule)}
                          className={`p-1 rounded-lg transition-colors cursor-pointer ${
                            rule.is_enabled ? "text-blue-600 hover:bg-blue-50" : "text-slate-400 hover:bg-slate-100"
                          }`}
                          title={rule.is_enabled ? "Click to Pause Rule" : "Click to Enable Rule"}
                        >
                          {rule.is_enabled ? (
                            <ToggleRight className="w-8 h-8" />
                          ) : (
                            <ToggleLeft className="w-8 h-8" />
                          )}
                        </button>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-200">
                        {/* Test Trigger Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenTestModal(rule)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center space-x-1"
                          title="Simulate immediate test dispatch"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Test</span>
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditRuleModal(rule)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                        >
                          Edit
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete rule"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dispatch Audit & Execution Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Live Alert Dispatch Ledger & Audit Trail
            </h3>
            <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
              Real-time Logs
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setLogsLoading(true);
              fetch(apiUrl("/api/v1/alerts/dispatch-logs?limit=25"))
                .then((r) => r.json())
                .then((d) => setLogs(d))
                .finally(() => setLogsLoading(false));
            }}
            className="text-xs text-blue-600 hover:underline flex items-center space-x-1 cursor-pointer font-medium"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? "animate-spin" : ""}`} />
            <span>Refresh Ledger</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 font-semibold">Timestamp (UTC)</th>
                <th className="px-6 py-3 font-semibold">Rule Triggered</th>
                <th className="px-6 py-3 font-semibold">Channel</th>
                <th className="px-6 py-3 font-semibold">Recipient Target</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold text-right">Payload & Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No dispatch logs recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isApi = log.channel === "API";
                  const isSuccess = log.status === "SUCCESS" || log.status === "SIMULATED_SUCCESS";

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {log.created_at}
                      </td>
                      <td className="px-6 py-3 font-medium text-slate-900">
                        {log.rule_name || `Rule #${log.rule_id || "System"}`}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            isApi
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-purple-50 text-purple-700 border-purple-200"
                          }`}
                        >
                          {log.channel}
                        </span>
                      </td>
                      <td className="px-6 py-3 font-mono text-[11px] text-slate-600">
                        {log.recipient}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center space-x-1 w-max ${
                            isSuccess
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSuccess ? "bg-emerald-500" : "bg-red-500"
                            }`}
                          />
                          <span>{log.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedPayloadLog(log)}
                          className="text-blue-600 hover:underline font-bold text-[11px] cursor-pointer"
                        >
                          View Payload →
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Test Trigger Modal */}
      {testModalRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Play className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Test Alert Dispatch</h3>
                  <p className="text-[11px] text-slate-500 font-mono">{testModalRule.rule_code}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTestModalRule(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <p className="font-bold text-slate-800">{testModalRule.name}</p>
              <div className="space-y-1 text-slate-600 text-[11px]">
                <p>
                  <strong>Target ID (id):</strong>{" "}
                  <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    {testModalRule.custom_target_id || "628123456789"}
                  </code>
                </p>
                <p>
                  <strong>Sender ID (from):</strong>{" "}
                  <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    {testModalRule.custom_from_sender || "respon"}
                  </code>
                </p>
                <p>
                  <strong>Recipient Email:</strong>{" "}
                  <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    {testModalRule.custom_email || "noc@phillip.com.hk"}
                  </code>
                </p>
                <p>
                  <strong>Authorization Header:</strong>{" "}
                  <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    Bearer API_KEY_ANDA
                  </code>
                </p>
              </div>
            </div>

            {testResult && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs space-y-2">
                <div className="flex items-center space-x-1.5 text-emerald-800 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Outbound Dispatch Verified!</span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-xl text-[11px] font-mono text-slate-700 overflow-x-auto space-y-1">
                  {testResult.results?.map((res: any, idx: number) => (
                    <div key={idx} className="border-b last:border-b-0 pb-1 pt-1">
                      <span className="font-bold text-blue-700">[{res.channel}]</span>{" "}
                      <span>Status: {res.status}</span>
                      {res.payload && (
                        <pre className="text-[10px] text-slate-600 mt-0.5 overflow-x-auto">
                          {JSON.stringify(res.payload, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setTestModalRule(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleExecuteTest}
                disabled={testLoading}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-2 cursor-pointer"
              >
                {testLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Dispatching...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Test Alert</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Create / Edit Rule Modal */}
      {ruleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingRule ? "Edit Alert Rule" : "Create New Alert Rule"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Define category, trigger condition, severity, and delivery parameters.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRuleModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-4 pt-4 text-xs">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Rule Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rule Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Critical Contract Expiration (≤ 7 Days)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Explain when and why this alert should fire..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Category & Severity Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => {
                      const cat = e.target.value;
                      setFormCategory(cat);
                      if (cat === "CONTRACT_EXPIRATION" || cat === "WARRANTY_EXPIRATION") {
                        setFormConditionField("days_to_expiration");
                        setFormOperator("<=");
                        setFormThresholdValue("30");
                      } else if (cat === "HARDWARE_STATUS") {
                        setFormConditionField("operational_status");
                        setFormOperator("==");
                        setFormThresholdValue("In Maintenance");
                      } else if (cat === "BUFFER_STOCK") {
                        setFormConditionField("quantity");
                        setFormOperator("<=");
                        setFormThresholdValue("5");
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  >
                    <option value="CONTRACT_EXPIRATION">Contract Expiration</option>
                    <option value="WARRANTY_EXPIRATION">Hardware Warranty</option>
                    <option value="HARDWARE_STATUS">Device Outage / Status</option>
                    <option value="BUFFER_STOCK">Buffer Stock & Spares</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Severity</label>
                  <select
                    value={formSeverity}
                    onChange={(e) => setFormSeverity(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  >
                    <option value="danger">Critical (Red Alert)</option>
                    <option value="warning">Warning (Amber Alert)</option>
                    <option value="info">Notice (Informational)</option>
                  </select>
                </div>
              </div>

              {/* Condition Builder */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <span className="font-bold text-slate-800 text-xs">Inspection Criteria</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Field</label>
                    <input
                      type="text"
                      value={formConditionField}
                      onChange={(e) => setFormConditionField(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Operator</label>
                    <select
                      value={formOperator}
                      onChange={(e) => setFormOperator(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs font-mono"
                    >
                      <option value="<=">&le; (Less than or equal)</option>
                      <option value="==">== (Exact match)</option>
                      <option value=">=">&ge; (Greater than or equal)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      Threshold / Value
                    </label>
                    <input
                      type="text"
                      value={formThresholdValue}
                      onChange={(e) => setFormThresholdValue(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Channels & Auto-Dispatch */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50">
                  <div>
                    <p className="font-bold text-slate-800 text-xs">Automated Outbound Dispatch</p>
                    <p className="text-[11px] text-slate-500">
                      When enabled, matching alerts are pushed automatically to API and Email without manual intervention.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormAutoDispatch(!formAutoDispatch)}
                    className="p-1 rounded cursor-pointer"
                  >
                    {formAutoDispatch ? (
                      <ToggleRight className="w-8 h-8 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-slate-400" />
                    )}
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">Active Delivery Channels</label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formChannels.includes("api")}
                        onChange={(e) => {
                          if (e.target.checked) setFormChannels([...formChannels, "api"]);
                          else setFormChannels(formChannels.filter((c) => c !== "api"));
                        }}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs font-medium text-slate-700">Webhook API Gateway (Bearer)</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formChannels.includes("email")}
                        onChange={(e) => {
                          if (e.target.checked) setFormChannels([...formChannels, "email"]);
                          else setFormChannels(formChannels.filter((c) => c !== "email"));
                        }}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs font-medium text-slate-700">NOC Email Relay</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Payload Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Target ID (id)
                  </label>
                  <input
                    type="text"
                    value={formTargetId}
                    onChange={(e) => setFormTargetId(e.target.value)}
                    placeholder="628123456789"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Sender (from)
                  </label>
                  <input
                    type="text"
                    value={formFromSender}
                    onChange={(e) => setFormFromSender(e.target.value)}
                    placeholder="respon"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Recipient Email
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="noc@phillip.com.hk"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRuleModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-2 cursor-pointer"
                >
                  {formSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving Rule...</span>
                    </>
                  ) : (
                    <span>Save Alert Rule</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: View Raw Payload Popup */}
      {selectedPayloadLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Dispatched Payload & Server Response</h3>
              <button
                type="button"
                onClick={() => setSelectedPayloadLog(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-slate-700 block mb-1">Payload Sent:</span>
                <pre className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-[11px] overflow-x-auto">
                  {selectedPayloadLog.payload_sent}
                </pre>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">Gateway Response:</span>
                <div className="bg-slate-100 text-slate-800 p-3 rounded-xl font-mono text-[11px] overflow-x-auto">
                  {selectedPayloadLog.response_body}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedPayloadLog(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

