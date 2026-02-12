"use client";

import { useEffect, useRef } from "react";
import type { OutputLine } from "./types";

function renderContent(content: string, baseClass: string) {
  // Parse inline accent markers: \x1b[accent]...\x1b[/accent]
  if (content.includes("\x1b[accent]")) {
    const parts = content.split(/\x1b\[accent\](.*?)\x1b\[\/accent\]/g);
    return (
      <span className={baseClass}>
        {parts.map((part, i) =>
          i % 2 === 1 ? (
            <span key={i} className="text-[var(--accent-400)]">{part}</span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  }
  return <span className={baseClass}>{content}</span>;
}

function getLineClass(type: OutputLine["type"]): string {
  switch (type) {
    case "input":
      return "text-[var(--text-secondary)]";
    case "error":
      return "text-red-400";
    case "success":
      return "text-green-400";
    case "accent":
      return "text-[var(--accent-400)]";
    case "system":
      return "text-[var(--text-muted)]";
    case "output":
    default:
      return "text-[var(--text-muted)]";
  }
}

export function TerminalOutput({ lines }: { lines: OutputLine[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-3 py-2 font-mono text-xs leading-5 select-text"
    >
      {lines.map((line) => (
        <div key={line.id} className="whitespace-pre-wrap break-all">
          {renderContent(line.content, getLineClass(line.type))}
        </div>
      ))}
    </div>
  );
}
