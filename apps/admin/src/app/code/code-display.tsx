export function StatCard({
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

export function DeploymentDot({ status }: { status: string }) {
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

export function shortCount(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}
