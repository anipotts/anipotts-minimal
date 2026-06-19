export { getQCEnv } from "@/lib/qc-env";

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-zinc-800/40 ${className}`} />
  );
}

export function PanelShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-zinc-800/60 bg-zinc-950/50">
      <div className="px-4 py-2.5 border-b border-zinc-800/40">
        <h3 className="text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
          {title}
        </h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export function PanelSkeleton({ title }: { title: string }) {
  return (
    <PanelShell title={title}>
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </PanelShell>
  );
}

export function MetricCard({
  label,
  value,
  sub,
  color = "text-zinc-200",
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div>
      <div className={`text-[16px] font-medium ${color}`}>{value}</div>
      <div className="text-[10px] text-zinc-500 uppercase tracking-wide">
        {label}
      </div>
      {sub && <div className="text-[10px] text-zinc-600 mt-0.5">{sub}</div>}
    </div>
  );
}

export function ErrorPanel({
  title,
  message,
  hint,
}: {
  title: string;
  message: string;
  hint?: string;
}) {
  return (
    <PanelShell title={title}>
      <p className="text-[12px] text-red-400">{message}</p>
      {hint && <p className="text-[10px] text-zinc-600 mt-1">{hint}</p>}
    </PanelShell>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <p className="text-[12px] text-zinc-600">{message}</p>;
}

/** Status badge with color coding */
export function StatusBadge({
  status,
  colorMap,
}: {
  status: string;
  colorMap?: Record<string, string>;
}) {
  const defaults: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-400",
    free: "bg-zinc-500/10 text-zinc-400",
    canceled: "bg-red-500/10 text-red-400",
    past_due: "bg-amber-500/10 text-amber-400",
    healthy: "bg-emerald-500/10 text-emerald-400",
    degraded: "bg-amber-500/10 text-amber-400",
    error: "bg-red-500/10 text-red-400",
    pending: "bg-yellow-500/10 text-yellow-400",
    resolved: "bg-emerald-500/10 text-emerald-400",
    dismissed: "bg-zinc-500/10 text-zinc-400",
    retrying: "bg-blue-500/10 text-blue-400",
  };
  const colors = { ...defaults, ...colorMap };
  const cls = colors[status] ?? "bg-zinc-500/10 text-zinc-400";

  return (
    <span
      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${cls}`}
    >
      {status}
    </span>
  );
}

/** Difficulty badge */
export function DifficultyBadge({
  difficulty,
}: {
  difficulty: "Easy" | "Medium" | "Hard";
}) {
  const cls = {
    Easy: "bg-emerald-500/10 text-emerald-400",
    Medium: "bg-amber-500/10 text-amber-400",
    Hard: "bg-red-500/10 text-red-400",
  }[difficulty];

  return (
    <span
      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${cls}`}
    >
      {difficulty}
    </span>
  );
}

/** Standard page wrapper for QC sub-pages */
export function QCPageLayout({
  title,
  children,
  actions,
}: {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 border-b border-zinc-800/60 px-6 py-3 flex items-center justify-between">
        <h2 className="text-[13px] font-medium text-zinc-200">{title}</h2>
        {actions}
      </div>
      <div className="flex-1 overflow-y-auto admin-scroll p-6">{children}</div>
    </div>
  );
}
