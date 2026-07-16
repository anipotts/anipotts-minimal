export const REQUIRED_PASSKEY_AUDIT_EVENTS = [
  "passkey.credential.registered",
  "passkey.session.created",
  "passkey.session.revoked",
  "passkey.credential.revoked",
  "passkey.authentication.denied",
] as const;

export const expectedPasskeyTables = [
  "admin_passkey_audit",
  "admin_passkey_challenges",
  "admin_passkey_credentials",
  "admin_passkey_sessions",
] as const;

export const manualPasskeyEnrollmentSequence = [
  "open /auth/passkey through Cloudflare Access",
  "click register passkey and finish the platform biometric prompt",
  "click authenticate to create an app-native admin session",
  "reload a protected route to prove session persistence",
  "logout once, then authenticate again",
  "revoke the current passkey while Cloudflare Access remains active",
  "authenticate once while revoked to record denial, then register and authenticate a replacement passkey",
] as const;

export type RequiredPasskeyAuditEvent =
  (typeof REQUIRED_PASSKEY_AUDIT_EVENTS)[number];

export type PasskeyAuditEvents = Record<RequiredPasskeyAuditEvent, number>;

export type PasskeyRouteBoundary =
  | "cloudflare_access"
  | "app_native_passkey"
  | "unknown";

export type PasskeyProofItem = {
  id: string;
  label: string;
  count: number;
  complete: boolean;
  next_safe_action: string;
};

export function emptyPasskeyAuditEvents(): PasskeyAuditEvents {
  return Object.fromEntries(
    REQUIRED_PASSKEY_AUDIT_EVENTS.map((eventType) => [eventType, 0]),
  ) as PasskeyAuditEvents;
}

export function normalizePasskeyAuditEvents(
  auditEvents: Partial<Record<string, unknown>>,
): PasskeyAuditEvents {
  const normalized = emptyPasskeyAuditEvents();
  for (const eventType of REQUIRED_PASSKEY_AUDIT_EVENTS) {
    const count = auditEvents[eventType];
    normalized[eventType] =
      typeof count === "number" && Number.isFinite(count) ? count : 0;
  }
  return normalized;
}

export function missingRequiredPasskeyAuditEvents(
  auditEvents: Partial<Record<string, unknown>>,
): RequiredPasskeyAuditEvent[] {
  const normalized = normalizePasskeyAuditEvents(auditEvents);
  return REQUIRED_PASSKEY_AUDIT_EVENTS.filter(
    (eventType) => normalized[eventType] === 0,
  );
}

export function buildPasskeyProofItems(
  credentialCount: number,
  hasSession: boolean,
  auditEvents: Partial<Record<string, unknown>>,
): PasskeyProofItem[] {
  const normalized = normalizePasskeyAuditEvents(auditEvents);
  return [
    {
      id: "independent_credentials",
      label: "independent credentials",
      count: credentialCount,
      complete: credentialCount >= 2,
      next_safe_action: "register two independent platform passkeys",
    },
    {
      id: "active_session",
      label: "active session",
      count: hasSession ? 1 : 0,
      complete: hasSession,
      next_safe_action: "authenticate with the registered passkey",
    },
    {
      id: "passkey.credential.registered",
      label: "registration audit",
      count: normalized["passkey.credential.registered"],
      complete: normalized["passkey.credential.registered"] > 0,
      next_safe_action: "register the first platform passkey",
    },
    {
      id: "passkey.session.created",
      label: "login audit",
      count: normalized["passkey.session.created"],
      complete: normalized["passkey.session.created"] > 0,
      next_safe_action: "authenticate with the registered passkey",
    },
    {
      id: "passkey.session.revoked",
      label: "logout audit",
      count: normalized["passkey.session.revoked"],
      complete: normalized["passkey.session.revoked"] > 0,
      next_safe_action: "logout once, then authenticate again",
    },
    {
      id: "passkey.credential.revoked",
      label: "credential revoke audit",
      count: normalized["passkey.credential.revoked"],
      complete: normalized["passkey.credential.revoked"] > 0,
      next_safe_action:
        "revoke the current passkey while Cloudflare Access remains active",
    },
    {
      id: "passkey.authentication.denied",
      label: "revoked credential denial audit",
      count: normalized["passkey.authentication.denied"],
      complete: normalized["passkey.authentication.denied"] > 0,
      next_safe_action:
        "attempt authenticate after revocation, then register a replacement",
    },
  ];
}

