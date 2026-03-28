import { Bone } from "@/components/Skeleton";

export default function ProjectSlugLoading() {
  return (
    <div className="flex flex-col gap-14 pb-20 max-w-4xl mx-auto w-full">
      {/* header */}
      <section className="flex flex-col gap-5">
        <Bone className="h-3 w-24" />
        <div className="flex items-center gap-3">
          <Bone className="h-10 w-2/3 md:h-12" />
          <Bone className="h-5 w-10 rounded" />
        </div>
        <Bone className="h-5 w-3/4" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Bone key={i} className="h-5 w-16" />
          ))}
        </div>
        <div className="flex gap-4">
          <Bone className="h-3 w-28" />
          <Bone className="h-3 w-24" />
        </div>
      </section>

      {/* overview */}
      <section className="flex flex-col gap-4">
        <Bone className="h-3 w-16" />
        <Bone className="h-5 w-full" />
        <Bone className="h-5 w-5/6" />
        <Bone className="h-5 w-11/12" />
      </section>

      {/* technical */}
      <section className="flex flex-col gap-4">
        <Bone className="h-3 w-16" />
        <div className="flex flex-col gap-5">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="border-l border-border pl-4 flex flex-col gap-2"
            >
              <Bone className="h-4 w-40" />
              <Bone className="h-3 w-full" />
              <Bone className="h-3 w-4/5" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
