"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, Copy, Check, AlertCircle, X, Smartphone, RefreshCw, Key, ShieldAlert, ArrowLeft } from "lucide-react";
import { apiUrl } from "@/lib/api";

interface TwoFactorSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  username: string;
  isAlreadyEnabled?: boolean;
  onSuccess: () => void;
}

export function TwoFactorSetupModal({
  isOpen,
  onClose,
  token,
  username,
  isAlreadyEnabled = false,
  onSuccess,
}: TwoFactorSetupModalProps) {
  const [viewMode, setViewMode] = useState<"status" | "setup">("status");
  const [loading, setLoading] = useState(false);
  const [setupData, setSetupData] = useState<{
    secret: string;
    otpauth_url: string;
    qr_code_base64: string;
    manual_entry_key: string;
  } | null>(null);

  const [verifyCode, setVerifyCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [confirmDisable, setConfirmDisable] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);

  // Initialize modal state on open
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setIsSuccess(false);
      setSuccessMessage("");
      setVerifyCode("");
      setConfirmDisable(false);

      if (isAlreadyEnabled) {
        setViewMode("status");
      } else {
        setViewMode("setup");
        fetchSetupData();
      }
    }
  }, [isOpen, isAlreadyEnabled]);

  const fetchSetupData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(apiUrl("/api/v1/auth/2fa/setup"), {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to initialize 2FA setup");
      }

      const data = await res.json();
      setSetupData(data);
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to load 2FA setup configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyKey = () => {
    if (setupData?.manual_entry_key) {
      navigator.clipboard.writeText(setupData.manual_entry_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleVerifyAndEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCode.trim() || verifyCode.trim().length < 6) {
      setErrorMessage("Please enter the 6-digit verification code from Google Authenticator.");
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const res = await fetch(apiUrl("/api/v1/auth/2fa/enable"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: verifyCode.trim(),
          secret: setupData?.secret || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Verification failed. Invalid code.");
      }

      setSuccessMessage("2FA Successfully Activated! Your account is now protected with TOTP authentication.");
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to verify 2FA code.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisable2FA = async () => {
    setIsDisabling(true);
    setErrorMessage(null);

    try {
      const res = await fetch(apiUrl("/api/v1/auth/2fa/disable"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to disable 2FA.");
      }

      setSuccessMessage("Two-Factor Authentication has been successfully disabled.");
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to disable 2FA.");
    } finally {
      setIsDisabling(false);
      setConfirmDisable(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-[#0A192F] px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isAlreadyEnabled && viewMode === "status" ? "bg-emerald-600/30 border border-emerald-400/30 text-emerald-400" : "bg-blue-600/30 border border-blue-400/30 text-blue-400"}`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight text-white">
                {isAlreadyEnabled && viewMode === "status" ? "Two-Factor Authentication (2FA) - Active" : "Google Authenticator 2FA Setup"}
              </h3>
              <p className="text-[11px] text-slate-300">
                Security configuration for <span className="font-semibold text-blue-300">{username}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {isSuccess ? (
            <div className="py-10 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Operation Successful</h4>
              <p className="text-xs text-slate-600 max-w-xs">
                {successMessage}
              </p>
            </div>
          ) : viewMode === "status" && isAlreadyEnabled ? (
            /* VIEW MODE: ACTIVE 2FA MANAGEMENT */
            <div className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2.5 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Status Banner */}
              <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-4 flex items-start space-x-3">
                <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-emerald-900">Google Authenticator is Active</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Protected
                    </span>
                  </div>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    Akun Anda saat ini terlindungi dengan verifikasi 2 langkah (TOTP). Setiap kali login, sistem mewajibkan username, password, dan kode 6-digit dari aplikasi authenticator di HP Anda.
                  </p>
                </div>
              </div>

              {/* Detail Info Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span className="font-medium">Authenticator Protocol</span>
                  <span className="font-semibold text-slate-800">RFC 6238 TOTP (Google Authenticator)</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="font-medium">Account Name</span>
                  <span className="font-mono font-semibold text-slate-800">{username}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="font-medium">Service Identifier</span>
                  <span className="font-semibold text-blue-700 font-mono">PSHK - NAMS</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode("setup");
                    fetchSetupData();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/80 text-blue-700 text-xs font-bold flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Setup Ulang / Scan Ulang QR Code (Ganti HP)</span>
                </button>

                {!confirmDisable ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDisable(true)}
                    className="w-full py-2 px-4 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                    <span>Nonaktifkan Two-Factor Authentication</span>
                  </button>
                ) : (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2.5">
                    <p className="text-xs text-red-800 font-medium">
                      Apakah Anda yakin ingin menonaktifkan 2FA? Keamanan akun akan berkurang karena hanya dilindungi password biasa.
                    </p>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        disabled={isDisabling}
                        onClick={handleDisable2FA}
                        className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:bg-red-300"
                      >
                        {isDisabling ? "Menonaktifkan..." : "Ya, Nonaktifkan 2FA"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDisable(false)}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* VIEW MODE: QR CODE SETUP / RECONFIGURE */
            <>
              {isAlreadyEnabled && (
                <button
                  type="button"
                  onClick={() => setViewMode("status")}
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer mb-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali ke Status 2FA Aktif</span>
                </button>
              )}

              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                  <p className="text-xs text-slate-500 font-medium">Generating encrypted 2FA secret & QR code...</p>
                </div>
              ) : (
                <>
                  {errorMessage && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2.5 text-xs text-red-700">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Instructions Steps */}
                  <div className="space-y-4">
                    {/* Step 1: Scan QR Code */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 mb-3">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                          1
                        </span>
                        <span>Scan QR Code with Google Authenticator</span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        {setupData?.qr_code_base64 && (
                          <div className="bg-white p-2.5 rounded-xl border-2 border-slate-200 shadow-sm shrink-0">
                            <img
                              src={setupData.qr_code_base64}
                              alt="Google Authenticator QR Code"
                              className="w-40 h-40 object-contain"
                            />
                          </div>
                        )}
                        <div className="text-xs text-slate-600 space-y-2">
                          <p>
                            Buka aplikasi <strong>Google Authenticator</strong> (atau Microsoft Authenticator) di HP Anda.
                          </p>
                          <p>
                            Tekan tombol <strong>+</strong> dan pilih <strong>Scan a QR code</strong> untuk memindai kode QR di samping.
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Nama akun akan otomatis tersimpan sebagai <strong>PSHK - NAMS: {username}</strong>.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Step 2: Manual Key (Fallback) */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                      <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 mb-2">
                        <span className="w-5 h-5 rounded-full bg-slate-600 text-white flex items-center justify-center text-[10px]">
                          2
                        </span>
                        <span>Tidak bisa scan? Masukkan setup key manual:</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <code className="flex-1 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold text-slate-800 tracking-wider select-all break-all">
                          {setupData?.manual_entry_key}
                        </code>
                        <button
                          type="button"
                          onClick={handleCopyKey}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-100 flex items-center space-x-1.5 text-slate-700 shrink-0 transition-colors cursor-pointer"
                          title="Copy Secret Key"
                        >
                          {copied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Step 3: Verify Code */}
                    <form onSubmit={handleVerifyAndEnable} className="space-y-3">
                      <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                          3
                        </span>
                        <label htmlFor="verify-code">
                          Masukkan 6-digit kode verifikasi dari aplikasi:
                        </label>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="relative flex-1">
                          <input
                            id="verify-code"
                            type="text"
                            maxLength={6}
                            value={verifyCode}
                            onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
                            placeholder="000 000"
                            className="w-full text-center tracking-[0.3em] font-mono text-xl font-bold py-2 border-2 border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none transition-colors"
                            required
                            autoFocus
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isVerifying || verifyCode.length < 6}
                          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer disabled:cursor-not-allowed"
                        >
                          {isVerifying ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Verifying...</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-4 h-4" />
                              <span>{isAlreadyEnabled ? "Konfirmasi & Ganti" : "Aktifkan 2FA"}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span>Standard RFC 6238 TOTP (Google Authenticator)</span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
