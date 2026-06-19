"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
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
import {
  cmsProjectPageKey,
  cmsWritingPageKey,
  normalizeCmsProject,
  normalizeCmsWriting,
  normalizeHomepageContent,
  normalizeNewsletterContent,
  validateCmsProject,
  validateCmsWriting,
  validateHomepageContent,
  validateNewsletterContent,
} from "@anipotts/lib/cms";
import type {
  CmsProjectContent,
  CmsWritingContent,
  HomepageContent,
  NewsletterContent,
} from "@anipotts/types";

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

function withAuth<Args extends unknown[], R>(
  fn: (...args: Args) => Promise<R>,
): (...args: Args) => Promise<R | { error: string }> {
  return async (...args: Args) => {
    const authError = await requireAuth();
    if (authError) return authError;
    return fn(...args);
  };
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
  "typefully_draft_id",
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

// ── Site Copy ──

async function savePageContent<T>(
  pageKey: string,
  content: T,
): Promise<
  | { success: true; updatedAt: string; version: number; content: T }
  | { error: string }
> {
  const db = getDB();
  if (!db) return { error: "Database not configured" };

  const ts = now();
  try {
    const existing = await db
      .prepare(
        `SELECT id, version
         FROM page_content
         WHERE page_key = ? AND published = 1
         ORDER BY version DESC
         LIMIT 1`,
      )
      .bind(pageKey)
      .first<{ id: string; version: number | null }>();

    const id = existing?.id ?? uuid();
    const version = (existing?.version ?? 0) + 1;
    const contentJson = JSON.stringify(content);

    if (existing) {
      await db
        .prepare(
          `UPDATE page_content
           SET content = ?, version = ?, published = 1, updated_at = ?, updated_by = ?
           WHERE id = ?`,
        )
        .bind(contentJson, version, ts, "admin", id)
        .run();
    } else {
      await db
        .prepare(
          `INSERT INTO page_content
           (id, page_key, content, version, published, updated_at, updated_by, created_at, version_history)
           VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?)`,
        )
        .bind(id, pageKey, contentJson, version, ts, "admin", ts, "[]")
        .run();
    }

    await db
      .prepare(
        "UPDATE page_content SET published = 0 WHERE page_key = ? AND id <> ?",
      )
      .bind(pageKey, id)
      .run();

    return { success: true, updatedAt: ts, version, content };
  } catch (error) {
    return { error: `D1 save failed: ${String(error)}` };
  }
}

export const saveHomepageContent = withAuth(async (draft: HomepageContent) => {
  const content = normalizeHomepageContent(draft);
  const validation = validateHomepageContent(content);
  if (!validation.ok) return { error: validation.error ?? "Invalid homepage" };

  const result = await savePageContent("home", content);
  if ("error" in result) return result;
  revalidatePath("/");
  return result;
});

export const saveNewsletterContent = withAuth(
  async (draft: NewsletterContent) => {
    const content = normalizeNewsletterContent(draft);
    const validation = validateNewsletterContent(content);
    if (!validation.ok)
      return { error: validation.error ?? "Invalid newsletter" };

    const result = await savePageContent("newsletter", content);
    if ("error" in result) return result;
    revalidatePath("/");
    return result;
  },
);

export const saveProjectContent = withAuth(async (draft: CmsProjectContent) => {
  const project = normalizeCmsProject(draft);
  const validation = validateCmsProject(project);
  if (!validation.ok) return { error: validation.error ?? "Invalid project" };

  const result = await savePageContent(
    cmsProjectPageKey(project.slug),
    project,
  );
  if ("error" in result) return result;
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/making");
  return {
    success: true,
    project: { ...result.content, updated_at: result.updatedAt },
  };
});

export const saveWritingContent = withAuth(async (draft: CmsWritingContent) => {
  const writing = normalizeCmsWriting(draft);
  const validation = validateCmsWriting(writing);
  if (!validation.ok) return { error: validation.error ?? "Invalid writing" };

  const result = await savePageContent(
    cmsWritingPageKey(writing.slug),
    writing,
  );
  if ("error" in result) return result;
  revalidatePath("/");
  revalidatePath("/writing");
  return {
    success: true,
    writing: { ...result.content, updated_at: result.updatedAt },
  };
});

// ── Content Status ──

export const approveContent = withAuth(async (id: string) => {
  if (!UUID_RE.test(id)) return { error: "Invalid content ID" };

  const result = await updateThought(id, {
    status: "ready",
    updated_at: now(),
  });
  if (result.error) return { error: result.error };
  return { success: true };
});

export const updateContentStatus = withAuth(
  async (id: string, status: ContentStatus) => {
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
  },
);

// ── Content CRUD ──

export const createThought = withAuth(async (formData: FormData) => {
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
});

export const updateThoughtContent = withAuth(
  async (
    id: string,
    fields: {
      title?: string;
      summary?: string;
      content?: string;
      tags?: string[];
    },
  ) => {
    if (!UUID_RE.test(id)) return { error: "Invalid content ID" };

    const update: Record<string, unknown> = { updated_at: now() };
    if (fields.title !== undefined) {
      if (!fields.title.trim()) return { error: "Title cannot be empty" };
      update.title = fields.title;
    }
    if (fields.summary !== undefined) {
      if (typeof fields.summary !== "string")
        return { error: "Invalid summary" };
      update.summary = fields.summary;
    }
    if (fields.content !== undefined) {
      if (typeof fields.content !== "string")
        return { error: "Invalid content" };
      update.content = fields.content;
    }

    const db = getDB();
    if (fields.tags !== undefined) {
      update.tags = db ? toJsonArray(fields.tags) : fields.tags;
    }

    const result = await updateThought(id, update);
    if (result.error) return { error: result.error };
    return { success: true };
  },
);

// ── Distribution: Buttondown ──

export const pushToButtondown = withAuth(async (id: string) => {
  if (!UUID_RE.test(id)) return { error: "Invalid content ID" };

  const thought = await getThoughtById(id, "title, content");
  if (!thought) return { error: "Thought not found" };

  const result = await buttondownCreateEmail(
    String(thought.title),
    String(thought.content || ""),
    "draft",
  );
  if (!result.success) return { error: result.error };
  if (typeof result.data.id !== "string" || !result.data.id)
    return { error: "Buttondown returned no email ID" };

  await updateThought(id, {
    buttondown_email_id: result.data.id,
    updated_at: now(),
  });
  return { success: true, emailId: result.data.id };
});

// ── Distribution: Typefully ──

export const pushToTypefully = withAuth(async (id: string) => {
  if (!UUID_RE.test(id)) return { error: "Invalid content ID" };

  const thought = await getThoughtById(id, "title, content, slug");
  if (!thought) return { error: "Thought not found" };

  const link = `${SITE_URL}/thoughts/${thought.slug}`;
  const content = String(thought.content || "");

  const xResult = await typefullyCreateDraft(buildXPost(content, link));
  if (!xResult.success) return { error: `X: ${xResult.error}` };

  const liResult = await typefullyCreateDraft(
    buildLinkedInPost(String(thought.title), content, link),
  );
  if (!liResult.success) return { error: `LinkedIn: ${liResult.error}` };

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
});

// ── Publish Everywhere ──

export interface PublishResult {
  status: { success: boolean; error?: string };
  typefully: {
    x: { success: boolean; error?: string; draftId?: string };
    linkedin: { success: boolean; error?: string; draftId?: string };
  };
  buttondown: { success: boolean; error?: string; emailId?: string };
}

export const publishEverywhere = withAuth(
  async (id: string): Promise<PublishResult | { error: string }> => {
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
          success: xResult.status === "fulfilled" && xResult.value.success,
          error:
            xResult.status === "rejected"
              ? String(xResult.reason)
              : !xResult.value.success
                ? xResult.value.error
                : undefined,
          draftId:
            xResult.status === "fulfilled" && xResult.value.success
              ? xResult.value.data.id
              : undefined,
        },
        linkedin: {
          success: liResult.status === "fulfilled" && liResult.value.success,
          error:
            liResult.status === "rejected"
              ? String(liResult.reason)
              : !liResult.value.success
                ? liResult.value.error
                : undefined,
          draftId:
            liResult.status === "fulfilled" && liResult.value.success
              ? liResult.value.data.id
              : undefined,
        },
      },
      buttondown: {
        success: bdResult.status === "fulfilled" && bdResult.value.success,
        error:
          bdResult.status === "rejected"
            ? String(bdResult.reason)
            : !bdResult.value.success
              ? bdResult.value.error
              : undefined,
        emailId:
          bdResult.status === "fulfilled" && bdResult.value.success
            ? bdResult.value.data.id
            : undefined,
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
  },
);

