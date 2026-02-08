import { NextResponse } from "next/server";
import { createClient } from "@anipotts/lib/supabase";
import { monitoredServices } from "@anipotts/lib/data";
import {
  checkAllServices,
  insertStatusChecks,
  cleanupOldChecks,
} from "@anipotts/lib/status";

/**
 * Vercel Cron handler — runs every 5 minutes.
 * Checks all monitored services and stores results in Supabase.
 * Also cleans up checks older than 30 days.
 *
 * Required env vars:
 *   CRON_SECRET
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 },
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Check all monitored services
    const checks = await checkAllServices(monitoredServices);

    // Store results
    await insertStatusChecks(supabase, checks);

    // Cleanup old checks (once per run, lightweight)
    const deleted = await cleanupOldChecks(supabase, 30);

    const summary = {
      total: checks.length,
      up: checks.filter((c) => c.isUp).length,
      down: checks.filter((c) => !c.isUp).length,
      cleaned: deleted,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, ...summary });
  } catch (err) {
    console.error("Status cron failed:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "unknown" },
      { status: 500 },
    );
  }
}
