import { PageFrame } from "@/components/page/PageScaffold";
import { Skeleton, SkeletonCard, SkeletonText } from "@/components/Skeleton";

export default function ClaudeLoading() {
  return (
    <PageFrame>
      <section className="flex flex-col gap-5">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-3/4" />
        <SkeletonText lines={2} className="max-w-3xl" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Array.from({ length: 5 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <Skeleton className="h-3 w-48" />
      </section>

      <section className="flex flex-col gap-4">
        <Skeleton className="h-4 w-40" />
        <SkeletonText lines={2} className="max-w-3xl" />
        <div className="flex flex-col gap-5 md:gap-6">
          <div className="border border-border-subtle rounded-md bg-overlay-5 p-4 md:p-5">
            <Skeleton className="h-3 w-40 mb-4" />
            <Skeleton className="h-48 w-full rounded" />
          </div>
          <div className="border border-border-subtle rounded-md bg-overlay-5 p-4 md:p-5">
            <Skeleton className="h-3 w-36 mb-4" />
            <div className="flex flex-col gap-3">
              <Skeleton className="h-6 w-full" />
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
            </div>
          </div>
        </div>
      </section>
    </PageFrame>
  );
}
