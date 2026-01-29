"use client";

export function TerminalStatusBar() {
  return (
    <div className="relative border-t border-white/10 bg-white/5 px-4 py-1.5 flex justify-between items-center text-[10px] font-mono text-gray-500 select-none">
      {/* Left side */}
      <div className="flex gap-4">
        <span>NORMAL</span>
        <span>main</span>
        <span>utf-8</span>
      </div>

      {/* Right side */}
      <div className="flex gap-4">
        <span>100%</span>
        <span>ln 1, col 1</span>
      </div>
    </div>
  );
}
