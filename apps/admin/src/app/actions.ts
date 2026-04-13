"use server";

import { cookies } from "next/headers";
import {
  verifyAdminPassword,
  verifyAdminTotp,
  createSessionToken,
  verifySessionToken,
  ADMIN_COOKIE,
  ADMIN_COOKIE_OPTIONS,
} from "@anipotts/lib/admin";
import { adminLoginSchema, formatZodError } from "@anipotts/lib/validation";
import { getEnv } from "@anipotts/lib/env";
import { checkAdminLoginRateLimit } from "@/lib/rateLimit";
import { headers } from "next/headers";
import type {
  SeriesType,
  ContentStatus,
  ContentType,
  Platform,
  VoiceMode,
} from "@anipotts/types";
import { upsertAtomRecord, deleteAtomRecord } from "@anipotts/lib/admin";
import {
  getDB,
  uuid,
  now,
  toJsonArray,
  parseJsonArray,
} from "@anipotts/lib/db";
import {
  createDraft as typefullyCreateDraft,
  getDraft as typefullyGetDraft,
  updateDraft as typefullyUpdateDraft,
  deleteDraft as typefullyDeleteDraft,
} from "./lib/typefully";
import {
  createEmail as buttondownCreateEmail,
  getEmail as buttondownGetEmail,
  updateEmail as buttondownUpdateEmail,
  deleteEmail as buttondownDeleteEmail,
  listSubscribers as buttondownListSubscribers,
} from "./lib/buttondown";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SAFE_EXTERNAL_ID_RE = /^[a-zA-Z0-9_-]{1,128}$/;
const VALID_STATUSES: ContentStatus[] = [
  "idea",
  "draft",
  "ready",
  "atomized",
  "published",
];
const VALID_SERIES: SeriesType[] = [
  "tip",
  "news",
  "tutorial",
  "essay",
  "behind-the-scenes",
];
const VALID_CONTENT_TYPES: ContentType[] = [
  "video",
  "article",
  "thread",
  "tip",
];

const SITE_URL = getEnv("SITE_URL") || "https://anipotts.com";

const X_CONTENT_LIMIT = 250;
const LINKEDIN_CONTENT_LIMIT = 2500;

function buildXPost(content: string, link: string): string {
  return content.length > X_CONTENT_LIMIT
    ? `${content.slice(0, X_CONTENT_LIMIT - 3)}...\n\n${link}`
    : `${content}\n\n${link}`;
}

function buildLinkedInPost(
  title: string,
  content: string,
  link: string,
): string {
  const body =
    content.length > LINKEDIN_CONTENT_LIMIT
      ? content.slice(0, LINKEDIN_CONTENT_LIMIT - 3) + "..."
      : content;
  return `${title}\n\n${body}\n\n${link}`;
}

export async function requireAuth(): Promise<{ error: string } | null> {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  const secret = getEnv("ADMIN_PASSWORD");
  if (!token || !secret || !verifySessionToken(token, secret)) {
    return { error: "Unauthorized" };
  }
  return null;
}

// ── D1 helper: read a single thought by ID ──

async function getThoughtById(id: string, columns = "*") {
  const db = getDB();
  if (db) {
    return db
      .prepare(`SELECT ${columns} FROM thoughts WHERE id = ?`)
      .bind(id)
      .first<Record<string, unknown>>();
  }
  return null;
}

// ── D1 helper: update thought fields by ID ──

const THOUGHT_COLUMNS = new Set([
  "title",
  "slug",
  "content",
  "summary",
  "series_type",
  "content_type",
  "status",
  "published",
  "published_at",
  "tags",
  "platforms_posted",
  "voice_mode",
  "updated_at",
  "views",
  "buttondown_email_id",
  "typefully_x_draft_id",
  "typefully_linkedin_draft_id",
]);

