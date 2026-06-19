import { getEnv } from "@anipotts/lib/env";
import { retry } from "./retry";

const BASE_URL = "https://api.typefully.com/v1";

type ApiSuccess<T> = { success: true; data: T };
type ApiError = { success: false; error: string };
export type ApiResult<T> = ApiSuccess<T> | ApiError;

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

type TypefullyDraftStatus =
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
