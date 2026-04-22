import type { ServiceManifestInput, PlannedWrite } from "../types";
import { schema, sql, type DB } from "@anipotts/lib/db";

const { serviceRegistry } = schema;

// The D1 generator has two halves:
//   - planD1 / renderRegistryRow: pure, runs under Bun CLI, no DB required.
//   - upsertServiceRegistry: takes an injected Drizzle handle (Worker runtime
//     or admin server action). CLI does NOT call this directly — getDrizzle()
//     only binds inside a Worker. The admin spoke will expose a server action
//     that receives the manifest and invokes this helper.

export type ServiceRegistryRow = {
  id: string;
  name: string;
  hostname: string;
  visibility: string;
  owner: string;
  port: number | null;
  manifest_sha: string | null;
  manifest_path: string;
  deployed_at: string;
  retired_at: string | null;
  created_at: string;
  updated_at: string;
};

export function renderRegistryRow(
  m: ServiceManifestInput,
  manifestSha?: string,
): ServiceRegistryRow {
  const now = new Date().toISOString();
  return {
    id: m.name,
    name: m.name,
    hostname: m.hostname,
    visibility: m.visibility,
    owner: m.owner,
    port: m.mini.port,
    manifest_sha: manifestSha ?? null,
    manifest_path: `services/${m.name}.ts`,
    deployed_at: now,
    retired_at: null,
    created_at: now,
    updated_at: now,
  };
}

export async function planD1(m: ServiceManifestInput): Promise<PlannedWrite> {
  const row = renderRegistryRow(m);
  return {
    kind: "d1",
    changed: true,
    summary: `would upsert service_registry row id=${row.id} hostname=${row.hostname}`,
    body: JSON.stringify(row, null, 2),
  };
}

// Idempotent upsert keyed on the manifest name (unique in schema).
// On conflict: refresh every mutable field + bump updated_at, but keep the
// original created_at. retired_at is cleared (re-deploying an already-retired
// service is an explicit un-retire).
export async function upsertServiceRegistry(
  db: DB,
  m: ServiceManifestInput,
  manifestSha?: string,
): Promise<ServiceRegistryRow> {
  const row = renderRegistryRow(m, manifestSha);
  await db
    .insert(serviceRegistry)
    .values(row)
    .onConflictDoUpdate({
      target: serviceRegistry.name,
      set: {
        hostname: row.hostname,
        visibility: row.visibility,
        owner: row.owner,
        port: row.port,
        manifest_sha: row.manifest_sha,
        manifest_path: row.manifest_path,
        deployed_at: row.deployed_at,
        retired_at: null,
        updated_at: row.updated_at,
      },
    });
  return row;
}

// Mark a service retired without deleting history. Uses raw sql() because
// we only touch two fields and don't need a row roundtrip.
export async function markRetired(db: DB, name: string): Promise<void> {
  const now = new Date().toISOString();
  await db
    .update(serviceRegistry)
    .set({ retired_at: now, updated_at: now })
    .where(sql`${serviceRegistry.name} = ${name}`);
}
