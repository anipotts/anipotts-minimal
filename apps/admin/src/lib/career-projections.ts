import {
  encryptAdminPayload,
  parseAdminEncryptionKeyring,
  resolveAdminEncryptionKey,
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
  const stale = isAdminProjectionStale(sourceStatus);
  const requestedSnapshotId = text(snapshot.snapshot_id) || crypto.randomUUID();
  const snapshotId = stale
    ? `${requestedSnapshotId}-stale-${crypto.randomUUID()}`
    : requestedSnapshotId;
  const statements = [
    db
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
      ),
  ];

  if (stale) {
    await db.batch(statements);
    return json(
      {
        ok: false,
        preserved_last_good: true,
        stale: true,
        snapshot_id: snapshotId,
        targets: 0,
      },
      { status: 202 },
    );
  }

  const keyring = await optionalKeyring(context);
  const preparedTargets: Array<{
    target: Record<string, unknown>;
    targetId: string;
    links: Array<{
      id: string;
      provider: string;
      label: string;
      ciphertext: string;
      iv: string;
      keyVersion: number;
    }>;
  }> = [];
  for (const target of targets) {
    const targetId = text(target.target_id) || crypto.randomUUID();
    const links = Array.isArray(target.source_links)
      ? target.source_links.map(object)
      : [];
    if (
      !text(target.company) ||
      !text(target.role) ||
      !text(target.next_action)
    ) {
      return json({ error: "invalid_sanitized_target" }, { status: 400 });
    }
    if (links.length > 0 && !keyring)
      return json(
        { error: "source_link_encryption_key_missing" },
        { status: 503 },
      );
    const encryptedLinks = [];
    for (const link of links) {
      const locator = text(link.locator);
      if (!allowedSourceLocator(locator))
        return json({ error: "source_locator_not_allowed" }, { status: 400 });
      const encrypted = await encryptAdminPayload(
        { locator },
        resolveAdminEncryptionKey(keyring!, keyring!.currentVersion),
        keyring!.currentVersion,
      );
      encryptedLinks.push({
        id: crypto.randomUUID(),
        provider: text(link.provider),
        label: text(link.label),
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        keyVersion: encrypted.key_version,
      });
    }
    preparedTargets.push({ target, targetId, links: encryptedLinks });
  }

  for (const prepared of preparedTargets) {
    const linkRefs = prepared.links.map((link) => link.id);
    for (const link of prepared.links) {
      statements.push(
        db
          .prepare(
            `INSERT INTO admin_source_links
          (source_link_id, domain, provider, label, locator_ciphertext,
           locator_iv, key_version, created_at, expires_at)
         VALUES (?, 'career', ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            link.id,
            link.provider,
            link.label,
            link.ciphertext,
            link.iv,
            link.keyVersion,
            now,
            new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          ),
      );
    }
    statements.push(
      db
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
          prepared.targetId,
          snapshotId,
          text(prepared.target.company),
          text(prepared.target.role),
          text(prepared.target.stage),
          text(prepared.target.status),
          nullableText(prepared.target.last_contact_at),
          nullableText(prepared.target.interview_at),
          text(prepared.target.next_action),
          JSON.stringify(stringArray(prepared.target.source_refs)),
          JSON.stringify(linkRefs),
          now,
        ),
    );
  }
  await db.batch(statements);
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
  const keyring = await optionalKeyring(context);
  if (!db || !keyring)
    return json({ error: "source_link_unavailable" }, { status: 503 });
  const row = await db
    .prepare(
      `SELECT locator_ciphertext, locator_iv, key_version, expires_at FROM admin_source_links
     WHERE source_link_id = ? AND domain = 'career'`,
    )
    .bind(sourceLinkId)
    .first<{
      locator_ciphertext: string;
      locator_iv: string;
      key_version: number;
      expires_at: string | null;
    }>();
  if (!row || (row.expires_at && Date.parse(row.expires_at) <= Date.now())) {
    return json({ error: "source_link_not_found" }, { status: 404 });
  }
  const { decryptAdminPayload } = await import("@anipotts/lib/admin");
  let payload: { locator: string };
  try {
    payload = await decryptAdminPayload<{ locator: string }>(
      { ciphertext: row.locator_ciphertext, iv: row.locator_iv },
      resolveAdminEncryptionKey(keyring, row.key_version),
    );
  } catch {
    return json({ error: "source_link_invalid" }, { status: 404 });
  }
  if (!allowedSourceLocator(payload.locator))
    return json({ error: "source_link_not_allowed" }, { status: 400 });
  try {
    await db
      .prepare(
        `UPDATE admin_source_links SET last_opened_at = ? WHERE source_link_id = ?`,
      )
      .bind(new Date().toISOString(), sourceLinkId)
      .run();
  } catch {
    return json({ error: "source_link_audit_failed" }, { status: 503 });
  }
  return new Response(null, {
    status: 302,
    headers: {
      location: payload.locator,
      "cache-control": "no-store",
      "referrer-policy": "no-referrer",
    },
  });
}

async function optionalKeyring(context: ProjectionContext) {
  const env = context.locals.runtime?.env;
  if (!env?.ADMIN_ACTION_ENCRYPTION_KEYS && !env?.ADMIN_ACTION_ENCRYPTION_KEY) {
    return null;
  }
  try {
    return await parseAdminEncryptionKeyring({
      currentVersion: env.ADMIN_ACTION_ENCRYPTION_KEY_VERSION,
      keysJson: env.ADMIN_ACTION_ENCRYPTION_KEYS,
      legacyKey: env.ADMIN_ACTION_ENCRYPTION_KEY,
    });
  } catch {
    throw json(
      { error: "source_link_encryption_key_unavailable" },
      { status: 503 },
    );
  }
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
