"use server";

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
import { loginAdmin, logoutAdmin } from "./lib/session";
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
  return loginAdmin(formData);
}

export async function logout() {
  return logoutAdmin();
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
