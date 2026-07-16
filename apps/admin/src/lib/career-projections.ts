import {
  encryptAdminPayload,
  importAdminEncryptionKey,
  isAdminProjectionStale,
} from "@anipotts/lib/admin";
import { json } from "./passkey-auth";

type ProjectionContext = { request: Request; locals: App.Locals };

export async function refreshCareerProjection(
  context: ProjectionContext,
): Promise<Response> {
  const db = context.locals.runtime?.env.DB;
  if (!db) return json({ error: "db_binding_missing" }, { status: 503 });
  const body = (await context.request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!body || body.domain !== "career")
    return json({ error: "career_projection_required" }, { status: 400 });
  const snapshot = object(body.snapshot);
  const targets = Array.isArray(body.targets) ? body.targets.map(object) : [];
  const sourceStatus = Array.isArray(snapshot.source_status)
    ? snapshot.source_status.map(object)
    : [];
  if (
    !text(snapshot.current_focus) ||
    !text(snapshot.next_action) ||
    sourceStatus.length === 0
  ) {
    return json({ error: "invalid_sanitized_projection" }, { status: 400 });
  }
  assertSanitized(body);

  const now = new Date().toISOString();
  const snapshotId = text(snapshot.snapshot_id) || crypto.randomUUID();
  const stale = isAdminProjectionStale(sourceStatus);
  await db
    .prepare(
      `INSERT INTO admin_career_snapshots
      (snapshot_id, project_ref, generated_at, stale, source_status,
       current_focus, readiness, next_action, contradictions, commitments,
       proof_refs, updated_at)
     VALUES (?, 'project-job-search', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(snapshot_id) DO UPDATE SET generated_at = excluded.generated_at,
       stale = excluded.stale, source_status = excluded.source_status,
       current_focus = excluded.current_focus, readiness = excluded.readiness,
       next_action = excluded.next_action, contradictions = excluded.contradictions,
       commitments = excluded.commitments, proof_refs = excluded.proof_refs,
       updated_at = excluded.updated_at`,
    )
    .bind(
      snapshotId,
      text(snapshot.generated_at) || now,
      stale ? 1 : 0,
      JSON.stringify(sourceStatus),
      text(snapshot.current_focus),
      text(snapshot.readiness) || "not assessed",
      text(snapshot.next_action),
      JSON.stringify(stringArray(snapshot.contradictions)),
      JSON.stringify(stringArray(snapshot.commitments)),
      JSON.stringify(stringArray(snapshot.proof_refs)),
      now,
    )
    .run();

  const keyText = context.locals.runtime?.env.ADMIN_ACTION_ENCRYPTION_KEY;
  const key = keyText ? await importAdminEncryptionKey(keyText) : null;
  for (const target of targets) {
    const targetId = text(target.target_id) || crypto.randomUUID();
    const linkRefs: string[] = [];
    const links = Array.isArray(target.source_links)
      ? target.source_links.map(object)
      : [];
    if (links.length > 0 && !key)
      return json(
        { error: "source_link_encryption_key_missing" },
        { status: 503 },
      );
    for (const link of links) {
      const locator = text(link.locator);
      if (!allowedSourceLocator(locator))
        return json({ error: "source_locator_not_allowed" }, { status: 400 });
      const encrypted = await encryptAdminPayload({ locator }, key!, 1);
      const linkId = crypto.randomUUID();
      await db
        .prepare(
          `INSERT INTO admin_source_links
          (source_link_id, domain, provider, label, locator_ciphertext,
           locator_iv, key_version, created_at, expires_at)
         VALUES (?, 'career', ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          linkId,
          text(link.provider),
          text(link.label),
          encrypted.ciphertext,
          encrypted.iv,
          encrypted.key_version,
          now,
          new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        )
        .run();
      linkRefs.push(linkId);
    }
    await db
      .prepare(
        `INSERT INTO admin_career_targets
        (target_id, snapshot_ref, company, role, stage, status, last_contact_at,
         interview_at, next_action, source_refs, source_link_refs, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(target_id) DO UPDATE SET snapshot_ref = excluded.snapshot_ref,
         company = excluded.company, role = excluded.role, stage = excluded.stage,
         status = excluded.status, last_contact_at = excluded.last_contact_at,
         interview_at = excluded.interview_at, next_action = excluded.next_action,
         source_refs = excluded.source_refs, source_link_refs = excluded.source_link_refs,
         updated_at = excluded.updated_at`,
      )
      .bind(
        targetId,
        snapshotId,
        text(target.company),
        text(target.role),
        text(target.stage),
        text(target.status),
        nullableText(target.last_contact_at),
        nullableText(target.interview_at),
        text(target.next_action),
        JSON.stringify(stringArray(target.source_refs)),
        JSON.stringify(linkRefs),
        now,
      )
      .run();
  }
  return json({
    ok: true,
    snapshot_id: snapshotId,
    stale,
    targets: targets.length,
  });
}

export async function openCareerSourceLink(
  context: ProjectionContext,
  sourceLinkId: string,
): Promise<Response> {
  const db = context.locals.runtime?.env.DB;
  const keyText = context.locals.runtime?.env.ADMIN_ACTION_ENCRYPTION_KEY;
  if (!db || !keyText)
    return json({ error: "source_link_unavailable" }, { status: 503 });
  const row = await db
    .prepare(
      `SELECT locator_ciphertext, locator_iv, expires_at FROM admin_source_links
     WHERE source_link_id = ? AND domain = 'career'`,
    )
    .bind(sourceLinkId)
    .first<{
      locator_ciphertext: string;
      locator_iv: string;
      expires_at: string | null;
    }>();
  if (!row || (row.expires_at && Date.parse(row.expires_at) <= Date.now())) {
    return json({ error: "source_link_not_found" }, { status: 404 });
  }
  const { decryptAdminPayload } = await import("@anipotts/lib/admin");
  const payload = await decryptAdminPayload<{ locator: string }>(
    { ciphertext: row.locator_ciphertext, iv: row.locator_iv },
    await importAdminEncryptionKey(keyText),
  );
  if (!allowedSourceLocator(payload.locator))
    return json({ error: "source_locator_not_allowed" }, { status: 400 });
  await db
    .prepare(
      `UPDATE admin_source_links SET last_opened_at = ? WHERE source_link_id = ?`,
    )
    .bind(new Date().toISOString(), sourceLinkId)
    .run();
  return new Response(null, {
    status: 302,
    headers: {
      location: payload.locator,
      "cache-control": "no-store",
      "referrer-policy": "no-referrer",
    },
  });
}

function allowedSourceLocator(locator: string): boolean {
  try {
    const url = new URL(locator);
    return (
      url.protocol === "https:" &&
      ["mail.google.com", "calendar.google.com", "docs.google.com"].includes(
        url.hostname,
      )
    );
  } catch {
    return false;
  }
}

function assertSanitized(value: unknown): void {
  const serialized = JSON.stringify(value).toLowerCase();
  for (const forbidden of [
    "raw_body",
    "attachment",
    "recipient",
    "message_id",
    "thread_id",
    "calendar_note",
    "session_token",
    "provider_credential",
  ]) {
    if (serialized.includes(`\"${forbidden}\"`))
      throw json(
        { error: "private_source_field_rejected", field: forbidden },
        { status: 400 },
      );
  }
}
function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}
function nullableText(value: unknown): string | null {
  const valueText = text(value);
  return valueText || null;
}
function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}
