import type {
  QCEnv,
  QCDashboard,
  QCUsersListResponse,
  QCUser,
  QCProblemsResponse,
  QCProblem,
  QCAnalytics,
  QCRevenueAnalytics,
  QCPaymentAnalytics,
  QCFeatureFlagsResponse,
  QCQAResponse,
  QCObservability,
  QCFailedEventsResponse,
  QCTwitterSearchResponse,
  QCTwitterStatusResponse,
  QCRedditSearchResponse,
  QCFeedbackResponse,
} from "./types";

const QC_DEFAULT_BASE_URL = "https://quantercise.com";
const QC_TIMEOUT_MS = 10_000;

function getBaseUrl(env: QCEnv): string {
  return env.QUANTERCISE_BASE_URL || QC_DEFAULT_BASE_URL;
}

function buildQuery(params: Record<string, unknown>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null,
  );
  if (entries.length === 0) return "";
  return (
    "?" +
    entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&")
  );
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

// ── Dashboard ──

export async function getQCDashboard(env: QCEnv): Promise<QCDashboard> {
  return qcFetch<QCDashboard>("/api/admin/dashboard", env);
}

// ── Users ──

export async function getQCUsers(env: QCEnv): Promise<QCUsersListResponse> {
  return qcFetch<QCUsersListResponse>("/api/admin/users", env);
}

export async function getQCUser(
  env: QCEnv,
  userId: string,
): Promise<{ user: QCUser }> {
  return qcFetch<{ user: QCUser }>(
    `/api/admin/users/${encodeURIComponent(userId)}`,
    env,
  );
}

// ── Problems ──

export async function getQCProblems(
  env: QCEnv,
  params?: {
    limit?: number;
    offset?: number;
    search?: string;
    difficulty?: string;
    topic?: string;
    includeDeleted?: boolean;
  },
): Promise<QCProblemsResponse> {
  const qs = params ? buildQuery(params) : "";
  return qcFetch<QCProblemsResponse>(`/api/admin/problems${qs}`, env);
}

export async function getQCProblem(
  env: QCEnv,
  id: string,
): Promise<{ problem: QCProblem }> {
  return qcFetch<{ problem: QCProblem }>(
    `/api/admin/problems/${encodeURIComponent(id)}`,
    env,
  );
}

// ── Analytics ──

export async function getQCAnalytics(
  env: QCEnv,
): Promise<{ analytics: QCAnalytics }> {
  return qcFetch<{ analytics: QCAnalytics }>("/api/admin/analytics", env);
}

export async function getQCRevenue(env: QCEnv): Promise<QCRevenueAnalytics> {
  return qcFetch<QCRevenueAnalytics>("/api/admin/analytics/revenue", env);
}

export async function getQCPayments(env: QCEnv): Promise<QCPaymentAnalytics> {
  return qcFetch<QCPaymentAnalytics>("/api/admin/analytics/payments", env);
}

// ── Feature Flags ──

export async function getQCFeatureFlags(
  env: QCEnv,
): Promise<QCFeatureFlagsResponse> {
  return qcFetch<QCFeatureFlagsResponse>("/api/admin/feature-flags", env);
}

// ── QA ──

export async function getQCQA(
  env: QCEnv,
  params?: {
    status?: string;
    difficulty?: string;
    topic?: string;
    includeStats?: boolean;
  },
): Promise<QCQAResponse> {
  const qs = params ? buildQuery(params) : "";
  return qcFetch<QCQAResponse>(`/api/admin/qa${qs}`, env);
}

// ── Observability ──

export async function getQCObservability(
  env: QCEnv,
): Promise<{ success: true; data: QCObservability }> {
  return qcFetch<{ success: true; data: QCObservability }>(
    "/api/admin/observability",
    env,
  );
}

export async function getQCFailedEvents(
  env: QCEnv,
  params?: {
    status?: string;
    source?: string;
    limit?: number;
    cursor?: string;
  },
): Promise<QCFailedEventsResponse> {
  const qs = params ? buildQuery(params) : "";
  return qcFetch<QCFailedEventsResponse>(`/api/admin/failed-events${qs}`, env);
}

// ── Marketing ──

export async function searchQCTwitter(
  env: QCEnv,
  params?: { queries?: string; limit?: number; days?: number },
): Promise<QCTwitterSearchResponse> {
  const qs = params ? buildQuery(params) : "";
  return qcFetch<QCTwitterSearchResponse>(
    `/api/admin/marketing/twitter/search${qs}`,
    env,
  );
}

export async function getQCTwitterStatus(
  env: QCEnv,
): Promise<QCTwitterStatusResponse> {
  return qcFetch<QCTwitterStatusResponse>(
    "/api/admin/marketing/twitter/status",
    env,
  );
}

export async function searchQCReddit(
  env: QCEnv,
  params?: {
    subreddits?: string;
    keywords?: string;
    days?: number;
    limit?: number;
  },
): Promise<QCRedditSearchResponse> {
  const qs = params ? buildQuery(params) : "";
  return qcFetch<QCRedditSearchResponse>(
    `/api/admin/marketing/reddit/search${qs}`,
    env,
  );
}

// ── Feedback ──

export async function getQCFeedback(
  env: QCEnv,
  params?: { status?: string; type?: string; page?: number; per_page?: number },
): Promise<QCFeedbackResponse> {
  const qs = params ? buildQuery(params) : "";
  return qcFetch<QCFeedbackResponse>(`/api/admin/feedback${qs}`, env);
}

export async function updateQCFeedback(
  env: QCEnv,
  issueNumber: number,
  action: "close" | "reopen" | "comment",
  comment?: string,
): Promise<{ success: boolean }> {
  return qcMutate<{ success: boolean }>(
    "/api/admin/feedback",
    env,
    {
      issueNumber,
      action,
      comment,
    },
    "PATCH",
  );
}
