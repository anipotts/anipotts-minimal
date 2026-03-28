import {
  Bone,
  SkeletonPage,
  SkeletonProjectRow,
  SkeletonThoughtRow,
} from "@/components/Skeleton";

export default function HomeLoading() {
  return (
    <SkeletonPage prelude="index">
      {/* about */}
      <section className="flex flex-col gap-4">
        <Bone className="h-4 w-12" />
        <div className="flex flex-col gap-8">
          <Bone className="h-5 w-full max-w-2xl" />
          <Bone className="h-5 w-5/6 max-w-2xl" />
        </div>
      </section>

      {/* selected work */}
      <section className="flex flex-col gap-4">
        <Bone className="h-4 w-24" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonProjectRow key={i} />
          ))}
        </div>
      </section>

      {/* latest thoughts */}
      <section className="flex flex-col gap-4">
        <Bone className="h-4 w-28" />
        <div className="flex flex-col divide-y divide-border-subtle">
          {Array.from({ length: 2 }).map((_, i) => (
            <SkeletonThoughtRow key={i} />
          ))}
        </div>
      </section>
    </SkeletonPage>
  );
}
