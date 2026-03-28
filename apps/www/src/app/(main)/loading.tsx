import { PageFrame } from "@/components/page/PageScaffold";
import { Skeleton, SkeletonText } from "@/components/Skeleton";

export default function Loading() {
  return (
    <PageFrame>
      <section className="flex flex-col gap-5">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-10 w-3/4" />
        <SkeletonText lines={2} className="max-w-3xl" />
      </section>

      <section className="flex flex-col gap-4">
        <Skeleton className="h-4 w-16" />
        <div className="flex flex-col gap-5 md:gap-6">
          <SkeletonText lines={2} />
          <SkeletonText lines={2} />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <Skeleton className="h-4 w-28" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="border-l-2 border-border pl-4 py-3">
              <Skeleton className="h-4 w-48 mb-1" />
              <Skeleton className="h-3 w-64" />
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <Skeleton className="h-4 w-32" />
        <div className="flex flex-col divide-y divide-border-subtle">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="py-5 first:pt-0 last:pb-0 flex flex-col gap-2"
            >
              <Skeleton className="h-6 w-2/3" />
              <SkeletonText lines={2} />
            </div>
          ))}
        </div>
      </section>
    </PageFrame>
  );
}
