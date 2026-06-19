import { getQCAnalytics } from "@anipotts/lib/quantercise";
import type { QCAnalytics } from "@anipotts/lib/quantercise";
import { getQCEnv, ErrorPanel } from "../components";
import { AnalyticsPanels } from "./analytics-sections";

export async function AnalyticsContent() {
  let data: QCAnalytics;

  try {
    const res = await getQCAnalytics(getQCEnv());
    data = res.analytics;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return <ErrorPanel title="Analytics" message={msg} />;
  }

  return <AnalyticsPanels data={data} />;
}
