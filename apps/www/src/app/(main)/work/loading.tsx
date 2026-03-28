import { Bone, SkeletonPage, SkeletonProjectRow } from "@/components/Skeleton";

export default function WorkLoading() {
  return (
    <SkeletonPage prelude="work">
      <section className="flex flex-col gap-4">
        <Bone className="h-4 w-14" />
        <div className="flex flex-col gap-8">
          {/* category pills */}
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Bone key={i} className="h-8 w-16 rounded-sm" />
            ))}
          </div>

          {/* period group */}
          <div className="flex flex-col gap-4">
            <Bone className="h-3 w-20 border-b border-border pb-2" />
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonProjectRow key={i} />
            ))}
          </div>

          {/* second period group */}
          <div className="flex flex-col gap-4">
            <Bone className="h-3 w-16 border-b border-border pb-2" />
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonProjectRow key={i} />
            ))}
          </div>
        </div>
      </section>
    </SkeletonPage>
  );
}
