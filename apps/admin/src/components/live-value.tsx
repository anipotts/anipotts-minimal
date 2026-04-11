"use client";

/**
 * LiveValue: renders a value with a brief brand-color flash when it changes.
 * Uses CSS animation triggered by key change (React remounts the span).
 * No useState, no useEffect. Lint-clean.
 */
export function LiveValue({
  value,
  className = "",
}: {
  value: string | number;
  className?: string;
}) {
  return (
    <span
      key={String(value)}
      className={`font-mono animate-flash-brand ${className}`}
    >
      {value}
    </span>
  );
}
