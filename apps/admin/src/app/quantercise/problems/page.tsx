import { Suspense } from "react";
import { QCPageLayout, PanelSkeleton } from "../components";
import { ProblemsContent } from "./problems-content";

export const dynamic = "force-dynamic";

export default async function ProblemsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    difficulty?: string;
    offset?: string;
  }>;
}) {
  const params = await searchParams;
  const offset = params.offset ? parseInt(params.offset, 10) : undefined;

  return (
    <QCPageLayout title="Problems">
      <Suspense fallback={<PanelSkeleton title="Problems" />}>
        <ProblemsContent
          search={params.search}
          difficulty={params.difficulty}
          offset={offset}
        />
      </Suspense>
    </QCPageLayout>
  );
}
