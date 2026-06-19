"use server";

import { cookies } from "next/headers";
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
import type { ContentStatus, Platform, VoiceMode } from "@anipotts/types";
import { withAuth } from "./lib/with-auth";
import {
  createThoughtDraft,
  updateThoughtContentFields,
  updateThoughtStatus,
} from "./lib/content-records";
import {
  createAtomDraft,
  deleteAtomDraft,
  updateAtomDraft,
} from "./lib/atom-records";
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
  saveHomepageDraft,
  saveNewsletterDraft,
  saveProjectDraft,
  saveWritingDraft,
} from "./lib/site-content";
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
  return saveHomepageDraft(draft);
});

export const saveNewsletterContent = withAuth(
  async (draft: NewsletterContent) => {
    return saveNewsletterDraft(draft);
  },
);

export const saveProjectContent = withAuth(async (draft: CmsProjectContent) => {
  return saveProjectDraft(draft);
});

export const saveWritingContent = withAuth(async (draft: CmsWritingContent) => {
  return saveWritingDraft(draft);
});

export const updateContentStatus = withAuth(
  async (id: string, status: ContentStatus) => {
    if (!UUID_RE.test(id)) return { error: "Invalid content ID" };
    return updateThoughtStatus(id, status);
  },
);

// ── Content CRUD ──

export const createThought = withAuth(async (formData: FormData) => {
  return createThoughtDraft({
    title: formData.get("title") as string | null,
    content: formData.get("content") as string | null,
    seriesType: formData.get("series_type") as string | null,
    contentType: formData.get("content_type") as string | null,
  });
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
    return updateThoughtContentFields(id, fields);
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
