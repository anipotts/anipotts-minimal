import { PanelSkeleton } from "../components";

export function HealthSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <PanelSkeleton title="Services" />
        <PanelSkeleton title="System Metrics" />
        <PanelSkeleton title="Rate Limiting" />
      </div>
      <PanelSkeleton title="Failed Events" />
    </div>
  );
}
