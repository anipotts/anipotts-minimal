import type { ContentStatus, Platform } from "@anipotts/types";
import { getEnv } from "@anipotts/lib/env";
import { getDB, now, parseJsonArray, toJsonArray } from "@anipotts/lib/db";
import {
  getAtomById,
  getThoughtById,
  updateAtomFields,
  updateThought,
} from "./content-records";
import {
  createEmail as buttondownCreateEmail,
  deleteEmail as buttondownDeleteEmail,
  getEmail as buttondownGetEmail,
  listSubscribers as buttondownListSubscribers,
  updateEmail as buttondownUpdateEmail,
  type ButtondownEmailStatus,
} from "./buttondown";
import {
  createDraft as typefullyCreateDraft,
  getDraft as typefullyGetDraft,
} from "./typefully";

const SITE_URL = getEnv("SITE_URL") || "https://anipotts.com";

const X_CONTENT_LIMIT = 250;
const LINKEDIN_CONTENT_LIMIT = 2500;

export interface PublishResult {
  status: { success: boolean; error?: string };
  typefully: {
    x: { success: boolean; error?: string; draftId?: string };
    linkedin: { success: boolean; error?: string; draftId?: string };
  };
  buttondown: { success: boolean; error?: string; emailId?: string };
}

export type ButtondownEmailUpdate = {
  subject?: string;
  body?: string;
  status?: ButtondownEmailStatus;
  publish_date?: string;
};

function publicWritingUrl(slug: string): string {
  return `${SITE_URL}/writing/${slug}`;
}

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

export async function pushThoughtToButtondown(id: string) {
  const thought = await getThoughtById(id, "title, content");
  if (!thought) return { error: "Thought not found" };

  const result = await buttondownCreateEmail(
    String(thought.title),
    String(thought.content || ""),
    "draft",
  );
  if (!result.success) return { error: result.error };
  if (typeof result.data.id !== "string" || !result.data.id) {
    return { error: "Buttondown returned no email ID" };
  }

  await updateThought(id, {
    buttondown_email_id: result.data.id,
    updated_at: now(),
  });
  return { success: true, emailId: result.data.id };
}

export async function publishThoughtEverywhere(
  id: string,
): Promise<PublishResult | { error: string }> {
  const thought = await getThoughtById(id);
  if (!thought) return { error: "Thought not found" };

  const link = publicWritingUrl(String(thought.slug));
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

  if (!anyDistributionSucceeded) {
    result.status = {
      success: false,
      error: "All distribution channels failed. Status not changed.",
    };
    return result;
  }

  const ts = now();
  const existingPosted = parseJsonArray<Platform>(thought.platforms_posted);
  const posted: Platform[] = [...existingPosted];
  if (result.typefully.x.success && !posted.includes("twitter")) {
    posted.push("twitter");
  }
  if (result.typefully.linkedin.success && !posted.includes("linkedin")) {
    posted.push("linkedin");
  }

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

  return result;
}

export async function pushAtomDraftToTypefully(atomId: string) {
  const atom = await getAtomById(atomId);
  if (!atom) return { error: "Atom not found" };

  const result = await typefullyCreateDraft(String(atom.atom_content));
  if (!result.success) return { error: result.error };

  await updateAtomFields(atomId, {
    typefully_draft_id: result.data.id,
    updated_at: now(),
  });

  return { success: true, draftId: result.data.id };
}

export async function fetchTypefullyDraft(draftId: string) {
  const result = await typefullyGetDraft(draftId);
  if (!result.success) return { error: result.error };
  return { success: true, draft: result.data };
}

export async function fetchButtondownEmail(emailId: string) {
  const result = await buttondownGetEmail(emailId);
  if (!result.success) return { error: result.error };
  return { success: true, email: result.data };
}

export async function editButtondownEmail(
  emailId: string,
  fields: ButtondownEmailUpdate,
) {
  const result = await buttondownUpdateEmail(emailId, fields);
  if (!result.success) return { error: result.error };
  return { success: true, email: result.data };
}

export async function removeButtondownEmail(emailId: string) {
  const result = await buttondownDeleteEmail(emailId);
  if (!result.success) return { error: result.error };
  return { success: true };
}

export async function fetchRegularSubscribers() {
  const result = await buttondownListSubscribers("regular");
  if (!result.success) return { error: result.error };
  return { success: true, subscribers: result.data, count: result.count };
}
