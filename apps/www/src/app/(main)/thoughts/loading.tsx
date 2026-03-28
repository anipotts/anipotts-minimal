import { Bone, SkeletonPage, SkeletonThoughtRow } from "@/components/Skeleton";

export default function ThoughtsLoading() {
  return (
    <SkeletonPage prelude="thoughts">
      <section className="flex flex-col gap-4">
        {/* search bar skeleton */}
        <Bone className="h-10 w-full rounded-sm" />

        {/* thought list */}
        <div className="flex flex-col divide-y divide-border-subtle">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonThoughtRow key={i} />
          ))}
        </div>
      </section>
    </SkeletonPage>
  );
}
