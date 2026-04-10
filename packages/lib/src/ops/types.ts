export interface OpsSnapshot {
  key: string;
  category: string;
  value: string;
  updatedAt: string | null;
}

export interface MiniVitals {
  cpuPercent: number | null;
  memoryPercent: number | null;
  diskPercent: number | null;
  uptime: string | null;
  loadAverage: string | null;
  updatedAt: string | null;
}

export interface LaunchAgent {
  label: string;
  namespace: string;
  status: "running" | "stopped" | "error" | "unknown";
  pid: number | null;
  lastExitCode: number | null;
  updatedAt: string | null;
}

export interface CronJob {
  name: string;
  schedule: string | null;
  lastRun: string | null;
  exitCode: number | null;
  durationMs: number | null;
  updatedAt: string | null;
}

export interface RudyHealth {
  daemonRunning: boolean;
  vaultSizeBytes: number | null;
  graphEdges: number | null;
  contacts: number | null;
  updatedAt: string | null;
}

export interface CCSession {
  id: string;
  project: string | null;
  startedAt: string | null;
  status: string;
  updatedAt: string | null;
}
