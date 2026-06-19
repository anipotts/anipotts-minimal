import { getEnv } from "@anipotts/lib/env";
import { retry } from "./retry";

const BASE_URL = "https://api.typefully.com/v1";

export type ApiSuccess<T> = { success: true; data: T };
export type ApiError = { success: false; error: string };
export type ApiResult<T> = ApiSuccess<T> | ApiError;
export type DeleteResult =
  | { success: true }
  | { success: false; error: string };

function getConfig() {
  const apiKey = getEnv("TYPEFULLY_API_KEY");
  const socialSetId = getEnv("TYPEFULLY_SOCIAL_SET_ID");
  if (!socialSetId) throw new Error("TYPEFULLY_SOCIAL_SET_ID not configured");
  if (!apiKey) throw new Error("TYPEFULLY_API_KEY not configured");
  return { apiKey, socialSetId };
}

function authHeaders(apiKey: string) {
  return {
    "X-API-KEY": apiKey,
    "Content-Type": "application/json",
  };
}

export type TypefullyDraftStatus =
  | "draft"
  | "scheduled"
  | "published"
  | "publishing"
  | "error";

export interface TypefullyDraft {
  id: string;
  text: string;
  status: TypefullyDraftStatus;
  scheduled_date?: string;
  published_date?: string;
  num_tweets?: number;
  created_at: string;
}

export async function getDraft(
  draftId: string,
): Promise<ApiResult<TypefullyDraft>> {
  try {
    const { apiKey } = getConfig();
    const res = await retry(() =>
      fetch(`${BASE_URL}/drafts/${draftId}/`, {
        headers: authHeaders(apiKey),
      }),
    );
    if (!res.ok) {
      return {
        success: false,
        error: `Typefully ${res.status}: ${await res.text()}`,
      };
    }
    return { success: true, data: await res.json() };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function createDraft(
  content: string,
  options?: {
    schedule?: string;
    threadify?: boolean;
  },
): Promise<ApiResult<TypefullyDraft>> {
  try {
    const { apiKey, socialSetId } = getConfig();
    const body: Record<string, unknown> = {
      content,
      social_set_id: Number(socialSetId),
    };
    if (options?.schedule) body["schedule-date"] = options.schedule;
    if (options?.threadify) body.threadify = true;

    const res = await retry(() =>
      fetch(`${BASE_URL}/drafts/`, {
        method: "POST",
        headers: authHeaders(apiKey),
        body: JSON.stringify(body),
      }),
    );
    if (!res.ok) {
      return {
        success: false,
        error: `Typefully ${res.status}: ${await res.text()}`,
      };
    }
    return { success: true, data: await res.json() };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function updateDraft(
  draftId: string,
  content: string,
): Promise<ApiResult<TypefullyDraft>> {
  try {
    const { apiKey } = getConfig();
    const res = await retry(() =>
      fetch(`${BASE_URL}/drafts/${draftId}/`, {
        method: "PUT",
        headers: authHeaders(apiKey),
        body: JSON.stringify({ content }),
      }),
    );
    if (!res.ok) {
      return {
        success: false,
        error: `Typefully ${res.status}: ${await res.text()}`,
      };
    }
    return { success: true, data: await res.json() };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function deleteDraft(draftId: string): Promise<DeleteResult> {
  try {
    const { apiKey } = getConfig();
    const res = await retry(() =>
      fetch(`${BASE_URL}/drafts/${draftId}/`, {
        method: "DELETE",
        headers: authHeaders(apiKey),
      }),
    );
    if (!res.ok && res.status !== 204) {
      return {
        success: false,
        error: `Typefully ${res.status}: ${await res.text()}`,
      };
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
