import { Suspense } from "react";
import { QCPageLayout } from "../components";
import { HealthContent, HealthSkeleton } from "./health-sections";

export const dynamic = "force-dynamic";

export default function HealthPage() {
  return (
    <QCPageLayout title="System Health">
      <Suspense fallback={<HealthSkeleton />}>
        <HealthContent />
      </Suspense>
    </QCPageLayout>
  );
}
