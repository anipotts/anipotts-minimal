import { Suspense } from "react";
import { getQCDashboard } from "@anipotts/lib/quantercise";
import type { QCDashboard } from "@anipotts/lib/quantercise";
import { getQCEnv, PanelSkeleton, ErrorPanel } from "./components";
import {
  ActivityPanel,
  AlertsPanel,
  ContentStatsPanel,
  LastUpdatedPanel,
  MetricsPanel,
  QuickStatsPanel,
} from "./dashboard-panels";

export const dynamic = "force-dynamic";

async function QCDashboardContent() {
  const env = getQCEnv();

  let data: QCDashboard;
  try {
    data = await getQCDashboard(env);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return (
      <div className="col-span-full">
        <ErrorPanel
          title="Quantercise"
          message={msg}
          hint="Check QUANTERCISE_ADMIN_TOKEN and QUANTERCISE_BASE_URL secrets."
        />
      </div>
    );
  }

  return (
    <>
      <MetricsPanel data={data} />
      <AlertsPanel data={data} />
      <QuickStatsPanel data={data} />
      <ActivityPanel data={data} />
      <ContentStatsPanel data={data} />
      <LastUpdatedPanel timestamp={data.lastUpdated} />
    </>
  );
}

export default function QuantercisePage() {
  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 border-b border-zinc-800/60 px-6 py-3">
        <h2 className="text-[13px] font-medium text-zinc-200">Quantercise</h2>
      </div>
      <div className="flex-1 overflow-y-auto admin-scroll p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Suspense
            fallback={
              <>
                <PanelSkeleton title="Key Metrics" />
                <PanelSkeleton title="Alerts" />
                <PanelSkeleton title="Quick Stats" />
                <PanelSkeleton title="Recent Activity" />
                <PanelSkeleton title="Content Pipeline" />
                <PanelSkeleton title="Last Updated" />
              </>
            }
          >
            <QCDashboardContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
