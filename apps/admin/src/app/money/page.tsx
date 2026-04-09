export default function MoneyPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 border-b border-zinc-800/60 px-6 py-3">
        <h2 className="text-[13px] font-medium text-zinc-200">Money</h2>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-zinc-500 text-sm">
            Mercury, deals, deadlines, domains, ventures.
          </p>
          <p className="text-zinc-600 text-xs">Coming in Session 5.</p>
        </div>
      </div>
    </div>
  );
}
