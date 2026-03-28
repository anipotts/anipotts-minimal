import { PageFrame } from "@/components/page/PageScaffold";
import { Skeleton, SkeletonText } from "@/components/Skeleton";

export default function ProjectDetailLoading() {
  return (
    <PageFrame>
      <Skeleton className="h-3 w-28" />

      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-12 rounded" />
        </div>
        <Skeleton className="h-5 w-96 max-w-full" />
        <Skeleton className="h-3 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-sm" />
          <Skeleton className="h-5 w-16 rounded-sm" />
          <Skeleton className="h-5 w-16 rounded-sm" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-28" />
        </div>
      </section>

      <section className="flex flex-col gap-4 md:gap-5">
        <Skeleton className="h-4 w-20" />
        <SkeletonText lines={3} />
      </section>

      <section className="flex flex-col gap-4 md:gap-5">
        <Skeleton className="h-4 w-20" />
        <div className="flex flex-col gap-5">
          <div className="border-l border-border pl-4">
            <Skeleton className="h-4 w-40 mb-2" />
            <SkeletonText lines={2} />
          </div>
          <div className="border-l border-border pl-4">
            <Skeleton className="h-4 w-36 mb-2" />
            <SkeletonText lines={2} />
          </div>
        </div>
      </section>
    </PageFrame>
  );
}
