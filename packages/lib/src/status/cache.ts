/**
 * Status check persistence. Uses Drizzle ORM for typed D1 queries.
 *
 * D1 table: status_checks (id INTEGER PK AUTOINCREMENT, service_url, service_name,
 *   status_code, response_time_ms, is_up INTEGER, checked_at TEXT)
 */

import type { StatusCheckResult } from "./checker";
import { lt, desc } from "drizzle-orm";
import { logger } from "../logger";
import { getDrizzle, getDB } from "../db";
import * as s from "../db/schema";

/** Insert a batch of status check results. */
export async function insertStatusChecks(
  checks: StatusCheckResult[],
): Promise<void> {
  const db = getDrizzle();
  if (!db) throw new Error("Database not configured");

  const values = checks.map((c) => ({
    service_url: c.serviceUrl,
    service_name: c.serviceName,
    status_code: c.statusCode,
    response_time_ms: c.responseTimeMs,
    is_up: c.isUp,
    checked_at: c.checkedAt,
  }));

  // Drizzle supports batch insert
  await db.insert(s.statusChecks).values(values);
}

export interface ServiceStatus {
  serviceName: string;
  serviceUrl: string;
  isUp: boolean;
  statusCode: number | null;
  responseTimeMs: number;
  lastChecked: string;
  uptime24h: number;
  uptime7d: number;
}

/** Get the latest status + uptime percentages for all monitored services. */
export async function getServiceStatuses(): Promise<ServiceStatus[]> {
  const db = getDrizzle();
  if (!db) return [];

  try {
    // Get latest checks (raw approach is simpler for the grouping logic)
    const latestChecks = await db
      .select()
      .from(s.statusChecks)
      .orderBy(desc(s.statusChecks.checked_at))
      .limit(200);

    if (latestChecks.length === 0) return [];

    const latestByService = new Map<string, (typeof latestChecks)[0]>();
    for (const check of latestChecks) {
      if (!latestByService.has(check.service_url)) {
        latestByService.set(check.service_url, check);
      }
    }

    const nowMs = Date.now();
    const ago24h = new Date(nowMs - 24 * 60 * 60 * 1000).toISOString();
    const ago7d = new Date(nowMs - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Use raw D1 for the time-range queries (simpler than Drizzle gte on text columns)
    const d1 = getDB();
    if (!d1) return [];

    const { results: checks24h } = await d1
      .prepare(
        "SELECT service_url, is_up FROM status_checks WHERE checked_at >= ?",
      )
      .bind(ago24h)
      .all<{ service_url: string; is_up: number }>();

    const { results: checks7d } = await d1
      .prepare(
        "SELECT service_url, is_up FROM status_checks WHERE checked_at >= ?",
      )
      .bind(ago7d)
      .all<{ service_url: string; is_up: number }>();

    function calcUptime(
      checks: { service_url: string; is_up: number }[] | null,
      url: string,
    ): number {
      if (!checks) return 100;
      const serviceChecks = checks.filter((c) => c.service_url === url);
      if (serviceChecks.length === 0) return 100;
      const upCount = serviceChecks.filter((c) => c.is_up === 1).length;
      return Math.round((upCount / serviceChecks.length) * 1000) / 10;
    }

    const results: ServiceStatus[] = [];
    for (const [url, latest] of latestByService) {
      results.push({
        serviceName: latest.service_name,
        serviceUrl: url,
        isUp: latest.is_up,
        statusCode: latest.status_code,
        responseTimeMs: latest.response_time_ms,
        lastChecked: latest.checked_at,
        uptime24h: calcUptime(checks24h ?? null, url),
        uptime7d: calcUptime(checks7d ?? null, url),
      });
    }
    return results;
  } catch (err) {
    logger.error("status", "D1 getServiceStatuses failed", {
      error: String(err),
    });
    return [];
  }
}

/** Delete status checks older than the given number of days. */
export async function cleanupOldChecks(daysToKeep = 30): Promise<number> {
  const cutoff = new Date(
    Date.now() - daysToKeep * 24 * 60 * 60 * 1000,
  ).toISOString();

  const db = getDrizzle();
  if (!db) return 0;

  const result = await db
    .delete(s.statusChecks)
    .where(lt(s.statusChecks.checked_at, cutoff));
  return result.rowsAffected;
}