async function updateThought(
  id: string,
  fields: Record<string, unknown>,
): Promise<{ error?: string }> {
  const db = getDB();
  if (db) {
    const safe = Object.keys(fields).filter((k) => THOUGHT_COLUMNS.has(k));
    if (safe.length === 0) return { error: "No valid columns" };
    const sets = safe.map((k) => `${k} = ?`).join(", ");
    const vals = safe.map((k) => fields[k]);
    await db
      .prepare(`UPDATE thoughts SET ${sets} WHERE id = ?`)
      .bind(...vals, id)
      .run();
    return {};
  }
  return { error: "Database not configured" };
}

// ── D1 helper: read a single atom by ID ──

async function getAtomById(id: string) {
  const db = getDB();
  if (db) {
    return db
      .prepare("SELECT * FROM atoms WHERE id = ?")
      .bind(id)
      .first<Record<string, unknown>>();
  }
  return null;
}

// ── D1 helper: update atom fields by ID ──

const ATOM_COLUMNS = new Set([
  "thought_id",
  "platform",
  "content",
  "media_urls",
  "status",
  "scheduled_for",
  "posted_at",
  "engagement_metrics",
  "updated_at",
]);

async function updateAtomFields(
  id: string,
  fields: Record<string, unknown>,
): Promise<{ error?: string }> {
  const db = getDB();
  if (db) {
    const safe = Object.keys(fields).filter((k) => ATOM_COLUMNS.has(k));
    if (safe.length === 0) return { error: "No valid columns" };
    const sets = safe.map((k) => `${k} = ?`).join(", ");
    const vals = safe.map((k) => fields[k]);
    await db
      .prepare(`UPDATE atoms SET ${sets} WHERE id = ?`)
      .bind(...vals, id)
      .run();
    return {};
  }
  return { error: "Database not configured" };
}

// ── Auth ──

export async function login(formData: FormData) {
  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip") ||
    "unknown";
  const rateLimit = await checkAdminLoginRateLimit(ip);
  if (!rateLimit.success) {
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

  const pwResult = verifyAdminPassword(password, getEnv("ADMIN_PASSWORD"));
  if (!pwResult.success) {
    return { error: pwResult.error || "Invalid password" };
  }

  const totpSecret = getEnv("ADMIN_TOTP_SECRET");
  if (totpSecret) {
    if (!totp) {
      return { error: "TOTP code is required" };
    }
    const totpResult = verifyAdminTotp(totp, totpSecret);
    if (!totpResult.success) {
      return { error: totpResult.error || "Invalid TOTP" };
    }
  }

  const secret = getEnv("ADMIN_PASSWORD") ?? "";
  const token = createSessionToken(secret);
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, token, {
    ...ADMIN_COOKIE_OPTIONS,
    sameSite: ADMIN_COOKIE_OPTIONS.sameSite as "strict" | "lax" | "none",
  });

  return { success: true };
}

export async function logout() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
  return { success: true };
}

// ── Content Status ──

export async function approveContent(id: string) {
  const authError = await requireAuth();
  if (authError) return authError;
  if (!UUID_RE.test(id)) return { error: "Invalid content ID" };

  const result = await updateThought(id, {
    status: "ready",
    updated_at: now(),
  });
  if (result.error) return { error: result.error };
  return { success: true };
}

export async function updateContentStatus(id: string, status: ContentStatus) {
  const authError = await requireAuth();
  if (authError) return authError;
  if (!UUID_RE.test(id)) return { error: "Invalid content ID" };
  if (!VALID_STATUSES.includes(status)) return { error: "Invalid status" };

  const update: Record<string, string> = {
    status,
    updated_at: now(),
  };
  if (status === "published") {
    update.published_at = now();
  }

  const result = await updateThought(id, update);
  if (result.error) return { error: result.error };
  return { success: true };
}

// ── Content CRUD ──

