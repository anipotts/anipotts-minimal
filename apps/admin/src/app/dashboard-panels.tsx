import Link from "next/link";
import type { ReactNode } from "react";

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
  children: ReactNode;
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

export function AdminIndexPanel() {
  const links = [
    { label: "writing", href: "/content", meta: "pipeline" },
    { label: "new post", href: "/quick", meta: "draft" },
    { label: "newsletter", href: "/subscribers", meta: "buttondown" },
    { label: "money", href: "/money", meta: "mercury" },
  ];

  return (
    <PanelShell title="Admin index">
      <div className="grid gap-2 sm:grid-cols-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-md border border-zinc-800/50 px-3 py-2 transition-colors hover:border-zinc-700 hover:bg-zinc-900/70"
          >
            <span className="block text-[12px] font-medium text-zinc-200">
              {link.label}
            </span>
            <span className="mt-1 block text-[10px] text-zinc-600">
              {link.meta}
            </span>
          </Link>
        ))}
      </div>
    </PanelShell>
  );
}

export function HealthDot({ status }: { status: "up" | "down" | "unknown" }) {
  const color =
    status === "up"
      ? "bg-emerald-400"
      : status === "down"
        ? "bg-red-400"
        : "bg-amber-400";
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${color}`} />;
}
