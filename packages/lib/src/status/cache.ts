/**
 * Supabase helpers for status check persistence.
 *
 * Supabase SQL to create the table:
 *   CREATE TABLE status_checks (
 *     id BIGSERIAL PRIMARY KEY,
 *     service_url TEXT NOT NULL,
 *     service_name TEXT NOT NULL,
 *     status_code INTEGER,
 *     response_time_ms INTEGER NOT NULL,
 *     is_up BOOLEAN NOT NULL,
 *     checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
 *   );
 *   CREATE INDEX idx_status_checks_lookup ON status_checks(service_url, checked_at DESC);
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { StatusCheckResult } from "./checker";
import { logger } from "../logger";

/** Insert a batch of status check results. */
export async function insertStatusChecks(
  supabase: SupabaseClient,
  checks: StatusCheckResult[],
): Promise<void> {
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
    logger.error("status", "Error inserting status checks", { error: String(error) });
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
  // Get the most recent check per service
  const { data: latestChecks, error: latestErr } = await supabase
    .from("status_checks")
    .select("*")
    .order("checked_at", { ascending: false })
    .limit(200); // Enough to cover all services' latest checks

  if (latestErr || !latestChecks) {
    logger.error("status", "Error fetching latest checks", { error: String(latestErr) });
    return [];
  }

  // Deduplicate to get the most recent check per service
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

  // Get uptime percentages for 24h and 7d
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

  // Calculate uptime percentages
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

  const { count, error } = await supabase
    .from("status_checks")
    .delete({ count: "exact" })
    .lt("checked_at", cutoff);

  if (error) {
    logger.error("status", "Error cleaning up old checks", { error: String(error) });
  }

  return count ?? 0;
}
