import type { ServiceManifestInput, PlannedWrite } from "../types";

// D1 write planner. Returns a PlannedWrite describing the upsert that apply
// would perform. Actual execution requires a bound D1 at runtime (CF Worker
// or wrangler), which Session 2a does not touch. A future apply path calls
// `upsertServiceRegistry(db, manifest)` with a real DB handle.

export function renderRegistryRow(
  m: ServiceManifestInput,
  manifestSha?: string,
) {
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