export async function createThought(formData: FormData) {
  const authError = await requireAuth();
  if (authError) return authError;

  const title = (formData.get("title") as string)?.trim();
  const content = (formData.get("content") as string)?.trim();
  const seriesType = formData.get("series_type") as SeriesType;
  const contentType =
    (formData.get("content_type") as ContentType) || "article";

  if (!title) return { error: "Title is required" };
  if (seriesType && !VALID_SERIES.includes(seriesType))
    return { error: "Invalid series type" };
  if (!VALID_CONTENT_TYPES.includes(contentType))
    return { error: "Invalid content type" };

  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const slug = `${base}-${Date.now().toString(36)}`;
  const id = uuid();
  const ts = now();

  const db = getDB();
  if (db) {
    await db
      .prepare(
        `INSERT INTO thoughts (id, title, slug, content, summary, series_type, content_type, status, published, tags, views, created_at, updated_at)
         VALUES (?, ?, ?, ?, '', ?, ?, 'draft', 0, '[]', 0, ?, ?)`,
      )
      .bind(
        id,
        title,
        slug,
        content || "",
        seriesType || null,
        contentType,
        ts,
        ts,
      )
      .run();
    return { success: true, id };
  }

  return { error: "Database not configured" };
}

export async function updateThoughtContent(
  id: string,
  fields: {
    title?: string;
    summary?: string;
    content?: string;
    tags?: string[];
  },
) {
  const authError = await requireAuth();
  if (authError) return authError;
  if (!UUID_RE.test(id)) return { error: "Invalid content ID" };

  const update: Record<string, unknown> = { updated_at: now() };
  if (fields.title !== undefined) {
    if (!fields.title.trim()) return { error: "Title cannot be empty" };
    update.title = fields.title;
  }
  if (fields.summary !== undefined) {
    if (typeof fields.summary !== "string") return { error: "Invalid summary" };
    update.summary = fields.summary;
  }
  if (fields.content !== undefined) {
    if (typeof fields.content !== "string") return { error: "Invalid content" };
    update.content = fields.content;
  }

  const db = getDB();
  if (fields.tags !== undefined) {
    update.tags = db ? toJsonArray(fields.tags) : fields.tags;
  }

  const result = await updateThought(id, update);
  if (result.error) return { error: result.error };
  return { success: true };
}

// ── Distribution: Buttondown ──

export async function pushToButtondown(id: string) {
  const authError = await requireAuth();
  if (authError) return authError;
  if (!UUID_RE.test(id)) return { error: "Invalid content ID" };

  const thought = await getThoughtById(id, "title, content");
  if (!thought) return { error: "Thought not found" };

  const result = await buttondownCreateEmail(
    String(thought.title),
    String(thought.content || ""),
    "draft",
  );
  if (result.error) return { error: result.error };
  if (typeof result.data?.id !== "string" || !result.data.id)
    return { error: "Buttondown returned no email ID" };

  await updateThought(id, {
    buttondown_email_id: result.data.id,
    updated_at: now(),
  });
  return { success: true, emailId: result.data.id };
}

// ── Distribution: Typefully ──

export async function pushToTypefully(id: string) {
  const authError = await requireAuth();
  if (authError) return authError;
  if (!UUID_RE.test(id)) return { error: "Invalid content ID" };

  const thought = await getThoughtById(id, "title, content, slug");
  if (!thought) return { error: "Thought not found" };

  const link = `${SITE_URL}/thoughts/${thought.slug}`;
  const content = String(thought.content || "");

  const xResult = await typefullyCreateDraft(buildXPost(content, link));
  if (xResult.error) return { error: `X: ${xResult.error}` };

  const liResult = await typefullyCreateDraft(
    buildLinkedInPost(String(thought.title), content, link),
  );
  if (liResult.error) return { error: `LinkedIn: ${liResult.error}` };

  const xId = xResult.data?.id;
  const liId = liResult.data?.id;
  if (xId || liId) {
    await updateThought(id, {
      ...(xId ? { typefully_x_draft_id: xId } : {}),
      ...(liId ? { typefully_linkedin_draft_id: liId } : {}),
      updated_at: now(),
    });
  }

  return {
    success: true,
    drafts: {
      x: xId,
      linkedin: liId,
    },
  };
}

// ── Publish Everywhere ──

export interface PublishResult {
  status: { success: boolean; error?: string };
  typefully: {
    x: { success: boolean; error?: string; draftId?: string };
    linkedin: { success: boolean; error?: string; draftId?: string };
  };
  buttondown: { success: boolean; error?: string; emailId?: string };
}

