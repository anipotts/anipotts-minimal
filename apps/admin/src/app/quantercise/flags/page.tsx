import { Suspense } from "react";
import { QCPageLayout, PanelSkeleton } from "../components";
import { FlagsContent } from "./flags-content";

export const dynamic = "force-dynamic";

export default function FlagsPage() {
  return (
    <QCPageLayout title="Feature Flags">
      <Suspense
        fallback={
          <div className="space-y-4">
            <PanelSkeleton title="Feature Flags" />
            <PanelSkeleton title="Feature Flags" />
          </div>
        }
      >
        <FlagsContent />
      </Suspense>
    </QCPageLayout>
  );
}
