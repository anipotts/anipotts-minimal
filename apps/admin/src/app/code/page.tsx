import { Suspense } from "react";
import {
  getDeploymentStatus,
  getNpmStats,
  getGitHubOverview,
  getClaudeMonHealth,
  getNpmVersions,
} from "@anipotts/lib/code";
import type {
  WorkerDeployment,
  FlyMachine,
  NpmPackageStats,
  GitHubRepoStats,
  ClaudeMonHealth,
  NpmVersionInfo,
} from "@anipotts/lib/code";
import { getMiniRepos, getMiniSessions } from "@anipotts/lib/mini";
import LiveCodeSections from "./live-repos";

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

// ── ClaudeMon ──

function ClaudeMonStatus({ health }: { health: ClaudeMonHealth }) {
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

async function ClaudeMonSection() {
  const health = await getClaudeMonHealth();
  return (
    <Section title="ClaudeMon">
      <ClaudeMonStatus health={health} />
      <p className="text-[10px] text-zinc-600 mt-2">
        Checked{" "}
        {new Date(health.fetchedAt).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        })}
      </p>
    </Section>
  );
}

// ── Package Versions ──

function VersionRow({ pkg }: { pkg: NpmVersionInfo }) {
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

async function PackageVersionsSection() {
  const versions = await getNpmVersions();
  return (
    <Section title="Package Versions">
      <div className="space-y-px">
        {versions.map((pkg) => (
          <VersionRow key={pkg.name} pkg={pkg} />
        ))}
      </div>
    </Section>
  );
}

// ── Vercel ──

function VercelPlaceholder() {
  return (
    <Section title="Vercel">
      <div className="py-6 text-center">
        <p className="text-[12px] text-zinc-600">Connect Vercel</p>
      </div>
    </Section>
  );
}

// ── Page ──

async function LiveCodeWrapper() {
  const [repos, sessions] = await Promise.all([
    getMiniRepos(),
    getMiniSessions(),
  ]);

  return <LiveCodeSections initial={{ repos, sessions }} />;
}

export default function CodePage() {
  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 border-b border-zinc-800/60 px-6 py-3">
        <h2 className="text-[13px] font-medium text-zinc-200">Code</h2>
      </div>
      <div className="flex-1 overflow-y-auto admin-scroll p-6 space-y-4">
        <Suspense
          fallback={
            <div className="space-y-4">
              <SectionSkeleton title="Repos" />
              <SectionSkeleton title="CC Analytics" />
            </div>
          }
        >
          <LiveCodeWrapper />
        </Suspense>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Suspense fallback={<SectionSkeleton title="Deployments" />}>
            <DeploymentsSection />
          </Suspense>
          <Suspense fallback={<SectionSkeleton title="npm Packages" />}>
            <NpmSection />
          </Suspense>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Suspense fallback={<SectionSkeleton title="ClaudeMon" />}>
            <ClaudeMonSection />
          </Suspense>
          <Suspense fallback={<SectionSkeleton title="Package Versions" />}>
            <PackageVersionsSection />
          </Suspense>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Suspense fallback={<SectionSkeleton title="GitHub" />}>
            <GitHubSection />
          </Suspense>
          <VercelPlaceholder />
        </div>
      </div>
    </div>
  );
}