export async function publishEverywhere(
  id: string,
): Promise<PublishResult | { error: string }> {
  const authError = await requireAuth();
  if (authError) return authError;
  if (!UUID_RE.test(id)) return { error: "Invalid content ID" };

  const thought = await getThoughtById(id);
  if (!thought) return { error: "Thought not found" };

  const link = `${SITE_URL}/thoughts/${thought.slug}`;
  const content = String(thought.content || "");

  const [xResult, liResult, bdResult] = await Promise.allSettled([
    typefullyCreateDraft(buildXPost(content, link)),
    typefullyCreateDraft(
      buildLinkedInPost(String(thought.title), content, link),
    ),
    buttondownCreateEmail(String(thought.title), content, "draft"),
  ]);

  const result: PublishResult = {
    status: { success: false },
    typefully: {
      x: {
        success: xResult.status === "fulfilled" && !xResult.value.error,
        error:
          xResult.status === "rejected"
            ? String(xResult.reason)
            : xResult.value.error,
        draftId:
          xResult.status === "fulfilled" ? xResult.value.data?.id : undefined,
      },
      linkedin: {
        success: liResult.status === "fulfilled" && !liResult.value.error,
        error:
          liResult.status === "rejected"
            ? String(liResult.reason)
            : liResult.value.error,
        draftId:
          liResult.status === "fulfilled" ? liResult.value.data?.id : undefined,
      },
    },
    buttondown: {
      success: bdResult.status === "fulfilled" && !bdResult.value.error,
      error:
        bdResult.status === "rejected"
          ? String(bdResult.reason)
          : bdResult.value.error,
      emailId:
        bdResult.status === "fulfilled" ? bdResult.value.data?.id : undefined,
    },
  };

  const anyDistributionSucceeded =
    result.typefully.x.success ||
    result.typefully.linkedin.success ||
    result.buttondown.success;

  if (anyDistributionSucceeded) {
    const ts = now();
    const existingPosted = parseJsonArray<Platform>(thought.platforms_posted);
    const posted: Platform[] = [...existingPosted];
    if (result.typefully.x.success && !posted.includes("twitter"))
      posted.push("twitter");
    if (result.typefully.linkedin.success && !posted.includes("linkedin"))
      posted.push("linkedin");

    const db = getDB();
    const updateResult = await updateThought(id, {
      status: "published" as ContentStatus,
      published_at: ts,
      updated_at: ts,
      platforms_posted: db ? toJsonArray(posted) : (posted as unknown),
      ...(result.buttondown.emailId
        ? { buttondown_email_id: result.buttondown.emailId }
        : {}),
      ...(result.typefully.x.draftId
        ? { typefully_x_draft_id: result.typefully.x.draftId }
        : {}),
      ...(result.typefully.linkedin.draftId
        ? { typefully_linkedin_draft_id: result.typefully.linkedin.draftId }
        : {}),
    });

    result.status = {
      success: !updateResult.error,
      error: updateResult.error,
    };
  } else {
    result.status = {
      success: false,
      error: "All distribution channels failed. Status not changed.",
    };
  }

  return result;
}

// ── Atom CRUD ──

