import type { QCAnalytics } from "@anipotts/lib/quantercise";
import { DAUChart } from "./analytics-activity-chart";
import {
  ActiveUsersPanel,
  OverviewPanel,
  SubscriptionPanel,
  SubmissionsPanel,
} from "./analytics-summary-panels";

export function AnalyticsPanels({ data }: { data: QCAnalytics }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <OverviewPanel data={data} />
      <ActiveUsersPanel data={data} />
      <SubscriptionPanel data={data} />
      <SubmissionsPanel data={data} />
      <div className="md:col-span-2">
        <DAUChart data={data} />
      </div>
    </div>
  );
}
