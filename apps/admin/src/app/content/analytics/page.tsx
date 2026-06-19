import { Suspense } from "react";
import { SectionSkeleton } from "@/components/shared/section";
import {
  InstagramPlaceholder,
  PipelineVelocitySection,
  PostHogPlaceholder,
  SeriesPerformanceSection,
  TypefullyCard,
} from "./analytics-sections";

export const dynamic = "force-dynamic";

export default function ContentAnalyticsPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 border-b border-zinc-800/60 px-6 py-3">
        <h2 className="text-[13px] font-medium text-zinc-200">
          Content Analytics
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto admin-scroll p-6 space-y-4">
        <Suspense fallback={<SectionSkeleton title="Pipeline Velocity" />}>
          <PipelineVelocitySection />
        </Suspense>

        <Suspense fallback={<SectionSkeleton title="Series Performance" />}>
          <SeriesPerformanceSection />
        </Suspense>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Suspense fallback={<SectionSkeleton title="Typefully" />}>
            <TypefullyCard />
          </Suspense>
          <InstagramPlaceholder />
        </div>

        <PostHogPlaceholder />
      </div>
    </div>
  );
}
