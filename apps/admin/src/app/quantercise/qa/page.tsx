import { Suspense } from "react";
import { QCPageLayout, PanelSkeleton } from "../components";
import { QAContent } from "./qa-content";

export const dynamic = "force-dynamic";

export default async function QAPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; difficulty?: string }>;
}) {
  const params = await searchParams;
  return (
    <QCPageLayout title="QA Review">
      <Suspense
        fallback={
          <div className="space-y-4">
            <PanelSkeleton title="Review Progress" />
            <PanelSkeleton title="Problems" />
          </div>
        }
      >
        <QAContent status={params.status} difficulty={params.difficulty} />
      </Suspense>
    </QCPageLayout>
  );
}
