import { Bone } from "@/components/Skeleton";

export default function ThoughtSlugLoading() {
  return (
    <article className="flex flex-col gap-8 py-2 pb-16 max-w-4xl mx-auto w-full">
      {/* back link */}
      <Bone className="h-3 w-28" />

      {/* header */}
      <div className="border-b border-border pb-6 flex flex-col gap-3">
        <Bone className="h-3 w-14" />
        <Bone className="h-10 w-3/4 md:h-12" />
        <div className="flex items-center gap-4">
          <Bone className="h-3 w-32" />
          <Bone className="h-3 w-20" />
        </div>
        <div className="flex gap-2 mt-1">
          <Bone className="h-5 w-12" />
          <Bone className="h-5 w-16" />
          <Bone className="h-5 w-14" />
        </div>
      </div>

      {/* body */}
      <div className="flex flex-col gap-5">
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-11/12" />
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-5/6" />
        <Bone className="h-4 w-0" /> {/* paragraph break */}
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-10/12" />
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-3/4" />
      </div>
    </article>
  );
}
