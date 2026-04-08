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
import fs from "node:fs/promises";
import path from "node:path";
import { createServerClient } from "@anipotts/lib";
import { adminLoginSchema, formatZodError } from "@anipotts/lib/validation";
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
  "agent-tip",
  "build-log",
  "stack-drop",
  "founders-log",
  "viral-reel",
];
const VALID_CONTENT_TYPES: ContentType[] = [
  "video",
  "article",
  "thread",
  "tip",
];

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://anipotts.com";

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

async function requireAuth(): Promise<{ error: string } | null> {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  const secret = process.env.ADMIN_PASSWORD;
  if (!token || !secret || !verifySessionToken(token, secret)) {
    return { error: "Unauthorized" };
  }
  return null;
}

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

  const pwResult = verifyAdminPassword(password, process.env.ADMIN_PASSWORD);
  if (!pwResult.success) {
    return { error: pwResult.error || "Invalid password" };
  }

  if (process.env.ADMIN_TOTP_SECRET) {
    if (!totp) {
      return { error: "TOTP code is required" };
    }
    const totpResult = verifyAdminTotp(totp, process.env.ADMIN_TOTP_SECRET);
    if (!totpResult.success) {
      return { error: totpResult.error || "Invalid TOTP" };
    }
  }

  const secret = process.env.ADMIN_PASSWORD ?? "";
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

