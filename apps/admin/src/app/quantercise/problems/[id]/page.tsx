import { Suspense } from "react";
import { QCPageLayout, PanelSkeleton } from "../../components";
import { ProblemDetailContent } from "./problem-detail-content";

export const dynamic = "force-dynamic";

export default async function ProblemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <QCPageLayout title="Problem Detail">
      <Suspense
        fallback={
          <div className="space-y-4">
            <PanelSkeleton title="Overview" />
            <PanelSkeleton title="Body" />
          </div>
        }
      >
        <ProblemDetailContent id={id} />
      </Suspense>
    </QCPageLayout>
  );
}
