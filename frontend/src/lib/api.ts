/**
 * Enterprise API Configuration & URL Resolver
 * Network Asset Management System (Phillip Securities Hong Kong)
 *
 * Automatically resolves API endpoints:
 * 1. Relative path `/api/v1/...` (proxied by Next.js server to backend, works seamlessly in Docker & Production)
 * 2. Absolute URL if `NEXT_PUBLIC_API_URL` is explicitly provided.
 */

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    // If NEXT_PUBLIC_API_URL is configured
    if (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.trim() !== "") {
      const url = process.env.NEXT_PUBLIC_API_URL.trim();
      return url.endsWith("/") ? url.slice(0, -1) : url;
    }
    // Default in browser: use relative path so Next.js proxies to backend (zero CORS, zero DNS mismatch)
    return "";
  }

  // Server-side execution in Next.js (SSR / API routes)
  return process.env.INTERNAL_BACKEND_URL || "http://127.0.0.1:8000";
}

export function apiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const base = getApiBaseUrl();
  return `${base}${cleanEndpoint}`;
}