export async function approveContent(id: string) {
  const authError = await requireAuth();
  if (authError) return authError;

  if (!UUID_RE.test(id)) return { error: "Invalid content ID" };

  const supabase = createServerClient();
  if (!supabase) return { error: "Supabase not configured" };

  const { error } = await supabase
    .from("thoughts")
    .update({ status: "ready", updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function updateContentStatus(id: string, status: ContentStatus) {
  const authError = await requireAuth();
  if (authError) return authError;

  if (!UUID_RE.test(id)) return { error: "Invalid content ID" };
  if (!VALID_STATUSES.includes(status)) return { error: "Invalid status" };

  const supabase = createServerClient();
  if (!supabase) return { error: "Supabase not configured" };

  const update: Record<string, string> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (status === "published") {
    update.published_at = new Date().toISOString();
  }

  const { error } = await supabase.from("thoughts").update(update).eq("id", id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function createThought(formData: FormData) {
  const authError = await requireAuth();
  if (authError) return authError;

  const supabase = createServerClient();
  if (!supabase) return { error: "Supabase not configured" };

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

  const { data, error } = await supabase
    .from("thoughts")
    .insert({
      title,
      slug,
      content: content || "",
      summary: "",
      series_type: seriesType,
      content_type: contentType,
      status: "draft",
      published: false,
      tags: [],
      views: 0,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { success: true, id: data.id };
}

export async function pushToButtondown(id: string) {
  const authError = await requireAuth();
  if (authError) return authError;

  if (!UUID_RE.test(id)) return { error: "Invalid content ID" };

  const supabase = createServerClient();
  if (!supabase) return { error: "Supabase not configured" };

  const { data: thought, error: fetchError } = await supabase
    .from("thoughts")
    .select("title, content")
    .eq("id", id)
    .single();

  if (fetchError || !thought) return { error: "Thought not found" };

  const result = await buttondownCreateEmail(
    thought.title,
    thought.content || "",
    "draft",
  );
  if (result.error) return { error: result.error };
  if (!result.data?.id) return { error: "Buttondown returned no email ID" };
  return { success: true, emailId: result.data.id };
}

export async function pushToTypefully(id: string) {
  const authError = await requireAuth();
  if (authError) return authError;

  if (!UUID_RE.test(id)) return { error: "Invalid content ID" };

  const supabase = createServerClient();
  if (!supabase) return { error: "Supabase not configured" };

  const { data: thought, error: fetchError } = await supabase
    .from("thoughts")
    .select("title, content, slug")
    .eq("id", id)
    .single();

  if (fetchError || !thought) return { error: "Thought not found" };

  const link = `${SITE_URL}/thoughts/${thought.slug}`;
  const content = thought.content || "";

  const xResult = await typefullyCreateDraft(buildXPost(content, link));
  if (xResult.error) return { error: `X: ${xResult.error}` };

  const liResult = await typefullyCreateDraft(
    buildLinkedInPost(thought.title, content, link),
  );
  if (liResult.error) return { error: `LinkedIn: ${liResult.error}` };

  return {
    success: true,
    drafts: {
      x: xResult.data?.id,
      linkedin: liResult.data?.id,
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

  const supabase = createServerClient();
  if (!supabase) return { error: "Supabase not configured" };

  const { data: thought, error: fetchError } = await supabase
    .from("thoughts")
    .select("title, content, slug, platforms_posted")
    .eq("id", id)
    .single();

  if (fetchError || !thought) return { error: "Thought not found" };

  const link = `${SITE_URL}/thoughts/${thought.slug}`;
  const content = thought.content || "";

  // Run distribution in parallel, but update DB status separately after
  const [xResult, liResult, bdResult] = await Promise.allSettled([
    typefullyCreateDraft(buildXPost(content, link)),
    typefullyCreateDraft(buildLinkedInPost(thought.title, content, link)),
    buttondownCreateEmail(thought.title, content, "draft"),
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

  // Only set status to published if at least one distribution succeeded
  const anyDistributionSucceeded =
    result.typefully.x.success ||
    result.typefully.linkedin.success ||
    result.buttondown.success;

  if (anyDistributionSucceeded) {
    const now = new Date().toISOString();
    const posted: Platform[] = [
      ...((thought.platforms_posted as Platform[]) || []),
    ];
    if (result.typefully.x.success && !posted.includes("twitter"))
      posted.push("twitter");
    if (result.typefully.linkedin.success && !posted.includes("linkedin"))
      posted.push("linkedin");

    const { error: statusError } = await supabase
      .from("thoughts")
      .update({
        status: "published" as ContentStatus,
        published_at: now,
        updated_at: now,
        platforms_posted: posted,
      })
      .eq("id", id);

    result.status = {
      success: !statusError,
      error: statusError?.message,
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

  const supabase = createServerClient();
  if (!supabase) return { error: "Supabase not configured" };

  try {
    const data = await upsertAtomRecord(supabase, {
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

  const supabase = createServerClient();
  if (!supabase) return { error: "Supabase not configured" };

  try {
    const data = await upsertAtomRecord(supabase, {
      id: atomId,
      ...fields,
      updated_at: new Date().toISOString(),
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

  const supabase = createServerClient();
  if (!supabase) return { error: "Supabase not configured" };

  try {
    await deleteAtomRecord(supabase, atomId);
    return { success: true };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function pushAtomToTypefully(atomId: string) {
  const authError = await requireAuth();
  if (authError) return authError;

  if (!UUID_RE.test(atomId)) return { error: "Invalid atom ID" };

  const supabase = createServerClient();
  if (!supabase) return { error: "Supabase not configured" };

  const { data: atom, error: fetchError } = await supabase
    .from("atoms")
    .select("*")
    .eq("id", atomId)
    .single();

  if (fetchError || !atom) return { error: "Atom not found" };

  const result = await typefullyCreateDraft(atom.atom_content);
  if (result.error) return { error: result.error };

  // Store the Typefully draft ID on the atom
  await supabase
    .from("atoms")
    .update({
      typefully_draft_id: result.data?.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", atomId);

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

  const supabase = createServerClient();
  if (!supabase) return { error: "Supabase not configured" };

  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (fields.title !== undefined) {
    if (!fields.title.trim()) return { error: "Title cannot be empty" };
    update.title = fields.title;
  }
  if (fields.summary !== undefined) update.summary = fields.summary;
  if (fields.content !== undefined) update.content = fields.content;
  if (fields.tags !== undefined) update.tags = fields.tags;

  const { error } = await supabase.from("thoughts").update(update).eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

function parseMarkdownValue(raw: string): string | string[] | boolean {
  const value = raw.trim();
  if (value === "true") return true;
  if (value === "false") return false;
  if (value.startsWith("[") && value.endsWith("]")) {
    return value
      .slice(1, -1)
      .split(",")
      .map((part) => part.trim().replace(/^['"]|['"]$/g, ""))
      .filter(Boolean);
  }
  return value.replace(/^['"]|['"]$/g, "");
}

function parseMarkdownFrontmatter(rawInput: string) {
  // Normalize CRLF and strip BOM
  const raw = rawInput.replace(/\r\n/g, "\n").replace(/^\uFEFF/, "");
  if (!raw.startsWith("---\n"))
    return {
      frontmatter: {} as Record<string, string | string[] | boolean>,
      content: raw.trim(),
    };
  const endIndex = raw.indexOf("\n---\n", 4);
  if (endIndex === -1)
    return {
      frontmatter: {} as Record<string, string | string[] | boolean>,
      content: raw.trim(),
    };
  const block = raw.slice(4, endIndex);
  const content = raw.slice(endIndex + 5).trim();
  const frontmatter: Record<string, string | string[] | boolean> = {};
  for (const line of block.split("\n")) {
    const sep = line.indexOf(":");
    if (sep === -1) continue;
    frontmatter[line.slice(0, sep).trim()] = parseMarkdownValue(
      line.slice(sep + 1),
    );
  }
  return { frontmatter, content };
}

export async function syncMarkdownThoughts() {
  const authError = await requireAuth();
  if (authError) return authError;

  const supabase = createServerClient();
  if (!supabase) return { error: "Supabase not configured" };

  const thoughtsDir = path.resolve(process.cwd(), "content", "thoughts");
  let files: string[];
  try {
    files = (await fs.readdir(thoughtsDir)).filter(
      (f) => f.endsWith(".md") || f.endsWith(".mdx"),
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: `Failed to read thoughts directory: ${msg}` };
  }

  let synced = 0;
  const syncErrors: string[] = [];

  for (const file of files) {
    const raw = await fs.readFile(path.join(thoughtsDir, file), "utf8");
    const { frontmatter, content } = parseMarkdownFrontmatter(raw);

    const slug = String(frontmatter.slug ?? file.replace(/\.mdx?$/, "")).trim();
    const title = String(frontmatter.title ?? slug.replace(/-/g, " ")).trim();
    const summary = String(frontmatter.summary ?? "").trim();
    const date = String(frontmatter.date ?? "").trim();
    const published = frontmatter.published === true;
    const tagsRaw = frontmatter.tags;
    const tags = Array.isArray(tagsRaw)
      ? tagsRaw.map((t) => String(t))
      : typeof tagsRaw === "string"
        ? tagsRaw
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

    const status = published ? ("published" as const) : ("draft" as const);
    const now = new Date().toISOString();
    const publishedAt =
      published && date ? new Date(date).toISOString() : undefined;

    const { data: existing } = await supabase
      .from("thoughts")
      .select("id")
      .eq("slug", slug)
      .single();

    let syncErr;
    if (existing) {
      ({ error: syncErr } = await supabase
        .from("thoughts")
        .update({
          slug,
          title,
          summary,
          content,
          tags,
          published,
          status,
          updated_at: now,
          ...(publishedAt ? { published_at: publishedAt } : {}),
        })
        .eq("id", existing.id));
    } else {
      ({ error: syncErr } = await supabase.from("thoughts").insert({
        slug,
        title,
        summary,
        content,
        tags,
        published,
        status,
        updated_at: now,
        created_at: date ? new Date(date).toISOString() : now,
        views: 0,
        ...(publishedAt ? { published_at: publishedAt } : {}),
      }));
    }

    if (syncErr) {
      syncErrors.push(`${slug}: ${syncErr.message}`);
    } else {
      synced++;
    }
  }

  if (syncErrors.length > 0) {
    return {
      success: true,
      message: `Synced ${synced} thoughts`,
      errors: syncErrors,
    };
  }
  return { success: true, message: `Synced ${synced} thoughts` };
}
