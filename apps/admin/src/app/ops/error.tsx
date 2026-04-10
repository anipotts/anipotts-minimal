"use client";

export default function OpsError({ reset }: { reset: () => void }) {
  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 border-b border-zinc-800/60 px-6 py-3">
        <h2 className="text-[13px] font-medium text-zinc-200">Ops</h2>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-[13px] text-red-400">Failed to load ops data.</p>
          <button
            onClick={reset}
            className="text-[12px] text-zinc-400 hover:text-zinc-200 underline"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}
