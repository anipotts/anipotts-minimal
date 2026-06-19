import { cookies, headers } from "next/headers";
import {
  ADMIN_COOKIE,
  ADMIN_CSRF_COOKIE,
  ADMIN_COOKIE_OPTIONS,
  ADMIN_CSRF_COOKIE_OPTIONS,
  createAdminCsrfToken,
  createSessionToken,
  hashAdminPassword,
  validateAdminPasswordCandidate,
  verifyAdminPassword,
  verifyAdminTotp,
  verifySessionToken,
} from "@anipotts/lib/admin";
import { getDB, now, uuid } from "@anipotts/lib/db";
import { getEnv } from "@anipotts/lib/env";
import { adminLoginSchema, formatZodError } from "@anipotts/lib/validation";
import { checkAdminLoginRateLimit } from "@/lib/rateLimit";

const ADMIN_PASSWORD_SETTING_KEY = "admin.password_hash";
const ADMIN_AUTH_AUDIT_KEY = "admin.auth.audit";
const ADMIN_AUTH_AUDIT_LIMIT = 50;

function loginIp(headersList: Headers) {
  return (
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    "unknown"
  );
}

async function getSiteSetting(key: string): Promise<string | null> {
  const db = getDB();
  if (!db) return null;
  const row = await db
    .prepare("SELECT value FROM site_settings WHERE key = ? LIMIT 1")
    .bind(key)
    .first<{ value: string }>();
  return row?.value ?? null;
}

