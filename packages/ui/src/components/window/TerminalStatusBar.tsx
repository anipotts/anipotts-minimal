"use client";

import { ThemeToggle } from "./ThemeToggle";

export function TerminalStatusBar() {
  return (
    <div className="relative border-t border-border bg-input px-4 py-1.5 flex justify-between items-center text-[10px] font-mono text-muted select-none">
      {/* Left side */}
      <div className="flex gap-4">
        <span>NORMAL</span>
        <span>main</span>
        <span>utf-8</span>
      </div>

      {/* Right side */}
      <div className="flex gap-4">
        <ThemeToggle />
        <span>100%</span>
        <span>ln 1, col 1</span>
      </div>
    </div>
  );
}