export async function createAtom(
  contentId: string,
  platform: Platform,
  atomContent: string,
  voiceMode?: VoiceMode,
  hashtags?: string[],
) {
  const authError = await requireAuth();
  if (authError) return authError;
  if (!UUID_RE.test(contentId)) return { error: "Invalid content ID" };

  if (!getDB()) return { error: "Database not configured" };

  try {
    const data = await upsertAtomRecord({
      content_id: contentId,
      platform,
      atom_content: atomContent,
      voice_mode: voiceMode,
      hashtags: hashtags || [],
      status: "draft",
    });
    return { success: true, atom: data };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function updateAtom(
  atomId: string,
  fields: {
    atom_content?: string;
    voice_mode?: VoiceMode;
    hashtags?: string[];
    status?: "draft" | "scheduled" | "posted";
  },
) {
  const authError = await requireAuth();
  if (authError) return authError;
  if (!UUID_RE.test(atomId)) return { error: "Invalid atom ID" };

  if (!getDB()) return { error: "Database not configured" };

  try {
    const data = await upsertAtomRecord({
      id: atomId,
      ...fields,
      updated_at: now(),
    });
    return { success: true, atom: data };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function deleteAtom(atomId: string) {
  const authError = await requireAuth();
  if (authError) return authError;
  if (!UUID_RE.test(atomId)) return { error: "Invalid atom ID" };

  if (!getDB()) return { error: "Database not configured" };

  try {
    await deleteAtomRecord(atomId);
    return { success: true };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function pushAtomToTypefully(atomId: string) {
  const authError = await requireAuth();
  if (authError) return authError;
  if (!UUID_RE.test(atomId)) return { error: "Invalid atom ID" };

  const atom = await getAtomById(atomId);
  if (!atom) return { error: "Atom not found" };

  const result = await typefullyCreateDraft(String(atom.atom_content));
  if (result.error) return { error: result.error };

  await updateAtomFields(atomId, {
    typefully_draft_id: result.data?.id,
    updated_at: now(),
  });

  return { success: true, draftId: result.data?.id };
}

// ── Typefully Management ──

export async function fetchTypefullyDraftStatus(draftId: string) {
  const authError = await requireAuth();
  if (authError) return authError;
  if (!SAFE_EXTERNAL_ID_RE.test(draftId)) return { error: "Invalid draft ID" };

  const result = await typefullyGetDraft(draftId);
  if (result.error) return { error: result.error };
  return { success: true, draft: result.data };
}

export async function editTypefullyDraft(draftId: string, content: string) {
  const authError = await requireAuth();
  if (authError) return authError;
  if (!SAFE_EXTERNAL_ID_RE.test(draftId)) return { error: "Invalid draft ID" };

  const result = await typefullyUpdateDraft(draftId, content);
  if (result.error) return { error: result.error };
  return { success: true, draft: result.data };
}

export async function removeTypefullyDraft(draftId: string) {
  const authError = await requireAuth();
  if (authError) return authError;
  if (!SAFE_EXTERNAL_ID_RE.test(draftId)) return { error: "Invalid draft ID" };

  const result = await typefullyDeleteDraft(draftId);
  if (!result.success) return { error: result.error };
  return { success: true };
}

// ── Buttondown Management ──

export async function fetchButtondownEmailStatus(emailId: string) {
  const authError = await requireAuth();
  if (authError) return authError;
  if (!SAFE_EXTERNAL_ID_RE.test(emailId)) return { error: "Invalid email ID" };

  const result = await buttondownGetEmail(emailId);
  if (result.error) return { error: result.error };
  return { success: true, email: result.data };
}

export async function editButtondownEmail(
  emailId: string,
  fields: {
    subject?: string;
    body?: string;
    status?: "draft" | "scheduled" | "about_to_send" | "in_flight" | "sent";
    publish_date?: string;
  },
) {
  const authError = await requireAuth();
  if (authError) return authError;
  if (!SAFE_EXTERNAL_ID_RE.test(emailId)) return { error: "Invalid email ID" };

  const result = await buttondownUpdateEmail(emailId, fields);
  if (result.error) return { error: result.error };
  return { success: true, email: result.data };
}

export async function removeButtondownEmail(emailId: string) {
  const authError = await requireAuth();
  if (authError) return authError;
  if (!SAFE_EXTERNAL_ID_RE.test(emailId)) return { error: "Invalid email ID" };

  const result = await buttondownDeleteEmail(emailId);
  if (!result.success) return { error: result.error };
  return { success: true };
}

// ── Subscribers ──

export async function fetchSubscribers() {
  const authError = await requireAuth();
  if (authError) return authError;

  const result = await buttondownListSubscribers("regular");
  if (result.error) return { error: result.error };
  return { success: true, subscribers: result.data, count: result.count };
}
