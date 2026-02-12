"use client";

import { useState, useCallback, memo } from "react";
import posthog from "posthog-js";
import { useAdmin } from "./AdminProvider";

/**
 * Minimal inline login that blends with the admin panel.
 * No embedded window UI. GPU-accelerated, no layout thrashing.
 */
export const AdminLogin = memo(function AdminLogin() {
  const { login } = useAdmin();
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    posthog.capture("admin_login_attempted");

    try {
      const res = await login(password, totp);
      if (!res.success) {
        setError(res.error || "ACCESS DENIED");
        setPassword("");
        setTotp("");
        posthog.capture("admin_login_failed", { error: res.error });
      }
    } catch {
      setError("SYSTEM ERROR");
    } finally {
      setLoading(false);
    }
  }, [login, password, totp, loading]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) setError("");
  }, [error]);

  const handleTotpChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTotp(e.target.value);
    if (error) setError("");
  }, [error]);

  return (
    <div className="h-full flex flex-col font-mono p-6">
      {/* Terminal output style */}
      <div className="text-xs text-[var(--text-muted)] mb-6 select-none">
        <p>Authorized personnel only.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Command line */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-green-400">➜</span>
          <span className="text-blue-400">~</span>
          <span className="text-[var(--text-tertiary)]">sudo authenticate</span>
        </div>

        {/* Password input */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[var(--text-muted)] whitespace-nowrap">[sudo] password:</span>
          <input
            type="password"
            value={password}
            onChange={handleChange}
            className="flex-1 bg-transparent border-none outline-none text-[var(--text-body)] font-mono"
            autoFocus
            autoComplete="off"
            spellCheck={false}
            disabled={loading}
          />
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-[var(--text-muted)] whitespace-nowrap">[sudo] totp:</span>
          <input
            type="text"
            inputMode="numeric"
            value={totp}
            onChange={handleTotpChange}
            className="flex-1 bg-transparent border-none outline-none text-[var(--text-body)] font-mono"
            autoComplete="one-time-code"
            spellCheck={false}
            disabled={loading}
          />
        </div>

        {/* Status line */}
        <div className="h-5 text-xs">
          {loading && (
            <span className="text-yellow-400">Verifying...</span>
          )}
          {error && (
            <span className="text-red-500 font-bold">{error}</span>
          )}
        </div>
      </form>
    </div>
  );
});
