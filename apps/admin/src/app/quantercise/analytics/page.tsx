import { Suspense } from "react";
import { QCPageLayout, PanelSkeleton } from "../components";
import { AnalyticsContent } from "./analytics-content";

export const dynamic = "force-dynamic";

export default function AnalyticsPage() {
  return (
    <QCPageLayout title="Analytics">
      <Suspense
        fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <PanelSkeleton title="Overview" />
            <PanelSkeleton title="Active Users" />
            <PanelSkeleton title="Subscriptions" />
            <PanelSkeleton title="Submissions" />
          </div>
        }
      >
        <AnalyticsContent />
      </Suspense>
    </QCPageLayout>
  );
}
