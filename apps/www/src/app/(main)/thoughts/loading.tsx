import { PageFrame } from "@/components/page/PageScaffold";
import { Skeleton, SkeletonText } from "@/components/Skeleton";

export default function ThoughtsLoading() {
  return (
    <PageFrame>
      <section className="flex flex-col gap-5">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-3/4" />
        <SkeletonText lines={2} className="max-w-3xl" />
      </section>

      <section className="flex flex-col gap-4">
        <Skeleton className="h-10 w-full max-w-md rounded-sm" />

        <div className="flex flex-col divide-y divide-border-subtle">
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className="py-5 md:py-6 first:pt-0 last:pb-0 flex flex-col gap-2"
            >
              <div className="flex flex-col md:flex-row md:justify-between gap-1">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-3 w-32" />
              </div>
              <SkeletonText lines={2} />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-14 rounded-sm" />
                <Skeleton className="h-5 w-14 rounded-sm" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </PageFrame>
  );
}
