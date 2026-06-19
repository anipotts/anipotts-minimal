import { Suspense } from "react";
import { QCPageLayout, PanelSkeleton } from "../components";
import { UsersContent } from "./users-content";

export const dynamic = "force-dynamic";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  return (
    <QCPageLayout title="Users">
      <Suspense fallback={<PanelSkeleton title="Users" />}>
        <UsersContent search={params.search} />
      </Suspense>
    </QCPageLayout>
  );
}
