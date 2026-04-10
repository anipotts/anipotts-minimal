import { eq } from "drizzle-orm";
import { getDrizzle } from "../db/drizzle";
import { opsSnapshots } from "../db/schema";
import type {
  MiniVitals,
  LaunchAgent,
  CronJob,
  RudyHealth,
  CCSession,
} from "./types";

function parseValue<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function getSnapshotsByCategory(
  category: string,
): Promise<{ key: string; value: string; updatedAt: string | null }[]> {
  const db = getDrizzle();
  if (!db) return [];

  const rows = await db
    .select({
      key: opsSnapshots.key,
      value: opsSnapshots.value,
      updatedAt: opsSnapshots.updated_at,
    })
    .from(opsSnapshots)
    .where(eq(opsSnapshots.category, category));

  return rows.map((r) => ({
    key: r.key,
    value: r.value,
    updatedAt: r.updatedAt,
  }));
}

// ---------------------------------------------------------------------------
// 1. getMiniVitals — CPU, mem, disk, uptime from ops_snapshots category='system'
// ---------------------------------------------------------------------------

interface SystemSnapshot {
  cpu_percent?: number;
  memory_percent?: number;
  disk_percent?: number;
  uptime?: string;
  load_average?: string;
}

export async function getMiniVitals(): Promise<MiniVitals | null> {
  const rows = await getSnapshotsByCategory("system");
  if (rows.length === 0) return null;

  // System data is stored as a single row with key "system"
  const row = rows[0];
  if (!row) return null;

  const data = parseValue<SystemSnapshot>(row.value);
  if (!data) return null;

  return {
    cpuPercent: data.cpu_percent ?? null,
    memoryPercent: data.memory_percent ?? null,
    diskPercent: data.disk_percent ?? null,
    uptime: data.uptime ?? null,
    loadAverage: data.load_average ?? null,
    updatedAt: row.updatedAt,
  };
}

// ---------------------------------------------------------------------------
// 2. getLaunchAgents — from ops_snapshots category='launchagents'
// ---------------------------------------------------------------------------

interface AgentSnapshot {
  label: string;
  namespace?: string;
  status?: string;
  pid?: number;
  last_exit_code?: number;
}

export async function getLaunchAgents(): Promise<LaunchAgent[]> {
  const rows = await getSnapshotsByCategory("launchagents");
  if (rows.length === 0) return [];

  // Could be one row with array value, or multiple rows
  const agents: LaunchAgent[] = [];
  for (const row of rows) {
    const data = parseValue<AgentSnapshot | AgentSnapshot[]>(row.value);
    if (!data) continue;

    const items = Array.isArray(data) ? data : [data];
    for (const item of items) {
      agents.push({
        label: item.label || row.key,
        namespace: item.namespace ?? "user",
        status:
          item.status === "running"
            ? "running"
            : item.status === "stopped"
              ? "stopped"
              : item.status === "error"
                ? "error"
                : "unknown",
        pid: item.pid ?? null,
        lastExitCode: item.last_exit_code ?? null,
        updatedAt: row.updatedAt,
      });
    }
  }

  return agents;
}

// ---------------------------------------------------------------------------
// 3. getCronHealth — from ops_snapshots category='crons'
// ---------------------------------------------------------------------------

interface CronSnapshot {
  name: string;
  schedule?: string;
  last_run?: string;
  exit_code?: number;
  duration_ms?: number;
}

export async function getCronHealth(): Promise<CronJob[]> {
  const rows = await getSnapshotsByCategory("crons");
  if (rows.length === 0) return [];

  const jobs: CronJob[] = [];
  for (const row of rows) {
    const data = parseValue<CronSnapshot | CronSnapshot[]>(row.value);
    if (!data) continue;

    const items = Array.isArray(data) ? data : [data];
    for (const item of items) {
      jobs.push({
        name: item.name || row.key,
        schedule: item.schedule ?? null,
        lastRun: item.last_run ?? null,
        exitCode: item.exit_code ?? null,
        durationMs: item.duration_ms ?? null,
        updatedAt: row.updatedAt,
      });
    }
  }

  return jobs;
}

// ---------------------------------------------------------------------------
// 4. getRudyHealth — from ops_snapshots category='rudy'
// ---------------------------------------------------------------------------

interface RudySnapshot {
  daemon_running?: boolean;
  vault_size_bytes?: number;
  graph_edges?: number;
  contacts?: number;
}

export async function getRudyHealth(): Promise<RudyHealth | null> {
  const rows = await getSnapshotsByCategory("rudy");
  if (rows.length === 0) return null;

  const row = rows[0];
  if (!row) return null;

  const data = parseValue<RudySnapshot>(row.value);
  if (!data) return null;

  return {
    daemonRunning: data.daemon_running ?? false,
    vaultSizeBytes: data.vault_size_bytes ?? null,
    graphEdges: data.graph_edges ?? null,
    contacts: data.contacts ?? null,
    updatedAt: row.updatedAt,
  };
}

// ---------------------------------------------------------------------------
// 5. getCCSessions — from ops_snapshots category='cc_sessions'
// ---------------------------------------------------------------------------

interface CCSessionSnapshot {
  id: string;
  project?: string;
  started_at?: string;
  status?: string;
}

export async function getCCSessions(): Promise<CCSession[]> {
  const rows = await getSnapshotsByCategory("cc_sessions");
  if (rows.length === 0) return [];

  const sessions: CCSession[] = [];
  for (const row of rows) {
    const data = parseValue<CCSessionSnapshot | CCSessionSnapshot[]>(row.value);
    if (!data) continue;

    const items = Array.isArray(data) ? data : [data];
    for (const item of items) {
      sessions.push({
        id: item.id || row.key,
        project: item.project ?? null,
        startedAt: item.started_at ?? null,
        status: item.status ?? "unknown",
        updatedAt: row.updatedAt,
      });
    }
  }

  return sessions;
}
