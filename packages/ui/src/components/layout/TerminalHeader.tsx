"use client";

import { SITE_VERSION } from "@anipotts/lib/data";
import { WindowControls } from "../window";
import { TerminalHeaderTitle } from "../window";

interface TerminalHeaderProps {
  defaultTitle?: string;
}

export function TerminalHeader({ defaultTitle }: TerminalHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-input border-b border-border-subtle select-none">
      <div className="flex items-center gap-2">
        <WindowControls />
        <TerminalHeaderTitle defaultTitle={defaultTitle} />
      </div>
      <div className="text-[10px] md:text-xs text-faint font-mono">
        zsh<span className="hidden md:inline"> &bull; v{SITE_VERSION}</span>
      </div>
    </div>
  );
}
