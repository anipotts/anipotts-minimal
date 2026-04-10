// Types matching the Mini API response shapes

export interface MiniVitalsLive {
  hostname: string;
  cpu_percent: number;
  cpu_cores: number;
  mem_total_gb: number;
  mem_used_gb: number;
  mem_percent: number;
  disk_percent: number;
  disk_used: string;
  disk_total: string;
  uptime_seconds: number;
  load_average: number[];
  ts: string;
}

export interface MiniProcess {
  pid: number;
  cpu: number;
  mem: number;
  command: string;
}

export interface MiniProcesses {
  processes: MiniProcess[];
  ts: string;
}

export interface MiniAgent {
  label: string;
  pid: number | null;
  running: boolean;
  plist_exists: boolean;
}

export interface MiniAgents {
  agents: MiniAgent[];
  ts: string;
}

export interface MiniRepoStatus {
  name: string;
  dirty: boolean;
  dirty_files: number;
  unpushed_count: number;
  last_commit: {
    hash: string | undefined;
    message: string | undefined;
    date: string | undefined;
  };
}

export interface MiniRepos {
  repos: MiniRepoStatus[];
  ts: string;
}

export interface MiniRudy {
  available: boolean;
  daemon_running?: boolean;
  daemon_pid?: number | null;
  events?: number;
  entities?: number;
  relationships?: number;
  vault_notes_indexed?: number;
  db_size_mb?: number;
  error?: string;
  ts: string;
}

export interface MiniSessions {
  available: boolean;
  reason?: string;
  error?: string;
  today?: { sessions: number; tool_calls: number; cost: number };
  last_7d?: { sessions: number; tool_calls: number; cost: number };
  last_30d?: { sessions: number; tool_calls: number; cost: number };
  ts: string;
}

export interface MiniSyncthing {
  available: boolean;
  my_id?: string;
  uptime?: number;
  connections?: unknown;
  ts: string;
}

export interface MiniPresence {
  available: boolean;
  snapshots?: Array<{
    timestamp: number;
    location: string;
    nearLaptop: boolean | null;
    phoneOnNetwork: boolean | null;
    confidence: number;
  }>;
  ts: string;
}

export interface MiniVault {
  available: boolean;
  total_notes?: number;
  folders?: Record<string, number>;
  recent_changes_24h?: number;
  ts: string;
}

export interface MiniHealth {
  ok: boolean;
  ts: string;
  uptime: number;
  clients: number;
}

export interface MiniStreamState {
  vitals: MiniVitalsLive | null;
  processes: MiniProcesses | null;
  agents: MiniAgents | null;
  repos: MiniRepos | null;
  rudy: MiniRudy | null;
  sessions: MiniSessions | null;
  syncthing: MiniSyncthing | null;
  presence: MiniPresence | null;
  vault: MiniVault | null;
  connected: boolean;
  lastEvent: string | null;
}
