import { Suspense } from "react";
import {
  getRepoHealth,
  getDeploymentStatus,
  getNpmStats,
  getGitHubOverview,
} from "@anipotts/lib/code";
import type {
  RepoHealth,
  WorkerDeployment,
  FlyMachine,
  NpmPackageStats,
  GitHubRepoStats,
} from "@anipotts/lib/code";

export const dynamic = "force-dynamic";

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-zinc-800/40 ${className}`} />
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-zinc-800/60 bg-zinc-950/50">
      <div className="px-4 py-2.5 border-b border-zinc-800/40">
        <h3 className="text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
          {title}
        </h3>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function SectionSkeleton({ title }: { title: string }) {
  return (
    <Section title={title}>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </Section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-6 text-center">
      <p className="text-[12px] text-zinc-500">{message}</p>
      <p className="text-[10px] text-zinc-600 mt-1">
        Awaiting data from Mac Mini
      </p>
    </div>
  );
}

function FreshnessIndicator({ updatedAt }: { updatedAt: string | null }) {
  if (!updatedAt) return null;
  const age = Date.now() - new Date(updatedAt).getTime();
  const mins = Math.floor(age / 60000);
  const color =
    mins < 10
      ? "text-zinc-600"
      : mins < 60
        ? "text-amber-500/70"
        : "text-red-400/70";
  const label = mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`;
  return <span className={`text-[10px] ${color}`}>{label}</span>;
}

// ── Repos Table ──

function RepoRow({ repo }: { repo: RepoHealth }) {
  const dirtyBadge = repo.dirty ? (
    <span className="admin-badge bg-amber-950/40 text-amber-400 border border-amber-900/30">
      dirty
    </span>
  ) : null;

  return (
    <div className="admin-row text-[12px]">
      <div className="flex-1 min-w-0">
        <div className="text-zinc-200 font-medium">{repo.repo}</div>
        {repo.lastCommitMsg && (
          <div className="text-[10px] text-zinc-600 truncate max-w-[280px]">
            {repo.lastCommitMsg}
          </div>
        )}
      </div>
      <div className="w-14 flex justify-center">{dirtyBadge}</div>
      <div className="w-16 text-right text-zinc-500">
        {repo.unpushedCount > 0 && (
          <span className="text-amber-400">{repo.unpushedCount} unpushed</span>
        )}
      </div>
      <div className="w-12 text-right text-zinc-600">
        {repo.staleBranches > 0 && `${repo.staleBranches} stale`}
      </div>
      <div className="w-20 text-right">
        <FreshnessIndicator updatedAt={repo.lastCommitAt} />
      </div>
    </div>
  );
}