export function passkeyAccessRemovalBlockers({
  schemaReady = true,
  credentialCount,
  sessionCount,
  hasSession,
  auditEvents,
  missingAuditEvents,
}: {
  schemaReady?: boolean;
  credentialCount: number;
  sessionCount?: number;
  hasSession?: boolean;
  auditEvents?: Partial<Record<string, unknown>>;
  missingAuditEvents?: readonly string[];
}): string[] {
  const blockers: string[] = [];
  const sessionReady = hasSession ?? Number(sessionCount ?? 0) > 0;
  const missingEvents =
    missingAuditEvents ?? missingRequiredPasskeyAuditEvents(auditEvents ?? {});

  if (!schemaReady) blockers.push("schema_ready");
  if (credentialCount < 2) blockers.push("two_independent_credentials");
  if (!sessionReady) blockers.push("active_session");
  blockers.push(...missingEvents);
  return blockers;
}

export function passkeyMissingProofItems({
  accessRemovalBlockers,
  routeBoundary,
}: {
  accessRemovalBlockers: readonly string[];
  routeBoundary: PasskeyRouteBoundary;
}): string[] {
  const missing = [...accessRemovalBlockers];
  if (routeBoundary === "cloudflare_access") return missing;
  if (routeBoundary !== "app_native_passkey") {
    missing.push("app_native_route_boundary");
  }
  return missing;
}

export function nextPasskeyProofAction({
  schemaReady = true,
  credentialCount,
  sessionCount,
  missingAuditEvents,
  routeBoundary = "unknown",
}: {
  schemaReady?: boolean;
  credentialCount: number;
  sessionCount: number;
  missingAuditEvents: readonly string[];
  routeBoundary?: PasskeyRouteBoundary;
}): string {
  if (!schemaReady) {
    return "apply drizzle/migrations/0006_admin_passkeys.sql before enrollment";
  }
  if (credentialCount === 0) {
    return "open /auth/passkey behind Cloudflare Access and register the first platform passkey";
  }
  if (credentialCount < 2) {
    return "register a second independent passkey while Cloudflare Access remains active";
  }
  if (sessionCount === 0) {
    return "authenticate with the registered passkey and prove a durable app-native session";
  }
  if (missingAuditEvents.includes("passkey.session.revoked")) {
    return "logout once to record session revocation, then authenticate again before Access removal";
  }
  if (missingAuditEvents.includes("passkey.credential.revoked")) {
    return "revoke the current passkey while Cloudflare Access remains active, then register a replacement";
  }
  if (missingAuditEvents.includes("passkey.authentication.denied")) {
    return "record revoked-credential denial proof while Cloudflare Access remains active";
  }
  if (missingAuditEvents.length > 0) {
    return `record missing passkey audit proof: ${missingAuditEvents.join(", ")}`;
  }
  if (routeBoundary === "cloudflare_access") {
    return "passkey proof is staged; remove Cloudflare Access and rerun this proof";
  }
  if (routeBoundary === "app_native_passkey") {
    return "record app-native unauthenticated block and authenticated route render proof";
  }
  return "inspect route boundary before changing Access";
}

export function nextPasskeyStatusAction({
  hasSession,
  credentialCount,
  accessIdentityVerified,
}: {
  hasSession: boolean;
  credentialCount: number;
  accessIdentityVerified: boolean;
}): string {
  if (hasSession) return "passkey session active";
  if (credentialCount === 0 && accessIdentityVerified) {
    return "register the first passkey with verified Cloudflare Access identity";
  }
  if (credentialCount === 0) {
    return "authenticate through Cloudflare Access before first passkey registration";
  }
  if (credentialCount < 2 && accessIdentityVerified) {
    return "register a second independent passkey before Access removal";
  }
  return "authenticate with the registered passkey";
}
