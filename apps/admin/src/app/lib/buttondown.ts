import { getEnv } from "@anipotts/lib/env";
import { retry } from "./retry";

const BASE_URL = "https://api.buttondown.com/v1";

export type ApiSuccess<T> = { success: true; data: T };
export type ApiError = { success: false; error: string };
export type ApiResult<T> = ApiSuccess<T> | ApiError;
export type DeleteResult = { success: true } | { success: false; error: string };

export type SubscriberListResult =
  | { success: true; data: ButtondownSubscriber[]; count: number }
  | { success: false; error: string };

function getConfig() {
  const apiKey = getEnv("BUTTONDOWN_API_KEY");
  if (!apiKey) throw new Error("BUTTONDOWN_API_KEY not configured");
  return { apiKey };
}

function authHeaders(apiKey: string) {
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
): Promise<SubscriberListResult> {
  try {
    const { apiKey } = getConfig();
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    const res = await retry(() =>
      fetch(`${BASE_URL}/subscribers?${params.toString()}`, {
        headers: authHeaders(apiKey),
      }),
    );
    if (!res.ok) {
      return {
        success: false,
        error: `Buttondown ${res.status}: ${await res.text()}`,
      };
    }
    const data = await res.json();
    return {
      success: true,
      data: data.results || [],
      count: data.count || 0,
    };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function listEmails(
  status?: ButtondownEmailStatus,
): Promise<ApiResult<ButtondownEmail[]>> {
  try {
    const { apiKey } = getConfig();
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    const res = await retry(() =>
      fetch(`${BASE_URL}/emails?${params.toString()}`, {
        headers: authHeaders(apiKey),
      }),
    );
    if (!res.ok) {
      return {
        success: false,
        error: `Buttondown ${res.status}: ${await res.text()}`,
      };
    }
    const data = await res.json();
    return { success: true, data: data.results || [] };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function getEmail(
  emailId: string,
): Promise<ApiResult<ButtondownEmail>> {
  try {
    const { apiKey } = getConfig();
    const res = await retry(() =>
      fetch(`${BASE_URL}/emails/${emailId}`, {
        headers: authHeaders(apiKey),
      }),
    );
    if (!res.ok) {
      return {
        success: false,
        error: `Buttondown ${res.status}: ${await res.text()}`,
      };
    }
    return { success: true, data: await res.json() };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function createEmail(
  subject: string,
  body: string,
  status: "draft" | "scheduled" | "about_to_send" = "draft",
  publishDate?: string,
): Promise<ApiResult<ButtondownEmail>> {
  try {
    const { apiKey } = getConfig();
    const payload: Record<string, unknown> = { subject, body, status };
    if (publishDate) payload.publish_date = publishDate;

    const res = await retry(() =>
      fetch(`${BASE_URL}/emails`, {
        method: "POST",
        headers: authHeaders(apiKey),
        body: JSON.stringify(payload),
      }),
    );
    if (!res.ok) {
      return {
        success: false,
        error: `Buttondown ${res.status}: ${await res.text()}`,
      };
    }
    return { success: true, data: await res.json() };
  } catch (e) {
    return { success: false, error: String(e) };
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
): Promise<ApiResult<ButtondownEmail>> {
  try {
    const { apiKey } = getConfig();
    const res = await retry(() =>
      fetch(`${BASE_URL}/emails/${emailId}`, {
        method: "PATCH",
        headers: authHeaders(apiKey),
        body: JSON.stringify(fields),
      }),
    );
    if (!res.ok) {
      return {
        success: false,
        error: `Buttondown ${res.status}: ${await res.text()}`,
      };
    }
    return { success: true, data: await res.json() };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function deleteEmail(emailId: string): Promise<DeleteResult> {
  try {
    const { apiKey } = getConfig();
    const res = await retry(() =>
      fetch(`${BASE_URL}/emails/${emailId}`, {
        method: "DELETE",
        headers: authHeaders(apiKey),
      }),
    );
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
