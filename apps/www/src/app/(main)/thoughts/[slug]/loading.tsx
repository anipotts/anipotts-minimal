import { PageFrame } from "@/components/page/PageScaffold";
import { Skeleton, SkeletonText } from "@/components/Skeleton";

export default function ThoughtDetailLoading() {
  return (
    <PageFrame>
      <Skeleton className="h-3 w-32" />

      <section className="flex flex-col gap-4">
        <Skeleton className="h-4 w-16" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-2/3" />
        </div>
        <Skeleton className="h-3 w-56" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-14 rounded-sm" />
          <Skeleton className="h-5 w-14 rounded-sm" />
          <Skeleton className="h-5 w-14 rounded-sm" />
        </div>
      </section>

      <div className="flex flex-col gap-4">
        <SkeletonText lines={4} />
        <Skeleton className="h-px w-full bg-border-subtle" />
        <SkeletonText lines={5} />
        <Skeleton className="h-px w-full bg-border-subtle" />
        <SkeletonText lines={3} />
      </div>
    </PageFrame>
  );
}
