import { Suspense } from "react";
import { SectionSkeleton } from "@/components/shared/section";
import {
  ClaudeMonSection,
  DeploymentsSection,
  GitHubSection,
  LiveCodeWrapper,
  NpmSection,
  PackageVersionsSection,
  VercelPlaceholder,
} from "./code-sections";

export const dynamic = "force-dynamic";

export default function CodePage() {
  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 border-b border-zinc-800/60 px-6 py-3">
        <h2 className="text-[13px] font-medium text-zinc-200">Code</h2>
      </div>
      <div className="flex-1 overflow-y-auto admin-scroll p-6 space-y-4">
        <Suspense
          fallback={
            <div className="space-y-4">
              <SectionSkeleton title="Repos" />
              <SectionSkeleton title="CC Analytics" />
            </div>
          }
        >
          <LiveCodeWrapper />
        </Suspense>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Suspense fallback={<SectionSkeleton title="Deployments" />}>
            <DeploymentsSection />
          </Suspense>
          <Suspense fallback={<SectionSkeleton title="npm Packages" />}>
            <NpmSection />
          </Suspense>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Suspense fallback={<SectionSkeleton title="ClaudeMon" />}>
            <ClaudeMonSection />
          </Suspense>
          <Suspense fallback={<SectionSkeleton title="Package Versions" />}>
            <PackageVersionsSection />
          </Suspense>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Suspense fallback={<SectionSkeleton title="GitHub" />}>
            <GitHubSection />
          </Suspense>
          <VercelPlaceholder />
        </div>
      </div>
    </div>
  );
}
