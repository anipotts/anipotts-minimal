"use client";

import { useState, useCallback } from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="text-[10px] uppercase tracking-wider text-muted hover:text-accent-400 transition-colors px-1.5 py-0.5 border border-border-subtle rounded hover:border-accent-400/30 min-h-[28px]"
      aria-label="Copy to clipboard"
    >
      {copied ? "copied!" : "copy"}
    </button>
  );
}
