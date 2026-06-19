import { Suspense } from "react";
import { AdminIndexPanel, PanelSkeleton } from "./dashboard-panels";
import {
  ContentPanel,
  DeadlinePanel,
  DealsPanel,
  HealthPanel,
  LiveDashboardWrapper,
  MercuryPanel,
  SiteCopyPanel,
} from "./dashboard-sections";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const renderedAt = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 border-b border-zinc-800/60 px-4 py-3 flex items-baseline justify-between sm:px-6">
        <h2 className="text-[13px] font-medium text-zinc-200">Site</h2>
        <span className="text-[10px] text-zinc-600">{renderedAt}</span>
      </div>
      <div className="flex-1 overflow-y-auto admin-scroll p-4 space-y-5 sm:p-6">
        <Suspense fallback={<PanelSkeleton title="Site copy" />}>
          <SiteCopyPanel />
        </Suspense>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AdminIndexPanel />
          <Suspense fallback={<PanelSkeleton title="Health" />}>
            <HealthPanel />
          </Suspense>
          <Suspense fallback={<PanelSkeleton title="Mercury" />}>
            <MercuryPanel />
          </Suspense>
          <Suspense fallback={<PanelSkeleton title="Next Deadline" />}>
            <DeadlinePanel />
          </Suspense>
          <Suspense fallback={<PanelSkeleton title="Deals" />}>
            <DealsPanel />
          </Suspense>
          <Suspense fallback={<PanelSkeleton title="Content" />}>
            <ContentPanel />
          </Suspense>
        </div>
        <Suspense
          fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PanelSkeleton title="Rudy" />
              <PanelSkeleton title="CC Sessions" />
            </div>
          }
        >
          <LiveDashboardWrapper />
        </Suspense>
      </div>
    </div>
  );
}
