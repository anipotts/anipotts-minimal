import { Suspense } from "react";
import { QCPageLayout, PanelSkeleton } from "../../components";
import { UserDetailContent } from "./user-detail-content";

export const dynamic = "force-dynamic";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  return (
    <QCPageLayout title="User Detail">
      <Suspense
        fallback={
          <div className="space-y-4">
            <PanelSkeleton title="Profile" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PanelSkeleton title="Subscription" />
              <PanelSkeleton title="Stats" />
            </div>
          </div>
        }
      >
        <UserDetailContent userId={userId} />
      </Suspense>
    </QCPageLayout>
  );
}
