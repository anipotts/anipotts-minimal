import type {
  ClaudeMonHealth,
  FlyMachine,
  GitHubRepoStats,
  NpmPackageStats,
  NpmVersionInfo,
  WorkerDeployment,
} from "@anipotts/lib/code";
import { DeploymentDot, StatCard, shortCount } from "./code-display";

export function WorkerRow({ w }: { w: WorkerDeployment }) {
  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-zinc-800/20">
      <DeploymentDot status={w.status} />
      <span className="text-[12px] text-zinc-300 flex-1">{w.name}</span>
      <span className="text-[10px] text-zinc-600">
        {w.lastDeployed
          ? new Date(w.lastDeployed).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          : ""}
      </span>
      {w.error && (
        <span className="text-[10px] text-red-400/70 truncate max-w-[120px]">
          {w.error}
        </span>
      )}
    </div>
  );
}

export function FlyRow({ m }: { m: FlyMachine }) {
  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-zinc-800/20">
      <DeploymentDot status={m.status} />
      <span className="text-[12px] text-zinc-300 flex-1">{m.name}</span>
      {m.region && (
        <span className="text-[10px] text-zinc-600">{m.region}</span>
      )}
      {m.error && (
        <span className="text-[10px] text-red-400/70 truncate max-w-[120px]">
          {m.error}
        </span>
      )}
    </div>
  );
}

export function NpmRow({ pkg }: { pkg: NpmPackageStats }) {
  return (
    <div className="space-y-2">
      <div className="text-[12px] text-zinc-300 font-medium">{pkg.name}</div>
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Weekly" value={shortCount(pkg.weekly)} />
        <StatCard label="Monthly" value={shortCount(pkg.monthly)} />
        <StatCard label="Total" value={shortCount(pkg.total)} sub="last year" />
      </div>
      {pkg.error && (
        <p className="text-[10px] text-amber-500/70">{pkg.error}</p>
      )}
    </div>
  );
}

export function GhRepoRow({ repo }: { repo: GitHubRepoStats }) {
  return (
    <div className="admin-row text-[12px]">
      <div className="flex-1 min-w-0">
        <a
          href={repo.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-200 hover:text-zinc-100 font-medium"
        >
          {repo.name}
        </a>
      </div>
      <div className="w-14 text-right text-zinc-400">
        {repo.stars > 0 && `${repo.stars}`}
      </div>
      <div className="w-14 text-right text-zinc-500">
        {repo.openIssues > 0 && (
          <span className="text-amber-400">{repo.openIssues} iss</span>
        )}
      </div>
      <div className="w-14 text-right text-zinc-500">
        {repo.openPRs > 0 && (
          <span className="text-blue-400">{repo.openPRs} PR</span>
        )}
      </div>
    </div>
  );
}

export function ClaudeMonStatus({ health }: { health: ClaudeMonHealth }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-block w-2 h-2 rounded-full ${health.up ? "bg-emerald-400" : "bg-zinc-600"}`}
        role="img"
        aria-label={health.up ? "up" : "down"}
      />
      <span className="text-[12px] text-zinc-300">
        {health.up ? "ClaudeMon: up" : "ClaudeMon: check manually"}
      </span>
      {health.error && (
        <span className="text-[10px] text-zinc-600">{health.error}</span>
      )}
    </div>
  );
}

export function VersionRow({ pkg }: { pkg: NpmVersionInfo }) {
  return (
    <div className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-zinc-800/20">
      <span className="text-[12px] text-zinc-300 font-medium font-mono flex-1">
        {pkg.name}
      </span>
      <span className="text-[10px] text-zinc-500 font-mono">
        {pkg.current ?? "?"}
      </span>
      <span className="text-[10px] text-zinc-600 px-1">vs</span>
      <span className="text-[10px] text-zinc-500 font-mono">
        {pkg.latest ?? "?"}
      </span>
      {pkg.error ? (
        <span className="admin-badge bg-zinc-800/40 text-zinc-500 border border-zinc-700/30">
          error
        </span>
      ) : pkg.updateAvailable ? (
        <span className="admin-badge bg-amber-950/40 text-amber-400 border border-amber-900/30">
          update available
        </span>
      ) : (
        <span className="admin-badge bg-emerald-950/40 text-emerald-400 border border-emerald-900/30">
          up to date
        </span>
      )}
    </div>
  );
}
