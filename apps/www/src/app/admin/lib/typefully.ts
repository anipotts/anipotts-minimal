const BASE_URL = "https://api.typefully.com/v1";

function getConfig() {
  const apiKey = process.env.TYPEFULLY_API_KEY;
  const socialSetId = process.env.TYPEFULLY_SOCIAL_SET_ID;
  if (!socialSetId) throw new Error("TYPEFULLY_SOCIAL_SET_ID not configured");
  if (!apiKey) throw new Error("TYPEFULLY_API_KEY not configured");
  return { apiKey, socialSetId };
}

function headers(apiKey: string) {
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

export async function listDrafts(
  status?: TypefullyDraftStatus,
): Promise<{ data: TypefullyDraft[]; error?: string }> {
  try {
    const { apiKey, socialSetId } = getConfig();
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    const url = `${BASE_URL}/drafts/?${params.toString()}`;
    const res = await fetch(url, {
      headers: { ...headers(apiKey), "X-SOCIAL-SET-ID": socialSetId },
    });
    if (!res.ok) {
      return {
        data: [],
        error: `Typefully ${res.status}: ${await res.text()}`,
      };
    }
    const data = await res.json();
    return { data: Array.isArray(data) ? data : data.results || [] };
  } catch (e) {
    return { data: [], error: String(e) };
  }
}

export async function getDraft(
  draftId: string,
): Promise<{ data?: TypefullyDraft; error?: string }> {
  try {
    const { apiKey } = getConfig();
    const res = await fetch(`${BASE_URL}/drafts/${draftId}/`, {
      headers: headers(apiKey),
    });
    if (!res.ok) {
      return { error: `Typefully ${res.status}: ${await res.text()}` };
    }
    return { data: await res.json() };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function createDraft(
  content: string,
  options?: {
    schedule?: string;
    threadify?: boolean;
  },
): Promise<{ data?: TypefullyDraft; error?: string }> {
  try {
    const { apiKey, socialSetId } = getConfig();
    const body: Record<string, unknown> = {
      content,
      social_set_id: Number(socialSetId),
    };
    if (options?.schedule) body["schedule-date"] = options.schedule;
    if (options?.threadify) body.threadify = true;

    const res = await fetch(`${BASE_URL}/drafts/`, {
      method: "POST",
      headers: headers(apiKey),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      return { error: `Typefully ${res.status}: ${await res.text()}` };
    }
    return { data: await res.json() };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function updateDraft(
  draftId: string,
  content: string,
): Promise<{ data?: TypefullyDraft; error?: string }> {
  try {
    const { apiKey } = getConfig();
    const res = await fetch(`${BASE_URL}/drafts/${draftId}/`, {
      method: "PUT",
      headers: headers(apiKey),
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      return { error: `Typefully ${res.status}: ${await res.text()}` };
    }
    return { data: await res.json() };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function deleteDraft(
  draftId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { apiKey } = getConfig();
    const res = await fetch(`${BASE_URL}/drafts/${draftId}/`, {
      method: "DELETE",
      headers: headers(apiKey),
    });
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
