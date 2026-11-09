"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Lock, User, ShieldCheck, ArrowRight, ArrowLeft, RefreshCw, AlertCircle, KeyRound, Check } from "lucide-react";
import { apiUrl } from "@/lib/api";

interface LoginViewProps {
  onLoginSuccess: (token: string, user: any) => void;
}

export function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");

  const [requires2FA, setRequires2FA] = useState(false);
  const [targetUser, setTargetUser] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showDemoAccounts, setShowDemoAccounts] = useState<boolean>(() => {
    return process.env.NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS !== "false";
  });

  React.useEffect(() => {
    fetch(apiUrl("/api/v1/auth/system-config"))
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.show_demo_credentials === "boolean") {
          setShowDemoAccounts(data.show_demo_credentials);
        }
      })
      .catch(() => {});
  }, []);

  // Quick fill accounts for testing
  const demoAccounts = [
    { username: "admin", label: "Super Admin (Fahrezi Fauzan)", role: "SUPER_ADMIN" },
    { username: "netadmin", label: "Network Admin (John Zhang)", role: "NETWORK_ADMIN" },
    { username: "assetmgr", label: "Asset Manager (Kelvin Chan)", role: "ASSET_MANAGER" },
  ];

  const handleQuickFill = (uname: string) => {
    setUsername(uname);
    setPassword("Phillip2026!");
    setError(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Please enter both username and password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload: any = {
        username: username.trim(),
        password: password,
      };

      if (requires2FA && twoFactorCode.trim()) {
        payload.two_factor_code = twoFactorCode.trim();
      }

      const res = await fetch(apiUrl("/api/v1/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Authentication failed.");
      }

      // Check if 2FA is required
      if (data.requires_2fa) {
        setRequires2FA(true);
        setTargetUser(data.user);
        setTwoFactorCode("");
        setError(null);
        return;
      }

      // Authentication succeeded
      if (data.access_token && data.user) {
        localStorage.setItem("phillip_token", data.access_token);
        localStorage.setItem("phillip_user", JSON.stringify(data.user));
        onLoginSuccess(data.access_token, data.user);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToCredentials = () => {
    setRequires2FA(false);
    setTwoFactorCode("");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#060D17] via-[#0A192F] to-[#112240] flex flex-col justify-between py-10 px-4 select-none">
      {/* Top Brand Bar */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-white p-1 shadow-md border border-slate-700/50 flex items-center justify-center">
            <Image
              src="/philliplogo.jpg"
              alt="Phillip Securities"
              width={34}
              height={34}
              className="object-contain"
              priority
            />
          </div>
          <div>
            <h2 className="text-white font-bold text-sm leading-tight tracking-tight">
              Phillip Securities Hong Kong
            </h2>
            <p className="text-slate-400 text-[11px]">輝立證券（香港）有限公司</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Enterprise Portal • TLS 1.3</span>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-auto py-6">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Card Header with Hong Kong Panorama Background */}
          <div className="relative px-8 py-7 text-white text-center overflow-hidden bg-[#0A192F]">
            <Image
              src="/hk_harbour_panorama.jpg"
              alt="Hong Kong Victoria Harbour"
              fill
              className="object-cover object-center opacity-35"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0A192F]/80 via-[#0A192F]/95 to-[#0A192F]" />
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 mb-3 shadow-inner">
                {requires2FA ? (
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                ) : (
                  <KeyRound className="w-6 h-6 text-cyan-400" />
                )}
              </div>
              <h1 className="text-lg font-bold tracking-tight text-white drop-shadow-sm">
                {requires2FA ? "Two-Factor Verification" : "Sign In to Asset Management"}
              </h1>
              <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
                {requires2FA
                  ? "Enter 6-digit TOTP code from Google Authenticator"
                  : "Phillip Securities Hong Kong Network Infrastructure"}
              </p>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-8 space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2.5 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            {!requires2FA ? (
              /* Step 1: Username & Password */
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Username or Email
                    </label>
                    <span className="text-[10px] text-slate-400 italic">
                      Email is optional
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. admin or admin@phillip.com.hk"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                      required
                      autoFocus
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-mono"
                      required
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Quick-Fill Demo Credentials (Auto-detected from system-config & environment) */}
                {showDemoAccounts && (
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-[11px] font-semibold text-slate-400 mb-2">
                      Quick Sign-In Accounts (Demo):
                    </p>
                    <div className="space-y-1.5">
                      {demoAccounts.map((acc) => (
                        <button
                          key={acc.username}
                          type="button"
                          onClick={() => handleQuickFill(acc.username)}
                          className={`w-full text-left px-3 py-1.5 rounded-lg border text-xs flex items-center justify-between transition-colors ${
                            username === acc.username
                              ? "bg-blue-50 border-blue-300 text-blue-800"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <span className="font-mono font-medium">{acc.username}</span>
                          <span className="text-[10px] text-slate-400">{acc.role}</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 text-center mt-2">
                      Default password: <code className="font-mono font-bold text-slate-600">Phillip2026!</code>
                    </p>
                  </div>
                )}
              </form>
            ) : (
              /* Step 2: Google Authenticator 2FA Verification */
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="bg-blue-50/70 border border-blue-200/60 rounded-2xl p-4 text-center space-y-1.5">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white mx-auto flex items-center justify-center shadow-sm">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    Google Authenticator Required
                  </p>
                  <p className="text-[11px] text-slate-600">
                    User: <span className="font-mono font-bold text-blue-700">{targetUser?.username || username}</span>
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block text-center mb-2">
                    Enter 6-digit TOTP verification code:
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    className="w-full text-center tracking-[0.4em] font-mono text-2xl font-bold py-2.5 border-2 border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none transition-colors"
                    required
                    autoFocus
                  />
                  <p className="text-[11px] text-slate-400 text-center mt-2">
                    Open Google Authenticator on your phone to view the code.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="submit"
                    disabled={loading || twoFactorCode.length < 6}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying 2FA...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Verify & Sign In</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleBackToCredentials}
                    className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center space-x-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Credentials</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Card Footer */}
          <div className="bg-slate-50 px-8 py-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Phillip Securities Hong Kong Ltd</span>
            <span>Version 1.0.0</span>
          </div>
        </div>
      </div>

      {/* Bottom Legal / Compliance */}
      <div className="max-w-6xl w-full mx-auto text-center text-[11px] text-slate-400">
        <p>
          © 2026 Phillip Securities (Hong Kong) Limited. All rights reserved. Authorized personnel only.
        </p>
      </div>
    </div>
  );
}

