"use client";

import { TerminalHeaderTitle } from "../window";

interface TerminalHeaderProps {
  defaultTitle?: string;
  version?: string;
}

function StaticWindowControls() {
  return (
    <div className="flex gap-1.5" aria-hidden="true">
      <span className="w-3 h-3 rounded-full bg-red-500/25 border border-red-500/45" />
      <span className="w-3 h-3 rounded-full bg-yellow-500/25 border border-yellow-500/45" />
      <span className="w-3 h-3 rounded-full bg-green-500/25 border border-green-500/45" />
    </div>
  );
}

export function TerminalHeader({ defaultTitle, version = "3.0.1" }: TerminalHeaderProps) {
  return (
    <div className="terminal-header flex items-center justify-between px-4 py-2 bg-input border-b border-border-subtle select-none">
      <div className="flex items-center gap-2">
        <StaticWindowControls />
        <TerminalHeaderTitle defaultTitle={defaultTitle} />
      </div>
      <div className="text-[10px] md:text-xs text-faint font-mono">
        zsh<span className="hidden md:inline"> &bull; v{version}</span>
      </div>
    </div>
  );
}
