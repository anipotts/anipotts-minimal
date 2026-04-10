import { eq } from "drizzle-orm";
import { getDrizzle } from "../db/drizzle";
import { businessData } from "../db/schema";
import { thoughts } from "../db/schema";
import type {
  Deal,
  Deadline,
  RevenueStream,
  Domain,
  VentureHealth,
  ContentPipelineStats,
} from "./types";

function parseBusinessData<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function getBusinessDataValue(key: string): Promise<string | null> {
  const db = getDrizzle();
  if (!db) return null;

  const rows = await db
    .select({ value: businessData.value })
    .from(businessData)
    .where(eq(businessData.key, key))
    .limit(1);

  return rows[0]?.value ?? null;
}

function isRecordArray(v: unknown): v is Record<string, unknown>[] {
  return (
    Array.isArray(v) &&
    v.every((item) => typeof item === "object" && item !== null)
  );
}

function safeDate(dateStr: string): number {
  const ms = new Date(dateStr).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

export async function getDealsFromD1(): Promise<Deal[]> {
  const raw = await getBusinessDataValue("brand-deals");
  const parsed = parseBusinessData<{ deals: unknown }>(raw);
  if (!parsed || !isRecordArray(parsed.deals)) return [];

  return parsed.deals.map((d) => ({
    company: String(d.company ?? ""),
    agency: String(d.agency ?? ""),
    contactName: String(d.contact_name ?? ""),
    status: String(d.status ?? ""),
    platform: String(d.platform ?? ""),
    paymentStatus: String(d.payment_status ?? ""),
    rateEnvVar: String(d.rate_env_var ?? ""),
    started: String(d.started ?? ""),
    completed: String(d.completed ?? ""),
    firstContact: String(d.first_contact ?? ""),
    notes: String(d.notes ?? ""),
    postingPeriod: String(d.posting_period ?? ""),
  }));
}

export async function getDeadlines(): Promise<Deadline[]> {
  const raw = await getBusinessDataValue("deadlines");
  const parsed = parseBusinessData<{ deadlines: unknown }>(raw);
  if (!parsed || !isRecordArray(parsed.deadlines)) return [];

  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  return parsed.deadlines
    .map((d) => {
      const date = String(d.date ?? "");
      const status = String(d.status ?? "");
      const isComplete = status === "complete";
      const daysUntil = Math.ceil(
        (safeDate(date) - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      return {
        date,
        description: String(d.description ?? ""),
        type: String(d.type ?? ""),
        status: status || undefined,
        notes: d.notes ? String(d.notes) : undefined,
        isOverdue: !isComplete && date < today,
        isUpcoming: !isComplete && daysUntil >= 0 && daysUntil <= 7,
        daysUntil,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getRevenueStreams(): Promise<RevenueStream[]> {
  const raw = await getBusinessDataValue("revenue-streams");
  const parsed = parseBusinessData<{ streams: unknown }>(raw);
  if (!parsed || !isRecordArray(parsed.streams)) return [];

  return parsed.streams.map((s) => ({
    name: String(s.name ?? ""),
    type: String(s.type ?? ""),
    frequency: String(s.frequency ?? ""),
    platform: String(s.platform ?? ""),
    status: String(s.status ?? ""),
    flowsThroughLlc: Boolean(s.flows_through_llc),
    notes: String(s.notes ?? ""),
  }));
}

export async function getDomainPortfolio(): Promise<Domain[]> {
  const raw = await getBusinessDataValue("domains");
  const parsed = parseBusinessData<{ domains: unknown }>(raw);
  if (!parsed || !isRecordArray(parsed.domains)) return [];

  return parsed.domains.map((d) => ({
    name: String(d.name ?? ""),
    registrar: String(d.registrar ?? ""),
    project: String(d.project ?? ""),
    verdict: String(d.verdict ?? ""),
    tier: d.tier ? String(d.tier) : undefined,
    notes: d.notes ? String(d.notes) : undefined,
  }));
}

const VENTURE_URLS: { name: string; url: string; platform: string }[] = [
  { name: "anipotts.com", url: "https://anipotts.com", platform: "cloudflare" },
  { name: "admin", url: "https://admin.anipotts.com", platform: "cloudflare" },
  { name: "chained.chat", url: "https://chained.chat", platform: "cloudflare" },
  { name: "quantercise", url: "https://quantercise.com", platform: "vercel" },
  {
    name: "nyupuritytest",
    url: "https://nyupuritytest.com",
    platform: "vercel",
  },
  { name: "fourtwenty.nyc", url: "https://fourtwenty.nyc", platform: "vercel" },
];

export async function getVentureHealth(): Promise<VentureHealth[]> {
  const results = await Promise.allSettled(
    VENTURE_URLS.map(async ({ name, url, platform }) => {
      const start = Date.now();
      try {
        const res = await fetch(url, {
          method: "GET",
          signal: AbortSignal.timeout(5000),
          redirect: "follow",
        });
        return {
          name,
          url,
          platform,
          status: (res.ok ? "up" : "down") as "up" | "down",
          responseTimeMs: Date.now() - start,
          checkedAt: new Date().toISOString(),
        };
      } catch {
        return {
          name,
          url,
          platform,
          status: "down" as const,
          responseTimeMs: Date.now() - start,
          checkedAt: new Date().toISOString(),
        };
      }
    }),
  );

  return results.map((r) =>
    r.status === "fulfilled"
      ? r.value
      : {
          name: "",
          url: "",
          platform: "",
          status: "unknown" as const,
          responseTimeMs: null,
          checkedAt: new Date().toISOString(),
        },
  );
}

export async function getContentPipelineStats(): Promise<ContentPipelineStats> {
  const db = getDrizzle();
  if (!db) return { drafts: 0, ready: 0, published: 0, total: 0 };

  const rows = await db.select({ status: thoughts.status }).from(thoughts);

  let drafts = 0;
  let ready = 0;
  let published = 0;

  for (const row of rows) {
    switch (row.status) {
      case "draft":
        drafts++;
        break;
      case "ready":
        ready++;
        break;
      case "published":
        published++;
        break;
    }
  }

  return { drafts, ready, published, total: rows.length };
}
