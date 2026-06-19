import { PanelSkeleton } from "./components";

export function DashboardSkeleton() {
  return (
    <>
      <PanelSkeleton title="Key Metrics" />
      <PanelSkeleton title="Alerts" />
      <PanelSkeleton title="Quick Stats" />
      <PanelSkeleton title="Recent Activity" />
      <PanelSkeleton title="Content Pipeline" />
      <PanelSkeleton title="Last Updated" />
    </>
  );
}
