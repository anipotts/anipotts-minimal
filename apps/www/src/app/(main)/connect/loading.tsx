import { Bone, SkeletonPage } from "@/components/Skeleton";

export default function ConnectLoading() {
  return (
    <SkeletonPage prelude="connect">
      {/* social links */}
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Bone key={i} className="h-4 w-28" />
        ))}
      </div>

      {/* newsletter */}
      <section className="flex flex-col gap-3">
        <Bone className="h-4 w-32" />
        <Bone className="h-4 w-64" />
        <div className="flex flex-col sm:flex-row gap-2">
          <Bone className="h-10 flex-1 rounded-sm" />
          <Bone className="h-10 w-24 rounded-sm" />
        </div>
      </section>

      {/* contact form */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Bone key={i} className="h-8 w-20 rounded-sm" />
          ))}
        </div>
        <Bone className="h-32 w-full rounded-sm" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Bone className="h-10 rounded-sm" />
          <Bone className="h-10 rounded-sm" />
        </div>
        <Bone className="h-10 w-full rounded-sm" />
      </section>
    </SkeletonPage>
  );
}