// ── Atom CRUD ──

export const createAtom = withAuth(
  async (
    contentId: string,
    platform: Platform,
    atomContent: string,
    voiceMode?: VoiceMode,
    hashtags?: string[],
  ) => {
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
  },
);

export const updateAtom = withAuth(
  async (
    atomId: string,
    fields: {
      atom_content?: string;
      voice_mode?: VoiceMode;
      hashtags?: string[];
      status?: "draft" | "scheduled" | "posted";
    },
  ) => {
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
  },
);

export const deleteAtom = withAuth(async (atomId: string) => {
  if (!UUID_RE.test(atomId)) return { error: "Invalid atom ID" };

  if (!getDB()) return { error: "Database not configured" };

  try {
    await deleteAtomRecord(atomId);
    return { success: true };
  } catch (e) {
    return { error: String(e) };
  }
});

export const pushAtomToTypefully = withAuth(async (atomId: string) => {
  if (!UUID_RE.test(atomId)) return { error: "Invalid atom ID" };

  const atom = await getAtomById(atomId);
  if (!atom) return { error: "Atom not found" };

  const result = await typefullyCreateDraft(String(atom.atom_content));
  if (!result.success) return { error: result.error };

  await updateAtomFields(atomId, {
    typefully_draft_id: result.data.id,
    updated_at: now(),
  });

  return { success: true, draftId: result.data.id };
});

