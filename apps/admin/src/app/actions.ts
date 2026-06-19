"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  verifyAdminPassword,
  verifyAdminTotp,
  createSessionToken,
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
import { withAuth } from "./lib/with-auth";
import { updateThought } from "./lib/content-records";
import { savePageContent } from "./lib/page-content";
import {
  createAtomDraft,
  deleteAtomDraft,
  updateAtomDraft,
} from "./lib/atom-records";
import { getDB, uuid, now, toJsonArray } from "@anipotts/lib/db";
import {
  editButtondownEmail as editButtondownEmailRecord,
  fetchButtondownEmail,
  fetchRegularSubscribers,
  fetchTypefullyDraft,
  publishThoughtEverywhere,
  pushAtomDraftToTypefully,
  pushThoughtToButtondown,
  removeButtondownEmail as removeButtondownEmailRecord,
  type ButtondownEmailUpdate,
  type PublishResult,
} from "./lib/distribution";
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
export type { PublishResult } from "./lib/distribution";

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
  return pushThoughtToButtondown(id);
});

// ── Publish Everywhere ──

export const publishEverywhere = withAuth(
  async (id: string): Promise<PublishResult | { error: string }> => {
    if (!UUID_RE.test(id)) return { error: "Invalid content ID" };
    return publishThoughtEverywhere(id);
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
    return createAtomDraft(
      contentId,
      platform,
      atomContent,
      voiceMode,
      hashtags,
    );
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
    return updateAtomDraft(atomId, fields);
  },
);

export const deleteAtom = withAuth(async (atomId: string) => {
  if (!UUID_RE.test(atomId)) return { error: "Invalid atom ID" };
  return deleteAtomDraft(atomId);
});

export const pushAtomToTypefully = withAuth(async (atomId: string) => {
  if (!UUID_RE.test(atomId)) return { error: "Invalid atom ID" };
  return pushAtomDraftToTypefully(atomId);
});

// ── Typefully Management ──

export const fetchTypefullyDraftStatus = withAuth(async (draftId: string) => {
  if (!SAFE_EXTERNAL_ID_RE.test(draftId)) return { error: "Invalid draft ID" };
  return fetchTypefullyDraft(draftId);
});

// ── Buttondown Management ──

export const fetchButtondownEmailStatus = withAuth(async (emailId: string) => {
  if (!SAFE_EXTERNAL_ID_RE.test(emailId)) return { error: "Invalid email ID" };
  return fetchButtondownEmail(emailId);
});

export const editButtondownEmail = withAuth(
  async (
    emailId: string,
    fields: {
      subject?: string;
      body?: string;
      status?: ButtondownEmailUpdate["status"];
      publish_date?: string;
    },
  ) => {
    if (!SAFE_EXTERNAL_ID_RE.test(emailId))
      return { error: "Invalid email ID" };
    return editButtondownEmailRecord(emailId, fields);
  },
);

export const removeButtondownEmail = withAuth(async (emailId: string) => {
  if (!SAFE_EXTERNAL_ID_RE.test(emailId)) return { error: "Invalid email ID" };
  return removeButtondownEmailRecord(emailId);
});

// ── Subscribers ──

export const fetchSubscribers = withAuth(async () => {
  return fetchRegularSubscribers();
});