async function ReposSection() {
  const repos = await getRepoHealth();

  if (repos.length === 0) {
    return (
      <Section title="Repos">
        <EmptyState message="No repo health data in D1" />
      </Section>
    );
  }

  const dirtyCount = repos.filter((r) => r.dirty).length;
  const updatedAt = repos[0]?.updatedAt ?? null;

  return (
    <Section title={`Repos (${repos.length})`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-3">
          {dirtyCount > 0 && (
            <span className="text-[11px] text-amber-400">
              {dirtyCount} dirty
            </span>
          )}
          <span className="text-[11px] text-zinc-500">
            {repos.reduce((s, r) => s + r.unpushedCount, 0)} total unpushed
          </span>
        </div>
        <FreshnessIndicator updatedAt={updatedAt} />
      </div>
      <div className="admin-row text-[10px] text-zinc-500 uppercase tracking-wide border-b border-zinc-800/40">
        <div className="flex-1">Repo</div>
        <div className="w-14 text-center">Status</div>
        <div className="w-16 text-right">Unpushed</div>
        <div className="w-12 text-right">Stale</div>
        <div className="w-20 text-right">Last commit</div>
      </div>
      {repos.map((r) => (
        <RepoRow key={r.repo} repo={r} />
      ))}
    </Section>
  );
}

// ── Deployments ──

function DeploymentDot({ status }: { status: string }) {
  const color =
    status === "active" || status === "started"
      ? "bg-emerald-400"
      : status === "error" || status === "stopped"
        ? "bg-red-400"
        : "bg-amber-400";
  return (
    <span
      className={`inline-block w-1.5 h-1.5 rounded-full ${color}`}
      role="img"
      aria-label={status}
    />
  );
}

function WorkerRow({ w }: { w: WorkerDeployment }) {
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

function FlyRow({ m }: { m: FlyMachine }) {
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

async function DeploymentsSection() {
  const deployment = await getDeploymentStatus({
    CF_API_TOKEN: process.env.CF_API_TOKEN,
    CF_ACCOUNT_ID: process.env.CF_ACCOUNT_ID,
    FLY_API_TOKEN: process.env.FLY_API_TOKEN,
  });

  return (
    <Section title="Deployments">
      <div className="space-y-3">
        <div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1.5">
            Cloudflare Workers
          </div>
          <div className="space-y-px">
            {deployment.workers.map((w) => (
              <WorkerRow key={w.name} w={w} />
            ))}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1.5">
            Fly.io
          </div>
          <div className="space-y-px">
            {deployment.flyMachines.map((m) => (
              <FlyRow key={m.name} m={m} />
            ))}
          </div>
        </div>
        <p className="text-[10px] text-zinc-600">
          Fetched{" "}
          {new Date(deployment.fetchedAt).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
      </div>
    </Section>
  );
}

// ── npm Stats ──

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-800/40 bg-zinc-900/30 p-3 text-center">
      <div className="text-[16px] font-medium text-zinc-200">{value}</div>
      <div className="text-[10px] text-zinc-500 uppercase tracking-wide">
        {label}
      </div>
      {sub && <div className="text-[10px] text-zinc-600 mt-0.5">{sub}</div>}
    </div>
  );
}

function NpmRow({ pkg }: { pkg: NpmPackageStats }) {
  const fmt = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  return (
    <div className="space-y-2">
      <div className="text-[12px] text-zinc-300 font-medium">{pkg.name}</div>
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Weekly" value={fmt(pkg.weekly)} />
        <StatCard label="Monthly" value={fmt(pkg.monthly)} />
        <StatCard label="Total" value={fmt(pkg.total)} sub="last year" />
      </div>
      {pkg.error && (
        <p className="text-[10px] text-amber-500/70">{pkg.error}</p>
      )}
    </div>
  );
}

async function NpmSection() {
  const packages = await getNpmStats();

  return (
    <Section title="npm Packages">
      <div className="space-y-4">
        {packages.map((pkg) => (
          <NpmRow key={pkg.name} pkg={pkg} />
        ))}
      </div>
    </Section>
  );
}

// ── GitHub Overview ──

function GhRepoRow({ repo }: { repo: GitHubRepoStats }) {
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

async function GitHubSection() {
  const overview = await getGitHubOverview({
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  });

  if (overview.repos.length === 0) {
    return (
      <Section title="GitHub">
        <p className="text-[12px] text-zinc-600">GITHUB_TOKEN not configured</p>
      </Section>
    );
  }

  return (
    <Section title="GitHub">
      <div className="flex gap-4 mb-3">
        <StatCard label="Stars" value={overview.totalStars} />
        <StatCard label="Issues" value={overview.totalOpenIssues} />
        <StatCard label="PRs" value={overview.totalOpenPRs} />
      </div>
      <div className="admin-row text-[10px] text-zinc-500 uppercase tracking-wide border-b border-zinc-800/40">
        <div className="flex-1">Repo</div>
        <div className="w-14 text-right">Stars</div>
        <div className="w-14 text-right">Issues</div>
        <div className="w-14 text-right">PRs</div>
      </div>
      {overview.repos.map((r) => (
        <GhRepoRow key={r.name} repo={r} />
      ))}
      <p className="text-[10px] text-zinc-600 mt-2">
        Fetched{" "}
        {new Date(overview.fetchedAt).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        })}
      </p>
    </Section>
  );
}

// ── Page ──

export default function CodePage() {
  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 border-b border-zinc-800/60 px-6 py-3">
        <h2 className="text-[13px] font-medium text-zinc-200">Code</h2>
      </div>
      <div className="flex-1 overflow-y-auto admin-scroll p-6 space-y-4">
        <Suspense fallback={<SectionSkeleton title="Repos" />}>
          <ReposSection />
        </Suspense>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Suspense fallback={<SectionSkeleton title="Deployments" />}>
            <DeploymentsSection />
          </Suspense>
          <Suspense fallback={<SectionSkeleton title="npm Packages" />}>
            <NpmSection />
          </Suspense>
        </div>

        <Suspense fallback={<SectionSkeleton title="GitHub" />}>
          <GitHubSection />
        </Suspense>
      </div>
    </div>
  );
}
