import { getDrizzle } from "../db/drizzle";
import { codeHealth } from "../db/schema";
import type {
  RepoHealth,
  DeploymentStatus,
  WorkerDeployment,
  FlyMachine,
  NpmPackageStats,
  GitHubOverview,
  GitHubRepoStats,
  ClaudeMonHealth,
  NpmVersionInfo,
} from "./types";

// ---------------------------------------------------------------------------
// 1. getRepoHealth — all rows from code_health (pushed by Mini every 30 min)
// ---------------------------------------------------------------------------

export async function getRepoHealth(): Promise<RepoHealth[]> {
  const db = getDrizzle();
  if (!db) return [];

  const rows = await db.select().from(codeHealth);

  return rows.map((r) => ({
    repo: r.repo,
    dirty: r.dirty ?? false,
    unpushedCount: r.unpushed_count ?? 0,
    staleBranches: r.stale_branches ?? 0,
    lastCommitAt: r.last_commit_at,
    lastCommitMsg: r.last_commit_msg,
    deploymentStatus: r.deployment_status,
    updatedAt: r.updated_at,
  }));
}

// ---------------------------------------------------------------------------
// 2. getDeploymentStatus — CF Workers + Fly.io machines
// ---------------------------------------------------------------------------

const CF_WORKERS = [
  "anipotts-www",
  "anipotts-admin",
  "anipotts-ingest",
  "claudemon-api",
];

interface CfWorkerResponse {
  success: boolean;
  result?: {
    id: string;
    modified_on?: string;
  };
}

interface FlyMachineResponse {
  id: string;
  name: string;
  state: string;
  region: string;
}

