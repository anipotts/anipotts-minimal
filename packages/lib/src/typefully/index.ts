import type {
  TypefullyDraft,
  TypefullyQueueSummary,
} from "@anipotts/types";

const API_BASE = "https://api.typefully.com/v2";

// Monthly post limit for Creator plan
const MONTHLY_LIMIT = 15;

async function typefullyFetch(
  apiKey: string,
  endpoint: string,
  method: "GET" | "POST" | "PATCH" | "DELETE" = "GET",
  body?: Record<string, unknown>
): Promise<unknown> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : {};

  if (!res.ok) {
    throw new Error(
      `Typefully API ${res.status}: ${JSON.stringify(data)}`
    );
  }

  return data;
}

export async function fetchTypefullyDrafts(
  apiKey: string,
  socialSetId: number,
  options?: { status?: string; sort?: string; limit?: number }
): Promise<TypefullyDraft[]> {
  const params = new URLSearchParams();
  params.set("limit", String(options?.limit ?? 50));
  if (options?.status) params.set("status", options.status);
  if (options?.sort) params.set("order_by", options.sort);

  const data = (await typefullyFetch(
    apiKey,
    `/social-sets/${socialSetId}/drafts?${params}`
  )) as { results?: TypefullyDraft[] };

  return data.results ?? [];
}

export async function fetchTypefullyDraft(
  apiKey: string,
  socialSetId: number,
  draftId: number
): Promise<TypefullyDraft> {
  return (await typefullyFetch(
    apiKey,
    `/social-sets/${socialSetId}/drafts/${draftId}`
  )) as TypefullyDraft;
}

export async function createTypefullyDraft(
  apiKey: string,
  socialSetId: number,
  text: string,
  options?: {
    platforms?: string[];
    schedule?: string;
    title?: string;
    tags?: string[];
  }
): Promise<TypefullyDraft> {
  const posts = text
    .split(/\n---\n/)
    .filter((t) => t.trim())
    .map((t) => ({ text: t }));

  const platformList = options?.platforms ?? ["x"];
  const platformsObj: Record<string, { enabled: boolean; posts: { text: string }[] }> = {};
  for (const p of platformList) {
    platformsObj[p] = { enabled: true, posts };
  }

  const body: Record<string, unknown> = { platforms: platformsObj };
  if (options?.title) body.draft_title = options.title;
  if (options?.schedule) body.publish_at = options.schedule;
  if (options?.tags) body.tags = options.tags;

  return (await typefullyFetch(
    apiKey,
    `/social-sets/${socialSetId}/drafts`,
    "POST",
    body
  )) as TypefullyDraft;
}

export async function updateTypefullyDraft(
  apiKey: string,
  socialSetId: number,
  draftId: number,
  updates: { text?: string; schedule?: string }
): Promise<TypefullyDraft> {
  const body: Record<string, unknown> = {};

  if (updates.text) {
    // Fetch existing to determine platforms
    const existing = await fetchTypefullyDraft(apiKey, socialSetId, draftId);
    const platformList = Object.entries(existing.platforms || {})
      .filter(([, config]) => config.enabled)
      .map(([platform]) => platform);

    const posts = updates.text
      .split(/\n---\n/)
      .filter((t) => t.trim())
      .map((t) => ({ text: t }));

    const platformsObj: Record<string, { enabled: boolean; posts: { text: string }[] }> = {};
    for (const p of platformList) {
      platformsObj[p] = { enabled: true, posts };
    }
    body.platforms = platformsObj;
  }

  if (updates.schedule) {
    body.publish_at = updates.schedule;
  }

  return (await typefullyFetch(
    apiKey,
    `/social-sets/${socialSetId}/drafts/${draftId}`,
    "PATCH",
    body
  )) as TypefullyDraft;
}

export async function scheduleTypefullyDraft(
  apiKey: string,
  socialSetId: number,
  draftId: number,
  time: string
): Promise<TypefullyDraft> {
  return (await typefullyFetch(
    apiKey,
    `/social-sets/${socialSetId}/drafts/${draftId}`,
    "PATCH",
    { publish_at: time }
  )) as TypefullyDraft;
}

export async function publishTypefullyDraft(
  apiKey: string,
  socialSetId: number,
  draftId: number
): Promise<TypefullyDraft> {
  return (await typefullyFetch(
    apiKey,
    `/social-sets/${socialSetId}/drafts/${draftId}`,
    "PATCH",
    { publish_at: "now" }
  )) as TypefullyDraft;
}

export async function fetchTypefullyQueueSummary(
  apiKey: string,
  socialSetId: number
): Promise<TypefullyQueueSummary> {
  const [drafts, scheduled, published] = await Promise.all([
    fetchTypefullyDrafts(apiKey, socialSetId, { status: "draft", limit: 50 }),
    fetchTypefullyDrafts(apiKey, socialSetId, {
      status: "scheduled",
      sort: "scheduled_date",
      limit: 50,
    }),
    fetchTypefullyDrafts(apiKey, socialSetId, {
      status: "published",
      sort: "-published_at",
      limit: 50,
    }),
  ]);

  // Count published this month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const publishedThisMonth = published.filter(
    (d) => d.published_at && new Date(d.published_at) >= monthStart
  ).length;

  return {
    connected: true,
    drafts: [...drafts, ...scheduled],
    scheduledCount: scheduled.length,
    publishedThisMonth,
    postsRemaining: Math.max(0, MONTHLY_LIMIT - publishedThisMonth),
    monthlyLimit: MONTHLY_LIMIT,
  };
}
