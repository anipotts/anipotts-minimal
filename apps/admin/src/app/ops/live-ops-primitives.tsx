import type { ReactNode } from "react";

export function Section({
  title,
  live,
  children,
}: {
  title: string;
  live?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-zinc-800/60 bg-zinc-950/50">
      <div className="px-4 py-2.5 border-b border-zinc-800/40 flex items-center gap-2">
        <h3 className="text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
          {title}
        </h3>
        {live && (
          <span className="w-1.5 h-1.5 rounded-full bg-[#61AEBA] animate-pulse" />
        )}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function PlaceholderSection({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <section className="rounded-lg border border-zinc-800/30 bg-zinc-950/30">
      <div className="px-4 py-2.5 border-b border-zinc-800/20 flex items-center gap-2">
        <h3 className="text-[11px] font-medium tracking-wide text-zinc-600 uppercase">
          {title}
        </h3>
      </div>
      <div className="p-4">
        <p className="text-[11px] text-zinc-600 italic">{message}</p>
      </div>
    </section>
  );
}

export function StatusDot({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-block w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-400" : "bg-zinc-500"}`}
    />
  );
}

export function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
