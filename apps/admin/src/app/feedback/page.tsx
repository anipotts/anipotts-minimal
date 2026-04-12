export const dynamic = "force-dynamic";

export default function FeedbackPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 border-b border-zinc-800/60 px-6 py-3">
        <h2 className="text-[13px] font-medium text-zinc-200">Feedback</h2>
      </div>
      <div className="flex-1 overflow-y-auto admin-scroll p-6">
        <div className="rounded-lg border border-zinc-800/60 bg-zinc-950/50 p-6">
          <p className="text-[12px] text-zinc-500">
            Multi-source feedback aggregation coming in Phase 4.
          </p>
        </div>
      </div>
    </div>
  );
}
