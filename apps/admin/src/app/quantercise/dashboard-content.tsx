import { getQCDashboard } from "@anipotts/lib/quantercise";
import type { QCDashboard } from "@anipotts/lib/quantercise";
import { ErrorPanel, getQCEnv } from "./components";
import {
  ActivityPanel,
  AlertsPanel,
  ContentStatsPanel,
  LastUpdatedPanel,
  MetricsPanel,
  QuickStatsPanel,
} from "./dashboard-panels";

export async function QCDashboardContent() {
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