async function setSiteSetting(key: string, value: string): Promise<void> {
  const db = getDB();
  if (!db) throw new Error("Database not configured");
  const ts = now();
  const id = uuid();
  await db
    .prepare(
      `INSERT INTO site_settings (id, key, value, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    )
    .bind(id, key, value, ts, ts)
    .run();
}

export async function getAdminPasswordMaterial(): Promise<string | undefined> {
  return (
    (await getSiteSetting(ADMIN_PASSWORD_SETTING_KEY)) ??
    getEnv("ADMIN_PASSWORD")
  );
}

async function appendAdminAudit(
  event: string,
  details: Record<string, unknown> = {},
): Promise<void> {
  const db = getDB();
  if (!db) return;
  try {
    const existing = await getSiteSetting(ADMIN_AUTH_AUDIT_KEY);
    const parsed = existing ? JSON.parse(existing) : [];
    const audit = Array.isArray(parsed) ? parsed : [];
    audit.unshift({ event, at: now(), ...details });
    await setSiteSetting(
      ADMIN_AUTH_AUDIT_KEY,
      JSON.stringify(audit.slice(0, ADMIN_AUTH_AUDIT_LIMIT)),
    );
  } catch {
    // Audit logging must never block a guarded admin action.
  }
}

export async function requireAuth(): Promise<{ error: string } | null> {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  const secret = await getAdminPasswordMaterial();
  if (!token || !secret || !verifySessionToken(token, secret)) {
    return { error: "Unauthorized" };
  }
  return null;
}

export async function loginAdmin(formData: FormData) {
  const hdrs = await headers();
  const ip = loginIp(hdrs);
  const rateLimit = await checkAdminLoginRateLimit(ip);
  if (!rateLimit.success) {
    await appendAdminAudit("login_rate_limited", { ip });
    return { error: "Too many login attempts. Try again later." };
  }

  const raw = {
    password: formData.get("password") as string,
    totp: (formData.get("totp") as string) || "",
  };

  const parsed = adminLoginSchema.safeParse(raw);
  if (!parsed.success) {
    return formatZodError(parsed.error);
  }

  const { password, totp } = parsed.data;

  const authMaterial = await getAdminPasswordMaterial();
  const pwResult = verifyAdminPassword(password, authMaterial);
  if (!pwResult.success) {
    await appendAdminAudit("login_failed", { ip, reason: "password" });
    return { error: pwResult.error || "Invalid password" };
  }

  const totpSecret = getEnv("ADMIN_TOTP_SECRET");
  if (totpSecret) {
    if (!totp) {
      return { error: "TOTP code is required" };
    }
    const totpResult = verifyAdminTotp(totp, totpSecret);
    if (!totpResult.success) {
      await appendAdminAudit("login_failed", { ip, reason: "totp" });
      return { error: totpResult.error || "Invalid TOTP" };
    }
  }

  const token = createSessionToken(authMaterial ?? "");
  const csrf = createAdminCsrfToken();
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, token, {
    ...ADMIN_COOKIE_OPTIONS,
    sameSite: ADMIN_COOKIE_OPTIONS.sameSite as "strict" | "lax" | "none",
  });
  jar.set(ADMIN_CSRF_COOKIE, csrf, {
    ...ADMIN_CSRF_COOKIE_OPTIONS,
    sameSite: ADMIN_CSRF_COOKIE_OPTIONS.sameSite as "strict" | "lax" | "none",
  });

  await appendAdminAudit("login_success", { ip });
  return { success: true };
}

export async function logoutAdmin() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
  jar.delete(ADMIN_CSRF_COOKIE);
  return { success: true };
}

export async function getAdminSecurityStateAdmin() {
  const authError = await requireAuth();
  if (authError) return authError;

  const jar = await cookies();
  const csrfToken = jar.get(ADMIN_CSRF_COOKIE)?.value ?? "";
  const auditRaw = await getSiteSetting(ADMIN_AUTH_AUDIT_KEY);
  let audit: Array<Record<string, unknown>> = [];
  try {
    const parsed = auditRaw ? JSON.parse(auditRaw) : [];
    audit = Array.isArray(parsed) ? parsed.slice(0, 10) : [];
  } catch {
    audit = [];
  }

  return {
    success: true as const,
    csrfToken,
    hasPasswordOverride: Boolean(
      await getSiteSetting(ADMIN_PASSWORD_SETTING_KEY),
    ),
    audit,
  };
}

export async function changeAdminPasswordAdmin(formData: FormData) {
  const authError = await requireAuth();
  if (authError) return authError;

  const hdrs = await headers();
  const ip = loginIp(hdrs);
  const jar = await cookies();
  const csrfCookie = jar.get(ADMIN_CSRF_COOKIE)?.value;
  const csrf = String(formData.get("csrf") ?? "");
  if (!csrfCookie || !csrf || csrfCookie !== csrf) {
    await appendAdminAudit("password_change_failed", { ip, reason: "csrf" });
    return {
      error: "Session expired. Sign out and back in before changing password.",
    };
  }

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const nextPassword = String(formData.get("nextPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const authMaterial = await getAdminPasswordMaterial();
  const current = verifyAdminPassword(currentPassword, authMaterial);
  if (!current.success) {
    await appendAdminAudit("password_change_failed", {
      ip,
      reason: "current_password",
    });
    return { error: "Current password is incorrect" };
  }
  if (nextPassword !== confirmPassword) {
    return { error: "New passwords do not match" };
  }
  const candidate = validateAdminPasswordCandidate(nextPassword);
  if (!candidate.success) {
    return { error: candidate.error ?? "Invalid password" };
  }

  const nextHash = hashAdminPassword(nextPassword);
  await setSiteSetting(ADMIN_PASSWORD_SETTING_KEY, nextHash);
  const nextCsrf = createAdminCsrfToken();
  jar.set(ADMIN_COOKIE, createSessionToken(nextHash), {
    ...ADMIN_COOKIE_OPTIONS,
    sameSite: ADMIN_COOKIE_OPTIONS.sameSite as "strict" | "lax" | "none",
  });
  jar.set(ADMIN_CSRF_COOKIE, nextCsrf, {
    ...ADMIN_CSRF_COOKIE_OPTIONS,
    sameSite: ADMIN_CSRF_COOKIE_OPTIONS.sameSite as "strict" | "lax" | "none",
  });
  await appendAdminAudit("password_changed", { ip });
  return { success: true };
}