export async function getDeploymentStatus(env: {
  CF_API_TOKEN?: string;
  CF_ACCOUNT_ID?: string;
  FLY_API_TOKEN?: string;
}): Promise<DeploymentStatus> {
  const fetchedAt = new Date().toISOString();
  const workers: WorkerDeployment[] = [];
  const flyMachines: FlyMachine[] = [];

  // CF Workers
  if (env.CF_API_TOKEN && env.CF_ACCOUNT_ID) {
    const results = await Promise.allSettled(
      CF_WORKERS.map(async (name) => {
        try {
          const res = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/workers/scripts/${name}`,
            {
              headers: { Authorization: `Bearer ${env.CF_API_TOKEN}` },
              signal: AbortSignal.timeout(5000),
            },
          );
          if (!res.ok) {
            return {
              name,
              status: "error" as const,
              lastDeployed: null,
              error: `HTTP ${res.status}`,
            };
          }
          const data = (await res.json()) as CfWorkerResponse;
          return {
            name,
            status: data.success ? ("active" as const) : ("error" as const),
            lastDeployed: data.result?.modified_on ?? null,
          };
        } catch (e) {
          return {
            name,
            status: "error" as const,
            lastDeployed: null,
            error: e instanceof Error ? e.message : "Fetch failed",
          };
        }
      }),
    );

    for (const r of results) {
      workers.push(
        r.status === "fulfilled"
          ? r.value
          : { name: "unknown", status: "unknown", lastDeployed: null },
      );
    }
  } else {
    for (const name of CF_WORKERS) {
      workers.push({
        name,
        status: "unknown",
        lastDeployed: null,
        error: "CF_API_TOKEN not configured",
      });
    }
  }

  // Fly.io machines for antileak
  if (env.FLY_API_TOKEN) {
    try {
      const res = await fetch(
        "https://api.machines.dev/v1/apps/antileak/machines",
        {
          headers: { Authorization: `Bearer ${env.FLY_API_TOKEN}` },
          signal: AbortSignal.timeout(5000),
        },
      );
      if (res.ok) {
        let machines: FlyMachineResponse[] = [];
        try {
          machines = (await res.json()) as FlyMachineResponse[];
        } catch {
          flyMachines.push({
            name: "antileak",
            status: "error",
            region: null,
            error: "Invalid JSON",
          });
        }
        for (const m of machines) {
          flyMachines.push({
            name: m.name || m.id,
            status:
              m.state === "started"
                ? "started"
                : m.state === "stopped"
                  ? "stopped"
                  : "unknown",
            region: m.region,
          });
        }
      } else {
        flyMachines.push({
          name: "antileak",
          status: "error",
          region: null,
          error: `HTTP ${res.status}`,
        });
      }
    } catch (e) {
      flyMachines.push({
        name: "antileak",
        status: "error",
        region: null,
        error: e instanceof Error ? e.message : "Fetch failed",
      });
    }
  } else {
    flyMachines.push({
      name: "antileak",
      status: "unknown",
      region: null,
      error: "FLY_API_TOKEN not configured",
    });
  }

  return { workers, flyMachines, fetchedAt };
}

// ---------------------------------------------------------------------------
// 3. getNpmStats — imessage-mcp and claudemon-cli downloads
// ---------------------------------------------------------------------------

interface NpmDownloads {
  downloads: number;
}

async function fetchNpmDownloads(pkg: string, period: string): Promise<number> {
  try {
    const res = await fetch(
      `https://api.npmjs.org/downloads/point/${period}/${pkg}`,
      {
        signal: AbortSignal.timeout(5000),
        next: { revalidate: 3600 },
      } as RequestInit,
    );
    if (!res.ok) return 0;
    const data = (await res.json()) as NpmDownloads;
    return data.downloads ?? 0;
  } catch {
    return 0;
  }
}

const NPM_PACKAGES = ["imessage-mcp", "claudemon-cli"];

export async function getNpmStats(): Promise<NpmPackageStats[]> {
  const results = await Promise.allSettled(
    NPM_PACKAGES.map(async (name) => {
      try {
        const [weekly, monthly, total] = await Promise.all([
          fetchNpmDownloads(name, "last-week"),
          fetchNpmDownloads(name, "last-month"),
          fetchNpmDownloads(name, "last-year"),
        ]);
        return { name, weekly, monthly, total };
      } catch (e) {
        return {
          name,
          weekly: 0,
          monthly: 0,
          total: 0,
          error: e instanceof Error ? e.message : "Fetch failed",
        };
      }
    }),
  );

  return results.map((r) =>
    r.status === "fulfilled"
      ? r.value
      : { name: "unknown", weekly: 0, monthly: 0, total: 0, error: "Failed" },
  );
}

// ---------------------------------------------------------------------------
// 4. getGitHubOverview — stars, issues, PRs across key repos
// ---------------------------------------------------------------------------

const GITHUB_REPOS = [
  "anipotts/anipotts.com",
  "anipotts/claude-code-tips",
  "anipotts/imessage-mcp",
  "anipotts/claudemon",
  "anipotts/antileak",
  "anipotts/vector-seo",
  "anipotts/quantercise",
  "anipotts/rudy",
];

interface GhRepoResponse {
  full_name: string;
  stargazers_count: number;
  open_issues_count: number;
  html_url: string;
}

interface GhSearchResponse {
  total_count: number;
}

export async function getGitHubOverview(env: {
  GITHUB_TOKEN?: string;
}): Promise<GitHubOverview> {
  const fetchedAt = new Date().toISOString();

  if (!env.GITHUB_TOKEN) {
    return {
      repos: [],
      totalStars: 0,
      totalOpenIssues: 0,
      totalOpenPRs: 0,
      fetchedAt,
    };
  }

  const headers = {
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const repos: GitHubRepoStats[] = [];

  // Fetch repos sequentially to stay within GitHub Search API rate limit (30/min)
  const results = await Promise.allSettled(
    GITHUB_REPOS.map(async (fullName) => {
      try {
        const repoRes = await fetch(
          `https://api.github.com/repos/${fullName}`,
          {
            headers,
            signal: AbortSignal.timeout(5000),
            next: { revalidate: 300 },
          } as RequestInit,
        );

        const prsRes = await fetch(
          `https://api.github.com/search/issues?q=repo:${fullName}+type:pr+state:open&per_page=1`,
          {
            headers,
            signal: AbortSignal.timeout(5000),
            next: { revalidate: 300 },
          } as RequestInit,
        );

        if (!repoRes.ok) {
          const name = fullName.split("/")[1] ?? fullName;
          return {
            name,
            stars: 0,
            openIssues: 0,
            openPRs: 0,
            url: `https://github.com/${fullName}`,
            error: `HTTP ${repoRes.status}`,
          };
        }

        const repoData = (await repoRes.json()) as GhRepoResponse;
        let openPRs = 0;
        if (prsRes.ok) {
          const prData = (await prsRes.json()) as GhSearchResponse;
          openPRs = prData.total_count ?? 0;
        }

        const name = fullName.split("/")[1] ?? fullName;
        // open_issues_count includes PRs, so subtract
        const openIssues = Math.max(0, repoData.open_issues_count - openPRs);

        return {
          name,
          stars: repoData.stargazers_count,
          openIssues,
          openPRs,
          url: repoData.html_url,
        };
      } catch (e) {
        const name = fullName.split("/")[1] ?? fullName;
        return {
          name,
          stars: 0,
          openIssues: 0,
          openPRs: 0,
          url: `https://github.com/${fullName}`,
          error: e instanceof Error ? e.message : "Fetch failed",
        };
      }
    }),
  );

  for (const r of results) {
    repos.push(
      r.status === "fulfilled"
        ? r.value
        : {
            name: "unknown",
            stars: 0,
            openIssues: 0,
            openPRs: 0,
            url: "",
            error: "Failed",
          },
    );
  }

  return {
    repos,
    totalStars: repos.reduce((sum, r) => sum + r.stars, 0),
    totalOpenIssues: repos.reduce((sum, r) => sum + r.openIssues, 0),
    totalOpenPRs: repos.reduce((sum, r) => sum + r.openPRs, 0),
    fetchedAt,
  };
}

// ---------------------------------------------------------------------------
// 5. getClaudeMonHealth — ping ClaudeMon API
// ---------------------------------------------------------------------------

export async function getClaudeMonHealth(): Promise<ClaudeMonHealth> {
  const fetchedAt = new Date().toISOString();
  try {
    const res = await fetch("https://api.claudemon.com/health", {
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    return { up: res.ok, fetchedAt };
  } catch (e) {
    return {
      up: false,
      error: e instanceof Error ? e.message : "Unreachable",
      fetchedAt,
    };
  }
}

// ---------------------------------------------------------------------------
// 6. getNpmVersions — current vs latest for key packages
// ---------------------------------------------------------------------------

interface NpmRegistryLatest {
  version?: string;
}

const VERSION_PACKAGES: Array<{ name: string; current: string }> = [
  { name: "imessage-mcp", current: "1.0.0" },
  { name: "claudemon-cli", current: "1.0.0" },
];

export async function getNpmVersions(): Promise<NpmVersionInfo[]> {
  const results = await Promise.allSettled(
    VERSION_PACKAGES.map(async ({ name, current }) => {
      try {
        const res = await fetch(`https://registry.npmjs.org/${name}/latest`, {
          signal: AbortSignal.timeout(5000),
          next: { revalidate: 3600 },
        } as RequestInit);
        if (!res.ok) {
          return {
            name,
            current,
            latest: null,
            updateAvailable: false,
            error: `HTTP ${res.status}`,
          };
        }
        const data = (await res.json()) as NpmRegistryLatest;
        const latest = data.version ?? null;
        return {
          name,
          current,
          latest,
          updateAvailable: latest !== null && latest !== current,
        };
      } catch (e) {
        return {
          name,
          current,
          latest: null,
          updateAvailable: false,
          error: e instanceof Error ? e.message : "Fetch failed",
        };
      }
    }),
  );

  return results.map((r) =>
    r.status === "fulfilled"
      ? r.value
      : {
          name: "unknown",
          current: null,
          latest: null,
          updateAvailable: false,
          error: "Failed",
        },
  );
}
