export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-emerald-950/40 text-emerald-400 border-emerald-900/30",
    negotiating: "bg-amber-950/40 text-amber-400 border-amber-900/30",
    complete: "bg-blue-950/40 text-blue-400 border-blue-900/30",
    declined: "bg-zinc-800/40 text-zinc-500 border-zinc-700/30",
    ghosted: "bg-red-950/40 text-red-400 border-red-900/30",
    pipeline: "bg-indigo-950/40 text-indigo-400 border-indigo-900/30",
    pending: "bg-amber-950/40 text-amber-400 border-amber-900/30",
    paid: "bg-emerald-950/40 text-emerald-400 border-emerald-900/30",
    incoming: "bg-emerald-950/40 text-emerald-400 border-emerald-900/30",
    planned: "bg-zinc-800/40 text-zinc-500 border-zinc-700/30",
    "not-started": "bg-zinc-800/40 text-zinc-500 border-zinc-700/30",
  };
  const cls =
    colors[status] || "bg-zinc-800/40 text-zinc-400 border-zinc-700/30";
  return <span className={`admin-badge border ${cls}`}>{status}</span>;
}

export const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