// ── Typefully Management ──

export const fetchTypefullyDraftStatus = withAuth(async (draftId: string) => {
  if (!SAFE_EXTERNAL_ID_RE.test(draftId)) return { error: "Invalid draft ID" };

  const result = await typefullyGetDraft(draftId);
  if (!result.success) return { error: result.error };
  return { success: true, draft: result.data };
});

export const editTypefullyDraft = withAuth(
  async (draftId: string, content: string) => {
    if (!SAFE_EXTERNAL_ID_RE.test(draftId))
      return { error: "Invalid draft ID" };

    const result = await typefullyUpdateDraft(draftId, content);
    if (!result.success) return { error: result.error };
    return { success: true, draft: result.data };
  },
);

export const removeTypefullyDraft = withAuth(async (draftId: string) => {
  if (!SAFE_EXTERNAL_ID_RE.test(draftId)) return { error: "Invalid draft ID" };

  const result = await typefullyDeleteDraft(draftId);
  if (!result.success) return { error: result.error };
  return { success: true };
});

// ── Buttondown Management ──

export const fetchButtondownEmailStatus = withAuth(async (emailId: string) => {
  if (!SAFE_EXTERNAL_ID_RE.test(emailId)) return { error: "Invalid email ID" };

  const result = await buttondownGetEmail(emailId);
  if (!result.success) return { error: result.error };
  return { success: true, email: result.data };
});

export const editButtondownEmail = withAuth(
  async (
    emailId: string,
    fields: {
      subject?: string;
      body?: string;
      status?: "draft" | "scheduled" | "about_to_send" | "in_flight" | "sent";
      publish_date?: string;
    },
  ) => {
    if (!SAFE_EXTERNAL_ID_RE.test(emailId))
      return { error: "Invalid email ID" };

    const result = await buttondownUpdateEmail(emailId, fields);
    if (!result.success) return { error: result.error };
    return { success: true, email: result.data };
  },
);

export const removeButtondownEmail = withAuth(async (emailId: string) => {
  if (!SAFE_EXTERNAL_ID_RE.test(emailId)) return { error: "Invalid email ID" };

  const result = await buttondownDeleteEmail(emailId);
  if (!result.success) return { error: result.error };
  return { success: true };
});

// ── Subscribers ──

export const fetchSubscribers = withAuth(async () => {
  const result = await buttondownListSubscribers("regular");
  if (!result.success) return { error: result.error };
  return { success: true, subscribers: result.data, count: result.count };
});
