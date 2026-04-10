import { Suspense } from "react";
import {
  getMiniVitals,
  getLaunchAgents,
  getCronHealth,
  getRudyHealth,
  getCCSessions,
} from "@anipotts/lib/ops";
import type { LaunchAgent, CronJob, CCSession } from "@anipotts/lib/ops";

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

function EmptyState({
  message,
  updatedAt,
}: {
  message: string;
  updatedAt?: string | null;
}) {
  return (
    <div className="py-6 text-center">
      <p className="text-[12px] text-zinc-500">{message}</p>
      {updatedAt ? (
        <p className="text-[10px] text-zinc-600 mt-1">
          Last received:{" "}
          {new Date(updatedAt).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
      ) : (
        <p className="text-[10px] text-zinc-600 mt-1">No data yet</p>
      )}
    </div>
  );
}

function FreshnessIndicator({ updatedAt }: { updatedAt: string | null }) {
  if (!updatedAt) return null;
  const age = Date.now() - new Date(updatedAt).getTime();
  const mins = Math.floor(age / 60000);
  const color =
    mins < 10
      ? "text-emerald-400/70"
      : mins < 30
        ? "text-amber-500/70"
        : "text-red-400/70";
  const label = mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`;
  return <span className={`text-[10px] ${color}`}>{label}</span>;
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "running" || status === "active" || status === "up"
      ? "bg-emerald-400"
      : status === "stopped" || status === "down"
        ? "bg-zinc-500"
        : status === "error"
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

// ── Mini Vitals ──

function VitalGauge({
  label,
  percent,
}: {
  label: string;
  percent: number | null;
}) {
  if (percent === null) return null;
  const color =
    percent < 70
      ? "bg-emerald-500"
      : percent < 90
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px]">
        <span className="text-zinc-500 uppercase tracking-wide">{label}</span>
        <span className="text-zinc-400">{percent.toFixed(0)}%</span>
      </div>
      <div
        className="h-1.5 rounded-full bg-zinc-800"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label} usage`}
      >
        <div
          className={`h-1.5 rounded-full ${color}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}

async function VitalsSection() {
  const vitals = await getMiniVitals();

  if (!vitals) {
    return (
      <Section title="Mac Mini">
        <EmptyState message="No system vitals received" />
      </Section>
    );
  }

  const age = vitals.updatedAt
    ? Date.now() - new Date(vitals.updatedAt).getTime()
    : Infinity;
  const staleMinutes = Math.floor(age / 60000);
  const overallStatus =
    staleMinutes < 10 ? "up" : staleMinutes < 30 ? "amber" : "down";
  const dotColor =
    overallStatus === "up"
      ? "bg-emerald-400"
      : overallStatus === "amber"
        ? "bg-amber-400"
        : "bg-red-400";

  return (
    <Section title="Mac Mini">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${dotColor}`} />
          <span className="text-[12px] text-zinc-300">
            {overallStatus === "up"
              ? "Online"
              : overallStatus === "amber"
                ? "Stale (10+ min)"
                : "Offline (30+ min)"}
          </span>
          <span className="ml-auto">
            <FreshnessIndicator updatedAt={vitals.updatedAt} />
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <VitalGauge label="CPU" percent={vitals.cpuPercent} />
          <VitalGauge label="Memory" percent={vitals.memoryPercent} />
          <VitalGauge label="Disk" percent={vitals.diskPercent} />
        </div>
        {vitals.uptime && (
          <div className="text-[11px] text-zinc-500">
            Uptime: {vitals.uptime}
          </div>
        )}
        {vitals.loadAverage && (
          <div className="text-[11px] text-zinc-500">
            Load: {vitals.loadAverage}
          </div>
        )}
      </div>
    </Section>
  );
}

// ── LaunchAgents ──

