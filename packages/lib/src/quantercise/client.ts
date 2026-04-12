import type {
  QCEnv,
  QCDashboard,
  QCUsersResponse,
  QCFeatureFlagsResponse,
} from "./types";

const QC_DEFAULT_BASE_URL = "https://quantercise.com";
const QC_TIMEOUT_MS = 10_000;

function getBaseUrl(env: QCEnv): string {
  return env.QUANTERCISE_BASE_URL || QC_DEFAULT_BASE_URL;
}

/**
 * Generic fetch wrapper for the Quantercise admin API.
 * Follows the mercury.ts pattern: typed response, Bearer auth, timeout, error handling.
 */
export async function qcFetch<T>(
  path: string,
  env: QCEnv,
  init?: RequestInit,
): Promise<T> {
  const token = env.QUANTERCISE_ADMIN_TOKEN;
  if (!token) {
    throw new Error("QUANTERCISE_ADMIN_TOKEN not configured");
  }

  const url = `${getBaseUrl(env)}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...init?.headers,
    },
    signal: init?.signal ?? AbortSignal.timeout(QC_TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new Error(`Quantercise API ${res.status}: ${path}`);
  }

  return res.json() as Promise<T>;
}

/** Fetch aggregated dashboard data */
export async function getQCDashboard(env: QCEnv): Promise<QCDashboard> {
  return qcFetch<QCDashboard>("/api/admin/dashboard", env);
}

/** Fetch user list */
export async function getQCUsers(env: QCEnv): Promise<QCUsersResponse> {
  return qcFetch<QCUsersResponse>("/api/admin/users", env);
}

/** Fetch feature flags */
export async function getQCFeatureFlags(
  env: QCEnv,
): Promise<QCFeatureFlagsResponse> {
  return qcFetch<QCFeatureFlagsResponse>("/api/admin/feature-flags", env);
}

/** Proxy a mutation (POST/PATCH/DELETE) to a Quantercise admin endpoint */
export async function qcMutate<T>(
  path: string,
  env: QCEnv,
  body: unknown,
  method: "POST" | "PATCH" | "DELETE" = "POST",
): Promise<T> {
  return qcFetch<T>(path, env, {
    method,
    body: JSON.stringify(body),
  });
}
