export function Section({
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

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-zinc-800/40 ${className}`} />
  );
}

export function SectionSkeleton({ title }: { title: string }) {
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