function AgentRow({ agent }: { agent: LaunchAgent }) {
  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-zinc-800/20">
      <StatusDot status={agent.status} />
      <div className="flex-1 min-w-0">
        <div className="text-[12px] text-zinc-300 truncate">{agent.label}</div>
      </div>
      <span className="text-[10px] text-zinc-600">{agent.namespace}</span>
      {agent.lastExitCode !== null && agent.lastExitCode !== 0 && (
        <span className="text-[10px] text-red-400">
          exit {agent.lastExitCode}
        </span>
      )}
    </div>
  );
}

async function LaunchAgentsSection() {
  const agents = await getLaunchAgents();

  if (agents.length === 0) {
    return (
      <Section title="LaunchAgents">
        <EmptyState message="No LaunchAgent data received" />
      </Section>
    );
  }

  // Group by namespace
  const byNamespace: Record<string, LaunchAgent[]> = {};
  for (const agent of agents) {
    const ns = agent.namespace;
    if (!byNamespace[ns]) byNamespace[ns] = [];
    byNamespace[ns].push(agent);
  }

  const latestUpdate = agents.reduce<string | null>(
    (latest, a) =>
      a.updatedAt && (!latest || a.updatedAt > latest) ? a.updatedAt : latest,
    null,
  );

  return (
    <Section title={`LaunchAgents (${agents.length})`}>
      <div className="flex justify-end mb-2">
        <FreshnessIndicator updatedAt={latestUpdate} />
      </div>
      <div className="space-y-3">
        {Object.entries(byNamespace).map(([ns, nsAgents]) => (
          <div key={ns}>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">
              {ns}
            </div>
            <div className="space-y-px">
              {nsAgents.map((a) => (
                <AgentRow key={a.label} agent={a} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ── Crons ──

function CronRow({ job }: { job: CronJob }) {
  const isError = job.exitCode !== null && job.exitCode !== 0;

  return (
    <div className="admin-row text-[12px]">
      <div className="flex-1 min-w-0">
        <div className={`text-zinc-300 ${isError ? "text-red-300" : ""}`}>
          {job.name}
        </div>
        {job.schedule && (
          <div className="text-[10px] text-zinc-600">{job.schedule}</div>
        )}
      </div>
      <div className="w-20 text-right">
        {job.lastRun && (
          <span className="text-[10px] text-zinc-500">
            {new Date(job.lastRun).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>
      <div className="w-14 text-right">
        {job.exitCode !== null && (
          <span
            className={`admin-badge border ${
              isError
                ? "bg-red-950/40 text-red-400 border-red-900/30"
                : "bg-emerald-950/40 text-emerald-400 border-emerald-900/30"
            }`}
          >
            {job.exitCode}
          </span>
        )}
      </div>
      <div className="w-16 text-right text-zinc-600 text-[10px]">
        {job.durationMs !== null && `${(job.durationMs / 1000).toFixed(1)}s`}
      </div>
    </div>
  );
}

async function CronsSection() {
  const jobs = await getCronHealth();

  if (jobs.length === 0) {
    return (
      <Section title="Crons">
        <EmptyState message="No cron data received" />
      </Section>
    );
  }

  const errorCount = jobs.filter(
    (j) => j.exitCode !== null && j.exitCode !== 0,
  ).length;

  const latestCronUpdate = jobs.reduce<string | null>(
    (latest, j) =>
      j.updatedAt && (!latest || j.updatedAt > latest) ? j.updatedAt : latest,
    null,
  );

  return (
    <Section title={`Crons (${jobs.length})`}>
      <div className="flex justify-end mb-2">
        <FreshnessIndicator updatedAt={latestCronUpdate} />
      </div>
      {errorCount > 0 && (
        <div className="mb-2 px-2 py-1.5 rounded bg-red-950/30 border border-red-900/30">
          <span className="text-[11px] text-red-400 font-medium">
            {errorCount} with non-zero exit codes
          </span>
        </div>
      )}
      <div className="admin-row text-[10px] text-zinc-500 uppercase tracking-wide border-b border-zinc-800/40">
        <div className="flex-1">Name</div>
        <div className="w-20 text-right">Last Run</div>
        <div className="w-14 text-right">Exit</div>
        <div className="w-16 text-right">Duration</div>
      </div>
      {jobs.map((j) => (
        <CronRow key={j.name} job={j} />
      ))}
    </Section>
  );
}

// ── Rudy ──

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

async function RudySection() {
  const rudy = await getRudyHealth();

  if (!rudy) {
    return (
      <Section title="Rudy">
        <EmptyState message="No Rudy data received" />
      </Section>
    );
  }

  return (
    <Section title="Rudy">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <StatusDot status={rudy.daemonRunning ? "running" : "stopped"} />
          <span className="text-[12px] text-zinc-300">
            {rudy.daemonRunning ? "Running" : "Stopped"}
          </span>
          <span className="ml-auto">
            <FreshnessIndicator updatedAt={rudy.updatedAt} />
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {rudy.vaultSizeBytes !== null && (
            <div className="text-center">
              <div className="text-[14px] font-medium text-zinc-200">
                {formatBytes(rudy.vaultSizeBytes)}
              </div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wide">
                Vault
              </div>
            </div>
          )}
          {rudy.graphEdges !== null && (
            <div className="text-center">
              <div className="text-[14px] font-medium text-zinc-200">
                {rudy.graphEdges}
              </div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wide">
                Edges
              </div>
            </div>
          )}
          {rudy.contacts !== null && (
            <div className="text-center">
              <div className="text-[14px] font-medium text-zinc-200">
                {rudy.contacts}
              </div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wide">
                Contacts
              </div>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}

// ── CC Sessions ──

function SessionRow({ session }: { session: CCSession }) {
  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-zinc-800/20">
      <StatusDot status={session.status === "active" ? "running" : "stopped"} />
      <div className="flex-1 min-w-0">
        <div className="text-[12px] text-zinc-300 truncate">
          {session.project ?? session.id}
        </div>
      </div>
      {session.startedAt && (
        <span className="text-[10px] text-zinc-600">
          {new Date(session.startedAt).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })}
        </span>
      )}
    </div>
  );
}

async function CCSessionsSection() {
  const sessions = await getCCSessions();

  if (sessions.length === 0) {
    return (
      <Section title="CC Sessions">
        <EmptyState message="No active sessions" />
      </Section>
    );
  }

  const latestSessionUpdate = sessions.reduce<string | null>(
    (latest, s) =>
      s.updatedAt && (!latest || s.updatedAt > latest) ? s.updatedAt : latest,
    null,
  );

  return (
    <Section title={`CC Sessions (${sessions.length})`}>
      <div className="flex justify-end mb-1">
        <FreshnessIndicator updatedAt={latestSessionUpdate} />
      </div>
      <div className="space-y-px">
        {sessions.map((s) => (
          <SessionRow key={s.id} session={s} />
        ))}
      </div>
    </Section>
  );
}

// ── Page ──

export default function OpsPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 border-b border-zinc-800/60 px-6 py-3">
        <h2 className="text-[13px] font-medium text-zinc-200">Ops</h2>
      </div>
      <div className="flex-1 overflow-y-auto admin-scroll p-6 space-y-4">
        <Suspense fallback={<SectionSkeleton title="Mac Mini" />}>
          <VitalsSection />
        </Suspense>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Suspense fallback={<SectionSkeleton title="LaunchAgents" />}>
            <LaunchAgentsSection />
          </Suspense>
          <Suspense fallback={<SectionSkeleton title="Crons" />}>
            <CronsSection />
          </Suspense>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Suspense fallback={<SectionSkeleton title="Rudy" />}>
            <RudySection />
          </Suspense>
          <Suspense fallback={<SectionSkeleton title="CC Sessions" />}>
            <CCSessionsSection />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
