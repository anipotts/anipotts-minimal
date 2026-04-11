export interface RepoHealth {
  repo: string;
  dirty: boolean;
  unpushedCount: number;
  staleBranches: number;
  lastCommitAt: string | null;
  lastCommitMsg: string | null;
  deploymentStatus: string | null;
  updatedAt: string | null;
}

export interface WorkerDeployment {
  name: string;
  status: "active" | "error" | "unknown";
  lastDeployed: string | null;
  error?: string;
}

export interface FlyMachine {
  name: string;
  status: "started" | "stopped" | "error" | "unknown";
  region: string | null;
  error?: string;
}

export interface DeploymentStatus {
  workers: WorkerDeployment[];
  flyMachines: FlyMachine[];
  fetchedAt: string;
}

export interface NpmPackageStats {
  name: string;
  weekly: number;
  monthly: number;
  total: number;
  error?: string;
}

export interface GitHubRepoStats {
  name: string;
  stars: number;
  openIssues: number;
  openPRs: number;
  url: string;
  error?: string;
}

export interface GitHubOverview {
  repos: GitHubRepoStats[];
  totalStars: number;
  totalOpenIssues: number;
  totalOpenPRs: number;
  fetchedAt: string;
}

export interface ClaudeMonHealth {
  up: boolean;
  error?: string;
  fetchedAt: string;
}

export interface NpmVersionInfo {
  name: string;
  current: string | null;
  latest: string | null;
  updateAvailable: boolean;
  error?: string;
}
