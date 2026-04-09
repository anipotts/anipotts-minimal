const BASE_URL = "https://api.buttondown.com/v1";

function getConfig() {
  const apiKey = process.env.BUTTONDOWN_API_KEY;
  if (!apiKey) throw new Error("BUTTONDOWN_API_KEY not configured");
  return { apiKey };
}

function headers(apiKey: string) {
  return {
    Authorization: `Token ${apiKey}`,
    "Content-Type": "application/json",
  };
}

export type ButtondownEmailStatus =
  | "draft"
  | "scheduled"
  | "about_to_send"
  | "in_flight"
  | "sent";

export interface ButtondownEmail {
  id: string;
  subject: string;
  body: string;
  status: ButtondownEmailStatus;
  publish_date?: string;
  creation_date: string;
  modification_date: string;
  secondary_id?: number;
  email_type: string;
}

export interface ButtondownSubscriber {
  id: string;
  email: string;
  creation_date: string;
  notes: string;
  tags: string[];
  type: "regular" | "unsubscribed" | "unactivated" | "removed";
  subscriber_type: string;
}

export async function listSubscribers(
  type?: "regular" | "unsubscribed",
): Promise<{ data: ButtondownSubscriber[]; count: number; error?: string }> {
  try {
    const { apiKey } = getConfig();
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    const res = await fetch(`${BASE_URL}/subscribers?${params.toString()}`, {
      headers: headers(apiKey),
    });
    if (!res.ok) {
      return {
        data: [],
        count: 0,
        error: `Buttondown ${res.status}: ${await res.text()}`,
      };
    }
    const data = await res.json();
    return { data: data.results || [], count: data.count || 0 };
  } catch (e) {
    return { data: [], count: 0, error: String(e) };
  }
}

export async function listEmails(
  status?: ButtondownEmailStatus,
): Promise<{ data: ButtondownEmail[]; error?: string }> {
  try {
    const { apiKey } = getConfig();
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    const res = await fetch(`${BASE_URL}/emails?${params.toString()}`, {
      headers: headers(apiKey),
    });
    if (!res.ok) {
      return {
        data: [],
        error: `Buttondown ${res.status}: ${await res.text()}`,
      };
    }
    const data = await res.json();
    return { data: data.results || [] };
  } catch (e) {
    return { data: [], error: String(e) };
  }
}

export async function getEmail(
  emailId: string,
): Promise<{ data?: ButtondownEmail; error?: string }> {
  try {
    const { apiKey } = getConfig();
    const res = await fetch(`${BASE_URL}/emails/${emailId}`, {
      headers: headers(apiKey),
    });
    if (!res.ok) {
      return { error: `Buttondown ${res.status}: ${await res.text()}` };
    }
    return { data: await res.json() };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function createEmail(
  subject: string,
  body: string,
  status: "draft" | "scheduled" | "about_to_send" = "draft",
  publishDate?: string,
): Promise<{ data?: ButtondownEmail; error?: string }> {
  try {
    const { apiKey } = getConfig();
    const payload: Record<string, unknown> = { subject, body, status };
    if (publishDate) payload.publish_date = publishDate;

    const res = await fetch(`${BASE_URL}/emails`, {
      method: "POST",
      headers: headers(apiKey),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      return { error: `Buttondown ${res.status}: ${await res.text()}` };
    }
    return { data: await res.json() };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function updateEmail(
  emailId: string,
  fields: {
    subject?: string;
    body?: string;
    status?: ButtondownEmailStatus;
    publish_date?: string;
  },
): Promise<{ data?: ButtondownEmail; error?: string }> {
  try {
    const { apiKey } = getConfig();
    const res = await fetch(`${BASE_URL}/emails/${emailId}`, {
      method: "PATCH",
      headers: headers(apiKey),
      body: JSON.stringify(fields),
    });
    if (!res.ok) {
      return { error: `Buttondown ${res.status}: ${await res.text()}` };
    }
    return { data: await res.json() };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function deleteEmail(
  emailId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { apiKey } = getConfig();
    const res = await fetch(`${BASE_URL}/emails/${emailId}`, {
      method: "DELETE",
      headers: headers(apiKey),
    });
    if (!res.ok && res.status !== 204) {
      return {
        success: false,
        error: `Buttondown ${res.status}: ${await res.text()}`,
      };
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
