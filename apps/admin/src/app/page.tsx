export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 border-b border-zinc-800/60 px-6 py-3">
        <h2 className="text-[13px] font-medium text-zinc-200">Dashboard</h2>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-zinc-500 text-sm">
            All spokes summary coming in Session 5.
          </p>
          <p className="text-zinc-600 text-xs">
            Health dots, quick stats, next deadline countdown.
          </p>
        </div>
      </div>
    </div>
  );
}
