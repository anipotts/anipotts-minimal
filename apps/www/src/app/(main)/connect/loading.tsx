import { PageFrame } from "@/components/page/PageScaffold";
import { Skeleton, SkeletonText } from "@/components/Skeleton";

export default function ConnectLoading() {
  return (
    <PageFrame>
      <section className="flex flex-col gap-5">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-48" />
        <SkeletonText lines={1} className="max-w-3xl" />
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-4 w-28" />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-sm" />
          ))}
        </div>
        <Skeleton className="h-32 w-full rounded-sm" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Skeleton className="h-10 rounded-sm" />
          <Skeleton className="h-10 rounded-sm" />
        </div>
        <Skeleton className="h-10 w-full rounded-sm" />
      </section>
    </PageFrame>
  );
}
