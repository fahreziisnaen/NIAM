"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { apiUrl } from "@/lib/api";
import {
  Search,
  Bell,
  CheckCircle2,
  AlertTriangle,
  X,
  ShieldCheck,
  ShieldAlert,
  LogOut,
  Smartphone,
  ExternalLink,
  Menu,
  Clock,
  Send,
  User,
  Settings,
  FileSpreadsheet,
  FileCheck,
  ChevronDown,
  BellRing,
  Sliders,
  Edit2,
  Save,
  Lock,
  Mail,
  Phone,
  Briefcase,
  Check,
} from "lucide-react";
import {
  NotificationDetailModal,
  NotificationItem,
} from "../notifications/NotificationDetailModal";

interface HeaderProps {
  onSearch?: (query: string) => void;
  onOpenNotifications?: () => void;
  onOpenProfile?: () => void;
  currentUser?: any;
  onRefreshUser?: () => void;
  onOpenTwoFactorSetup?: () => void;
  onLogout?: () => void;
  onNavigate?: (tab: string, sub?: string) => void;
  onToggleMobileMenu?: () => void;
}

export function Header({
  onSearch,
  onOpenNotifications,
  onOpenProfile,
  currentUser,
  onRefreshUser,
  onOpenTwoFactorSetup,
  onLogout,
  onNavigate,
  onToggleMobileMenu,
}: HeaderProps) {
  const [searchValue, setSearchValue] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Dynamic Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(3);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const fetchNotifications = () => {
    fetch(apiUrl("/api/v1/notifications"))
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.items)) {
          setNotifications(data.items);
          setUnreadCount(
            data.unread_count !== undefined
              ? data.unread_count
              : data.items.filter((i: any) => !i.is_read).length
          );
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onSearch) {
      onSearch(searchValue);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "FF";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const displayName = currentUser?.full_name || "Fahrezi Fauzan";
  const displayUsername = currentUser?.username || "admin";
  const displayEmail = currentUser?.email || "admin@phillip.com.hk";
  const displayRole = currentUser?.roles?.[0] || (currentUser?.is_superuser ? "SUPER ADMIN" : "ADMIN");
  const is2FA = Boolean(currentUser?.is_two_factor_enabled);

  // Profile Edit State
  const [profileTab, setProfileTab] = useState<"overview" | "edit">("overview");
  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      setEditFullName(currentUser.full_name || "");
      setEditEmail(currentUser.email || "");
      setEditTitle(currentUser.title || "");
      setEditDepartment(currentUser.department || "IT Infrastructure");
      setEditPhone(currentUser.phone || "");
    }
  }, [currentUser, showProfileModal]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError(null);
    setProfileMessage(null);

    const token = typeof window !== "undefined" ? localStorage.getItem("phillip_token") : null;
    try {
      const res = await fetch(apiUrl("/api/v1/auth/me"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          full_name: editFullName.trim(),
          email: editEmail.trim() || null,
          title: editTitle.trim() || null,
          department: editDepartment.trim() || null,
          phone: editPhone.trim() || null,
          current_password: currentPassword.trim() || null,
          new_password: newPassword.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to update profile");
      }

      if (typeof window !== "undefined") {
        const storedUser = localStorage.getItem("phillip_user");
        if (storedUser) {
          const userObj = JSON.parse(storedUser);
          localStorage.setItem("phillip_user", JSON.stringify({ ...userObj, ...data }));
        }
      }

      setProfileMessage("Your profile information has been successfully updated!");
      setCurrentPassword("");
      setNewPassword("");
      if (onRefreshUser) onRefreshUser();
    } catch (err: any) {
      setProfileError(err.message || "An error occurred while saving your profile");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(apiUrl("/api/v1/notifications/mark-all-read"), {
        method: "POST",
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
  };

  return (
    <>
      <header className="h-20 bg-white border-b border-slate-200/90 px-4 sm:px-8 lg:px-10 flex items-center justify-between sticky top-0 z-40 shadow-xs backdrop-blur-md">
        {/* Left Brand Area */}
        <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
          {/* Hamburger Menu Toggle (Mobile & Tablet: < lg) */}
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none shrink-0 cursor-pointer"
            title="Open Menu"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3 shrink-0">
            {/* Logo */}
            <div className="relative w-11 h-11 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center bg-white shadow-xs shrink-0 p-0.5">
              <Image
                src="/philliplogo.jpg"
                alt="Phillip Securities Hong Kong"
                width={40}
                height={40}
                className="object-contain"
                priority
              />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-[15px] lg:text-base font-bold text-slate-900 leading-tight tracking-tight">
                Phillip Securities
              </span>
              <span className="text-[10px] font-bold text-blue-600 tracking-widest uppercase leading-none mt-0.5">
                Hong Kong
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden md:block h-8 w-[1px] bg-slate-200 mx-3 shrink-0" />

          {/* Product Name */}
          <h1 className="hidden md:block text-sm lg:text-[15px] font-semibold text-slate-700 tracking-tight truncate">
            Network Infrastructure Asset Management
          </h1>
        </div>

        {/* Right Area: Search, Live Automation Pill, Notifications, Profile */}
        <div className="flex items-center space-x-3 sm:space-x-4 relative shrink-0">
          {/* Automated Alerts Engine Status Pill (Direct 1-Click Navigation) */}
          <button
            type="button"
            onClick={() => onNavigate && onNavigate("settings", "alerts")}
            className="hidden xl:flex items-center space-x-2 px-3 py-2 rounded-xl bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200/80 text-emerald-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            title="Automated Rule Engine is Active. Click to open Alert Automation module."
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Auto Alerts: Active</span>
          </button>

          {/* Global Search Input */}
          <div className="relative w-44 sm:w-64 md:w-80 lg:w-[400px] xl:w-[460px] transition-all">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search assets, SN, IP, hostname..."
              className="w-full pl-10 pr-12 py-2.5 text-xs sm:text-sm bg-slate-50/90 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-2xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            {searchValue ? (
              <button
                onClick={() => {
                  setSearchValue("");
                  if (onSearch) onSearch("");
                }}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-block absolute right-3 top-2.5 text-[10px] font-mono font-semibold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs pointer-events-none">
                ⌘K
              </kbd>
            )}
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(false);
                const nextState = !showNotifications;
                setShowNotifications(nextState);
                if (nextState) fetchNotifications();
              }}
              className="w-11 h-11 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center relative shadow-2xs transition-all cursor-pointer focus:outline-none"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Popover Dropdown */}
            {showNotifications && (
              <>
                {/* Backdrop specifically for notifications popover */}
                <div
                  className="fixed inset-0 z-40 bg-transparent"
                  onClick={() => setShowNotifications(false)}
                />

                <div className="absolute right-0 mt-2 w-[calc(100vw-24px)] max-w-xs sm:w-84 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-xs text-slate-800">
                        System Notifications
                      </span>
                      {unreadCount > 0 ? (
                        <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">
                          {unreadCount} new
                        </span>
                      ) : (
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                          all read
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="text-[10px] text-blue-600 hover:underline font-medium cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        No active notifications.
                      </div>
                    ) : (
                      notifications.map((item) => {
                        const isDanger = item.severity === "danger";
                        const isWarning = item.severity === "warning";
                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              setShowNotifications(false);
                              setSelectedNotification(item);
                              setDetailModalOpen(true);
                            }}
                            className={`px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer group ${
                              !item.is_read ? "bg-blue-50/20" : ""
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-1.5 text-xs font-semibold">
                                {isDanger ? (
                                  <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                                ) : isWarning ? (
                                  <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                ) : (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                )}
                                <span
                                  className={
                                    isDanger
                                      ? "text-red-700 group-hover:underline"
                                      : isWarning
                                      ? "text-amber-700 group-hover:underline"
                                      : "text-blue-700 group-hover:underline"
                                  }
                                >
                                  {item.title}
                                </span>
                              </div>
                              {!item.is_read && (
                                <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1" />
                              )}
                            </div>

                            <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                              {item.message}
                            </p>

                            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 pt-1 border-t border-slate-100/60">
                              <span>{item.created_at}</span>
                              <span className="text-blue-600 font-semibold group-hover:underline flex items-center">
                                View Details & Send Alert →
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Footer Action: Manage Alert Automation */}
                  <div className="p-3 border-t border-slate-100 bg-slate-50/70 space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowNotifications(false);
                        if (onNavigate) onNavigate("settings", "alerts");
                      }}
                      className="w-full text-left p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Manage Alert Rules & Automation</span>
                      </div>
                      <span className="text-xs">⚙️</span>
                    </button>
                    <div className="text-[10px] text-slate-400 flex items-center justify-between px-1">
                      <span>Click any alert above to send outbound</span>
                      <Send className="w-3 h-3 text-blue-500" />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Profile Pill & Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(false);
                setShowProfileMenu(!showProfileMenu);
              }}
              className="flex items-center space-x-2.5 p-1 sm:p-1.5 sm:pr-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-2xs cursor-pointer focus:outline-none"
              title={`${displayName} (${displayUsername})`}
            >
              <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-lg bg-[#0A192F] text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                {getInitials(displayName)}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[120px]">
                  {displayName}
                </span>
                <span className="text-[10px] font-semibold text-blue-600 leading-none mt-0.5">
                  {displayRole}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block shrink-0" />
            </button>

            {showProfileMenu && (
              <>
                {/* Backdrop specifically for profile popover */}
                <div
                  className="fixed inset-0 z-40 bg-transparent"
                  onClick={() => setShowProfileMenu(false)}
                />

                <div className="absolute right-0 mt-2 w-[calc(100vw-24px)] max-w-xs sm:w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 pb-3 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900 truncate mr-2">{displayName}</p>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                        {displayRole}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                      username: <span className="font-bold text-slate-700">{displayUsername}</span>
                    </p>
                    {currentUser?.email ? (
                      <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                    ) : (
                      <p className="text-[10px] text-slate-400 italic">No email linked (Optional)</p>
                    )}
                  </div>

                  {/* 2FA Status Indicator */}
                  <div className="px-4 py-2 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      {is2FA ? (
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <ShieldAlert className="w-4 h-4 text-amber-500" />
                      )}
                      <span className="text-xs font-medium text-slate-700">Google 2FA</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        is2FA
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {is2FA ? "Active" : "Disabled"}
                    </span>
                  </div>

                  {/* Action Links */}
                  <div className="p-2 space-y-1">
                    {/* 1. Profile Overview */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        setProfileTab("overview");
                        setShowProfileModal(true);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg flex items-center space-x-2 transition-colors cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>User Profile Overview</span>
                    </button>

                    {/* 2. Edit Profile */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        setProfileTab("edit");
                        setShowProfileModal(true);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 rounded-lg flex items-center space-x-2 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Edit My Profile</span>
                    </button>

                    {/* 2. Manage 2FA */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        if (onOpenTwoFactorSetup) onOpenTwoFactorSetup();
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg flex items-center space-x-2 transition-colors cursor-pointer"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>{is2FA ? "Manage Google Authenticator" : "Setup Google Authenticator (2FA)"}</span>
                    </button>

                    {/* 3. Alert Gateway */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        if (onNavigate) onNavigate("settings", "system");
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg flex items-center space-x-2 transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Alert Gateway Config (Email & API)</span>
                    </button>

                    {/* 4. Alert Automation & Rules */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        if (onNavigate) onNavigate("settings", "alerts");
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg flex items-center space-x-2 transition-colors cursor-pointer"
                    >
                      <BellRing className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Alert Automation & Rules Engine</span>
                    </button>

                    {/* 5. User Management */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        if (onNavigate) onNavigate("settings", "users");
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg flex items-center space-x-2 transition-colors cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      <span>User Management & Permissions</span>
                    </button>

                    {/* 5. Audit Logs */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        if (onNavigate) onNavigate("settings", "audit");
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg flex items-center space-x-2 transition-colors cursor-pointer"
                    >
                      <FileCheck className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      <span>Security & Audit Logs</span>
                    </button>

                    {/* 6. Sign Out */}
                    {onLogout && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowProfileMenu(false);
                          onLogout();
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg flex items-center space-x-2 transition-colors cursor-pointer border-t border-slate-100 mt-1 pt-2"
                      >
                        <LogOut className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        <span>Sign Out / Switch User</span>
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Global Notification Detail & Dispatch Modal */}
      <NotificationDetailModal
        isOpen={detailModalOpen}
        notification={selectedNotification}
        onClose={() => setDetailModalOpen(false)}
        onMarkRead={(id) => {
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
          );
          setUnreadCount((c) => Math.max(0, c - 1));
        }}
        onNavigateToResource={(tab, sub) => {
          setDetailModalOpen(false);
          if (onNavigate) onNavigate(tab, sub);
        }}
      />

      {/* User Profile Overview & Edit Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {profileTab === "overview" ? "User Profile Overview" : "Edit Profile Information"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowProfileModal(false);
                  setProfileError(null);
                  setProfileMessage(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Toggle Tabs */}
            <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setProfileTab("overview");
                  setProfileError(null);
                  setProfileMessage(null);
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  profileTab === "overview"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Profile Overview
              </button>
              <button
                type="button"
                onClick={() => {
                  setProfileTab("edit");
                  setProfileError(null);
                  setProfileMessage(null);
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  profileTab === "edit"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Profile Details</span>
              </button>
            </div>

            {/* Notification Banners */}
            {profileMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{profileMessage}</span>
              </div>
            )}
            {profileError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            {/* Tab 1: Overview */}
            {profileTab === "overview" && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-12 h-12 rounded-full bg-[#0A192F] text-white font-bold text-sm flex items-center justify-center shrink-0">
                    {getInitials(displayName)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{displayName}</h4>
                    <p className="text-[11px] font-mono text-slate-500">@{displayUsername}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                      {displayRole}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 p-3 bg-white border border-slate-200 rounded-xl">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">EMAIL</span>
                    <span className="text-slate-800 font-medium truncate block">{displayEmail}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">JOB TITLE</span>
                    <span className="text-slate-800 font-medium truncate block">{currentUser?.title || "VP of Infrastructure & Security"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">DEPARTMENT</span>
                    <span className="text-slate-800 font-medium truncate block">{currentUser?.department || "IT Infrastructure"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">PHONE</span>
                    <span className="text-slate-800 font-medium truncate block">{currentUser?.phone || "+852 2277 6688"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">GOOGLE 2FA STATUS</span>
                    <span className={`inline-flex items-center text-[11px] font-bold ${is2FA ? "text-emerald-700" : "text-amber-600"}`}>
                      {is2FA ? "Active (TOTP Protected)" : "Disabled (Setup Recommended)"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">PRIMARY SITE</span>
                    <span className="text-slate-800 font-medium">Exchange Square HQ, HK</span>
                  </div>
                </div>

                <div className="p-3 bg-blue-50/60 border border-blue-200/60 rounded-xl space-y-1">
                  <span className="text-[11px] font-bold text-blue-900 block">Security Privileges:</span>
                  <p className="text-[10px] text-blue-800 leading-relaxed">
                    Full administrative access to network inventory, hardware lifecycle tracking, 42U rack telemetry, IPAM allocations, contracts, and outbound alert gateway dispatch.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setProfileTab("edit")}
                    className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Profile Data</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileModal(false);
                      if (onOpenTwoFactorSetup) onOpenTwoFactorSetup();
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    {is2FA ? "Manage 2FA" : "Configure 2FA"}
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Edit Form */}
            {profileTab === "edit" && (
              <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    placeholder="e.g. Fahrezi Fauzan"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-700 block mb-1 font-semibold">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="e.g. fahrezi@phillip.com.hk"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 block mb-1 font-semibold">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="+852 2277 6688"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-700 block mb-1 font-semibold">
                      Job Title / Designation
                    </label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="VP of Infrastructure & Security"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 block mb-1 font-semibold">
                      Department
                    </label>
                    <input
                      type="text"
                      value={editDepartment}
                      onChange={(e) => setEditDepartment(e.target.value)}
                      placeholder="IT Infrastructure"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Optional Password Change Section */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <span className="text-[11px] font-bold text-slate-800 block">
                    Change Password (Optional)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-600 block mb-1 text-[11px]">Current Password</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Required to change password"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 block mb-1 text-[11px]">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setProfileTab("overview")}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Back to Overview
                  </button>
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{profileSaving ? "Saving..." : "Save Profile Changes"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
