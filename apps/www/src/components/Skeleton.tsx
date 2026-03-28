import clsx from "clsx";
import { PageFrame, PagePrelude } from "@/components/page/PageScaffold";

/** A single pulsing placeholder bar */
export function Bone({ className }: { className?: string }) {
  return (
    <div
      className={clsx("animate-pulse rounded-sm bg-overlay-10", className)}
    />
  );
}

/** Variable-width text placeholder lines */
export function SkeletonText({
  lines = 1,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  const widths = ["w-full", "w-5/6", "w-4/6", "w-3/4", "w-2/3"];
  return (
    <div className={clsx("flex flex-col gap-2.5", className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Bone key={i} className={clsx("h-4", widths[i % widths.length])} />
      ))}
    </div>
  );
}

/** Matches the standard page header: prelude + title + summary */
export function SkeletonPageHeader({ prelude }: { prelude?: string }) {
  return (
    <section className="flex flex-col gap-5">
      {prelude ? (
        <PagePrelude>{prelude}</PagePrelude>
      ) : (
        <Bone className="h-4 w-16" />
      )}
      <Bone className="h-10 w-3/4 md:h-12" />
      <Bone className="h-5 w-2/3 max-w-lg" />
    </section>
  );
}

/** Mirrors ProjectCard collapsed state: details > summary with [+] icon, title, subtitle, year */
export function SkeletonProjectRow() {
  return (
    <article className="w-full">
      <div className="border-l-2 border-border pl-4 pr-4 py-3">
        <div className="flex justify-between items-start gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 font-mono text-sm">
              <span className="text-muted">[+]</span>
              <Bone className="h-4 w-40" />
            </div>
            <div className="pl-6">
              <Bone className="h-3 w-56" />
            </div>
          </div>
          <Bone className="h-3 w-12 shrink-0" />
        </div>
      </div>
    </article>
  );
}

/** A row that looks like a thought link */
export function SkeletonThoughtRow() {
  return (
    <div className="py-7 first:pt-0 last:pb-0">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-baseline">
        <div className="md:col-span-2 flex flex-col gap-3">
          <Bone className="h-7 w-3/4" />
          <Bone className="h-4 w-full" />
          <div className="flex gap-2 mt-1">
            <Bone className="h-5 w-14" />
            <Bone className="h-5 w-16" />
          </div>
        </div>
        <div className="md:text-right">
          <Bone className="h-3 w-28 md:ml-auto" />
        </div>
      </div>
    </div>
  );
}

/** A stat card skeleton */
export function SkeletonStatCard() {
  return (
    <div className="border border-border-subtle rounded-md bg-overlay-5 p-4">
      <Bone className="h-2.5 w-16" />
      <Bone className="h-7 w-20 mt-2" />
    </div>
  );
}

/** Wraps skeletons in the standard page frame */
export function SkeletonPage({
  prelude,
  children,
}: {
  prelude?: string;
  children: React.ReactNode;
}) {
  return (
    <PageFrame>
      <SkeletonPageHeader prelude={prelude} />
      {children}
    </PageFrame>
  );
}
