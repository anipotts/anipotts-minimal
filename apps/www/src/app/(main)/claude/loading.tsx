import { Bone, SkeletonPage, SkeletonStatCard } from "@/components/Skeleton";

export default function ClaudeLoading() {
  return (
    <SkeletonPage prelude="claude">
      {/* stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      {/* leaderboard */}
      <section className="flex flex-col gap-4">
        <Bone className="h-4 w-36" />
        <Bone className="h-5 w-2/3 max-w-lg" />
        <div className="border border-border-subtle rounded-md bg-overlay-5 p-4">
          <Bone className="h-48 w-full" />
        </div>
        <div className="border border-border-subtle rounded-md bg-overlay-5 p-4">
          <Bone className="h-64 w-full" />
        </div>
      </section>

      {/* burst records */}
      <section className="flex flex-col gap-4">
        <Bone className="h-4 w-24" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="border border-border-subtle rounded-md bg-overlay-5 p-4 flex flex-col gap-2"
            >
              <Bone className="h-2.5 w-28" />
              <Bone className="h-6 w-32" />
              <Bone className="h-3 w-40 mt-1" />
            </div>
          ))}
        </div>
      </section>
    </SkeletonPage>
  );
}
