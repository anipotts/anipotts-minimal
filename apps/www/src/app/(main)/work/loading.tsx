import { PageFrame } from "@/components/page/PageScaffold";
import { Skeleton, SkeletonText } from "@/components/Skeleton";

export default function WorkLoading() {
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
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-8 w-16 rounded-sm" />
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="border-l-2 border-border pl-4 py-3">
                <Skeleton className="h-4 w-48 mb-1" />
                <Skeleton className="h-3 w-64" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageFrame>
  );
}
