/**
 * Status check persistence. D1-only.
 *
 * D1 table: status_checks (id INTEGER PK AUTOINCREMENT, service_url, service_name,
 *   status_code, response_time_ms, is_up INTEGER, checked_at TEXT)
 */

import type { StatusCheckResult } from "./checker";
import { logger } from "../logger";
import { getDB, toBool, fromBool } from "../db";

/** Insert a batch of status check results. */
export async function insertStatusChecks(
  checks: StatusCheckResult[],
): Promise<void> {
  const db = getDB();
  if (!db) throw new Error("Database not configured");

  const stmt = db.prepare(
    "INSERT INTO status_checks (service_url, service_name, status_code, response_time_ms, is_up, checked_at) VALUES (?, ?, ?, ?, ?, ?)",
  );
  const batch = checks.map((c) =>
    stmt.bind(
      c.serviceUrl,
      c.serviceName,
      c.statusCode,
      c.responseTimeMs,
      fromBool(c.isUp),
      c.checkedAt,
    ),
  );
  await db.batch(batch);
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
  const db = getDB();
  if (!db) return [];

  try {
    // Get latest check per service
    const { results: latestChecks } = await db
      .prepare("SELECT * FROM status_checks ORDER BY checked_at DESC LIMIT 200")
      .all<Record<string, unknown>>();

    if (!latestChecks || latestChecks.length === 0) return [];

    const latestByService = new Map<string, Record<string, unknown>>();
    for (const check of latestChecks) {
      const url = check.service_url as string;
      if (!latestByService.has(url)) {
        latestByService.set(url, check);
      }
    }

    const now = Date.now();
    const ago24h = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    const ago7d = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { results: checks24h } = await db
      .prepare(
        "SELECT service_url, is_up FROM status_checks WHERE checked_at >= ?",
      )
      .bind(ago24h)
      .all<{ service_url: string; is_up: number }>();

    const { results: checks7d } = await db
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
      const upCount = serviceChecks.filter((c) => toBool(c.is_up)).length;
      return Math.round((upCount / serviceChecks.length) * 1000) / 10;
    }

    const results: ServiceStatus[] = [];
    for (const [url, latest] of latestByService) {
      results.push({
        serviceName: latest.service_name as string,
        serviceUrl: url,
        isUp: toBool(latest.is_up),
        statusCode: latest.status_code as number | null,
        responseTimeMs: latest.response_time_ms as number,
        lastChecked: latest.checked_at as string,
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

  const db = getDB();
  if (!db) return 0;

  const result = await db
    .prepare("DELETE FROM status_checks WHERE checked_at < ?")
    .bind(cutoff)
    .run();
  return result.meta.changes;
}
