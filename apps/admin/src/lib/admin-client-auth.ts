export type AdminClientPrincipal = {
  userId: string;
  role: "owner" | "operator" | "viewer";
  sessionId: string;
  authMethod:
    | "passkey"
    | "device_approval"
    | "google_recovery"
    | "legacy_passkey";
  stepUpAt: string | null;
  restriction: "recovery" | null;
  displayName: string;
  credentialId: string | null;
};

type AdminSessionEnvelope = {
  authenticated: true;
  principal: AdminClientPrincipal;
  csrf_token: string;
};

export class AdminClientAuthError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string) {
    super(code);
    this.name = "AdminClientAuthError";
    this.status = status;
    this.code = code;
  }
}

export async function getAdminCsrfToken(): Promise<string> {
  const response = await fetch("/api/admin/auth/session", {
    cache: "no-store",
    credentials: "same-origin",
    headers: { accept: "application/json" },
  });
  const data = (await response.json().catch(() => null)) as
    | AdminSessionEnvelope
    | { error?: string }
    | null;
  if (
    !response.ok ||
    !data ||
    !("authenticated" in data) ||
    data.authenticated !== true ||
    typeof data.csrf_token !== "string"
  ) {
    throw new AdminClientAuthError(
      response.status,
      data && "error" in data && typeof data.error === "string"
        ? data.error
        : "admin_session_required",
    );
  }
  return data.csrf_token;
}

export async function adminMutationFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const csrfToken = await getAdminCsrfToken();
  const headers = new Headers(init.headers);
  headers.set("accept", "application/json");
  headers.set("x-admin-csrf", csrfToken);
  return fetch(input, {
    ...init,
    credentials: "same-origin",
    headers,
  });
}

export function adminStepUpPath(nextPath?: string): string {
  const next =
    nextPath ??
    (typeof window === "undefined"
      ? "/"
      : `${window.location.pathname}${window.location.search}`);
  return `/auth?stepup=1&next=${encodeURIComponent(next)}`;
}
