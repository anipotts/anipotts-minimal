/**
 * Service registry queries. Reads from service_registry joined with the most
 * recent row in status_checks per service_id. Mirrors the money/queries.ts
 * nullable-DB pattern: if getDrizzle() returns null we degrade to [] / null.
 */

import { desc, isNull, sql } from "drizzle-orm";
import { getDrizzle } from "../db";
import * as s from "../db/schema";

export interface ServiceRow {
  id: string;
  name: string;
  hostname: string;
  visibility: "internal" | "public" | string;
  owner: string;
  port: number | null;
  manifestSha: string | null;
  manifestPath: string | null;
  deployedAt: string | null;
  retiredAt: string | null;
  updatedAt: string | null;
}

export interface ServiceWithStatus extends ServiceRow {
  status: {
    isUp: boolean;
    statusCode: number | null;
    responseTimeMs: number | null;
    checkedAt: string | null;
  } | null;
}

function rowToService(r: typeof s.serviceRegistry.$inferSelect): ServiceRow {
  return {
    id: r.id,
    name: r.name,
    hostname: r.hostname,
    visibility: r.visibility,
    owner: r.owner,
    port: r.port,
    manifestSha: r.manifest_sha,
    manifestPath: r.manifest_path,
    deployedAt: r.deployed_at,
    retiredAt: r.retired_at,
    updatedAt: r.updated_at,
  };
}

/** All active services (not retired), sorted by most-recent update. */
export async function getServices(): Promise<ServiceRow[]> {
  const db = getDrizzle();
  if (!db) return [];

  const rows = await db
    .select()
    .from(s.serviceRegistry)
    .where(isNull(s.serviceRegistry.retired_at))
    .orderBy(desc(s.serviceRegistry.updated_at));

  return rows.map(rowToService);
}

/**
 * Active services with the latest status_check row per service_id joined in.
 * One round-trip via a window-function-style subquery (SQLite supports
 * ROW_NUMBER() OVER since 3.25). service_id is soft-FK so we left-join.
 */
export async function getServicesWithLatestStatus(): Promise<
  ServiceWithStatus[]
> {
  const db = getDrizzle();
  if (!db) return [];

  const rows = await db.all<{
    id: string;
    name: string;
    hostname: string;
    visibility: string;
    owner: string;
    port: number | null;
    manifest_sha: string | null;
    manifest_path: string | null;
    deployed_at: string | null;
    retired_at: string | null;
    updated_at: string | null;
    status_code: number | null;
    response_time_ms: number | null;
    is_up: number | null;
    checked_at: string | null;
  }>(sql`
    SELECT
      sr.id, sr.name, sr.hostname, sr.visibility, sr.owner, sr.port,
      sr.manifest_sha, sr.manifest_path, sr.deployed_at, sr.retired_at,
      sr.updated_at,
      sc.status_code, sc.response_time_ms, sc.is_up, sc.checked_at
    FROM service_registry sr
    LEFT JOIN (
      SELECT service_id, status_code, response_time_ms, is_up, checked_at,
             ROW_NUMBER() OVER (PARTITION BY service_id ORDER BY checked_at DESC) rn
      FROM status_checks
      WHERE service_id IS NOT NULL
    ) sc ON sc.service_id = sr.id AND sc.rn = 1
    WHERE sr.retired_at IS NULL
    ORDER BY sr.updated_at DESC
  `);

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    hostname: r.hostname,
    visibility: r.visibility,
    owner: r.owner,
    port: r.port,
    manifestSha: r.manifest_sha,
    manifestPath: r.manifest_path,
    deployedAt: r.deployed_at,
    retiredAt: r.retired_at,
    updatedAt: r.updated_at,
    status:
      r.checked_at == null
        ? null
        : {
            isUp: r.is_up === 1,
            statusCode: r.status_code,
            responseTimeMs: r.response_time_ms,
            checkedAt: r.checked_at,
          },
  }));
}
