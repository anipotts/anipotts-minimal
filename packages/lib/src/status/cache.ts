/**
 * Status check persistence. D1-first with Supabase fallback.
 *
 * D1 table: status_checks (id INTEGER PK AUTOINCREMENT, service_url, service_name,
 *   status_code, response_time_ms, is_up INTEGER, checked_at TEXT)
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { StatusCheckResult } from "./checker";
import { logger } from "../logger";
import { getDB, toBool, fromBool } from "../db";

/** Insert a batch of status check results. */
export async function insertStatusChecks(
  supabase: SupabaseClient,
  checks: StatusCheckResult[],
): Promise<void> {
  const db = getDB();
  if (db) {
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
    return;
  }

  const rows = checks.map((c) => ({
    service_url: c.serviceUrl,
    service_name: c.serviceName,
    status_code: c.statusCode,
    response_time_ms: c.responseTimeMs,
    is_up: c.isUp,
    checked_at: c.checkedAt,
  }));

  const { error } = await supabase.from("status_checks").insert(rows);
  if (error) {
    logger.error("status", "Error inserting status checks", {
      error: String(error),
    });
    throw error;
  }
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
export async function getServiceStatuses(
  supabase: SupabaseClient,
): Promise<ServiceStatus[]> {
  const db = getDB();
  if (db) {
    try {
      // Get latest check per service
      const { results: latestChecks } = await db
        .prepare(
          "SELECT * FROM status_checks ORDER BY checked_at DESC LIMIT 200",
        )
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

  // Supabase fallback
  const { data: latestChecks, error: latestErr } = await supabase
    .from("status_checks")
    .select("*")
    .order("checked_at", { ascending: false })
    .limit(200);

  if (latestErr || !latestChecks) {
    logger.error("status", "Error fetching latest checks", {
      error: String(latestErr),
    });
    return [];
  }

  const latestByService = new Map<
    string,
    {
      service_name: string;
      service_url: string;
      is_up: boolean;
      status_code: number | null;
      response_time_ms: number;
      checked_at: string;
    }
  >();

  for (const check of latestChecks) {
    if (!latestByService.has(check.service_url)) {
      latestByService.set(check.service_url, check);
    }
  }

  const now = new Date();
  const ago24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const ago7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: checks24h } = await supabase
    .from("status_checks")
    .select("service_url, is_up")
    .gte("checked_at", ago24h);

  const { data: checks7d } = await supabase
    .from("status_checks")
    .select("service_url, is_up")
    .gte("checked_at", ago7d);

  function calcUptime(
    checks: { service_url: string; is_up: boolean }[] | null,
    url: string,
  ): number {
    if (!checks) return 100;
    const serviceChecks = checks.filter((c) => c.service_url === url);
    if (serviceChecks.length === 0) return 100;
    const upCount = serviceChecks.filter((c) => c.is_up).length;
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
}

/** Delete status checks older than the given number of days. */
export async function cleanupOldChecks(
  supabase: SupabaseClient,
  daysToKeep = 30,
): Promise<number> {
  const cutoff = new Date(
    Date.now() - daysToKeep * 24 * 60 * 60 * 1000,
  ).toISOString();

  const db = getDB();
  if (db) {
    const result = await db
      .prepare("DELETE FROM status_checks WHERE checked_at < ?")
      .bind(cutoff)
      .run();
    return result.meta.changes;
  }

  const { count, error } = await supabase
    .from("status_checks")
    .delete({ count: "exact" })
    .lt("checked_at", cutoff);

  if (error) {
    logger.error("status", "Error cleaning up old checks", {
      error: String(error),
    });
  }

  return count ?? 0;
}
