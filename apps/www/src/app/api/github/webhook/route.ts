import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

/**
 * GitHub Webhook handler.
 * Receives push, pull_request, release, create, and star events.
 * Stores them in the github_events table and updates the metrics_cache
 * for backward compatibility with the activity feed.
 *
 * Required env vars:
 *   GITHUB_WEBHOOK_SECRET   - shared secret for signature verification
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

const SUPPORTED_EVENTS = new Set([
  "push",
  "pull_request",
  "release",
  "create",
  "star",
]);

function verifySignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;
  const expected =
    "sha256=" +
    crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

interface PushCommit {
  id: string;
  message: string;
  timestamp: string;
  url: string;
}

function extractEventData(
  eventType: string,
  payload: Record<string, unknown>
): {
  eventAction: string | null;
  repo: string;
  repoUrl: string;
  timestamp: string;
  data: Record<string, unknown>;
} | null {
  const repository = payload.repository as
    | { full_name?: string; html_url?: string; private?: boolean }
    | undefined;

  // Skip private repos
  if (repository?.private) return null;

  const repo = repository?.full_name?.split("/")[1] ?? "unknown";
  const repoUrl = repository?.html_url ?? "";

  switch (eventType) {
    case "push": {
      const commits = (payload.commits ?? []) as PushCommit[];
      const ref = payload.ref as string | undefined;
      const branch = ref?.replace("refs/heads/", "") ?? "unknown";
      return {
        eventAction: null,
        repo,
        repoUrl,
        timestamp: (payload.head_commit as { timestamp?: string })?.timestamp ??
          new Date().toISOString(),
        data: {
          branch,
          commit_count: commits.length,
          commits: commits.slice(0, 10).map((c) => ({
            sha: c.id.slice(0, 7),
            message: c.message.split("\n")[0],
            date: c.timestamp,
            url: c.url,
          })),
        },
      };
    }

    case "pull_request": {
      const pr = payload.pull_request as {
        title?: string;
        number?: number;
        merged?: boolean;
        additions?: number;
        deletions?: number;
        html_url?: string;
      } | undefined;
      const action = payload.action as string;
      if (!["opened", "closed", "merged"].includes(action)) return null;
      return {
        eventAction: pr?.merged ? "merged" : action,
        repo,
        repoUrl,
        timestamp: new Date().toISOString(),
        data: {
          title: pr?.title,
          number: pr?.number,
          merged: pr?.merged ?? false,
          additions: pr?.additions ?? 0,
          deletions: pr?.deletions ?? 0,
          url: pr?.html_url,
        },
      };
    }

    case "release": {
      const action = payload.action as string;
      if (action !== "published") return null;
      const release = payload.release as {
        tag_name?: string;
        name?: string;
        body?: string;
        html_url?: string;
      } | undefined;
      return {
        eventAction: "published",
        repo,
        repoUrl,
        timestamp: new Date().toISOString(),
        data: {
          tag: release?.tag_name,
          name: release?.name,
          body: release?.body?.slice(0, 500),
          url: release?.html_url,
        },
      };
    }

    case "create": {
      const refType = payload.ref_type as string | undefined;
      const ref = payload.ref as string | undefined;
      return {
        eventAction: refType ?? null,
        repo,
        repoUrl,
        timestamp: new Date().toISOString(),
        data: {
          ref_type: refType,
          ref,
        },
      };
    }

    case "star": {
      const action = payload.action as string;
      if (action !== "created") return null;
      const stargazersCount =
        (repository as { stargazers_count?: number } | undefined)?.stargazers_count ?? 0;
      return {
        eventAction: "created",
        repo,
        repoUrl,
        timestamp: new Date().toISOString(),
        data: {
          stargazers_count: stargazersCount,
        },
      };
    }

    default:
      return null;
  }
}

export async function POST(request: Request) {
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  // Read raw body for signature verification
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifySignature(rawBody, signature, webhookSecret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const eventType = request.headers.get("x-github-event");
  const deliveryId = request.headers.get("x-github-delivery");

  // Handle ping event
  if (eventType === "ping") {
    return NextResponse.json({ pong: true });
  }

  if (!eventType || !SUPPORTED_EVENTS.has(eventType)) {
    return NextResponse.json({ skipped: true, reason: "unsupported event" });
  }

  const payload = JSON.parse(rawBody) as Record<string, unknown>;
  const extracted = extractEventData(eventType, payload);

  if (!extracted) {
    return NextResponse.json({
      skipped: true,
      reason: "filtered (private repo or unsupported action)",
    });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Insert into github_events (dedup via github_delivery_id)
  const { error: insertError } = await supabase.from("github_events").upsert(
    {
      event_type: eventType,
      event_action: extracted.eventAction,
      repo: extracted.repo,
      repo_url: extracted.repoUrl,
      payload: extracted.data,
      github_delivery_id: deliveryId,
      github_timestamp: extracted.timestamp,
    },
    { onConflict: "github_delivery_id" }
  );

  if (insertError) {
    console.error("Failed to insert github_event:", insertError);
    return NextResponse.json(
      { error: "Database insert failed" },
      { status: 500 }
    );
  }

  // For push events, also prepend commits to the metrics_cache github_activity
  // key for backward compatibility with the existing activity feed
  if (eventType === "push" && extracted.data.commits) {
    try {
      const { data: cached } = await supabase
        .from("metrics_cache")
        .select("value")
        .eq("key", "github_activity")
        .single();

      const existing = (cached?.value as { commits?: unknown[] })?.commits ?? [];
      const newCommits = (
        extracted.data.commits as { sha: string; message: string; date: string; url: string }[]
      ).map((c) => ({
        ...c,
        repo: extracted.repo,
      }));

      await supabase.from("metrics_cache").upsert(
        {
          key: "github_activity",
          value: {
            commits: [...newCommits, ...existing].slice(0, 50),
            fetchedAt: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );
    } catch (err) {
      // Non-critical: log but don't fail the webhook
      console.error("Failed to update metrics_cache:", err);
    }
  }

  return NextResponse.json({
    success: true,
    event: eventType,
    repo: extracted.repo,
  });
}
