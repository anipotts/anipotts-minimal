import { Suspense } from "react";
import { QCDashboardContent } from "./dashboard-content";
import { DashboardSkeleton } from "./dashboard-skeleton";

export const dynamic = "force-dynamic";

export default function QuantercisePage() {
  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 border-b border-zinc-800/60 px-6 py-3">
        <h2 className="text-[13px] font-medium text-zinc-200">Quantercise</h2>
      </div>
      <div className="flex-1 overflow-y-auto admin-scroll p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Suspense fallback={<DashboardSkeleton />}>
            <QCDashboardContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
