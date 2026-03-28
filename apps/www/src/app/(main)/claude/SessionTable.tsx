"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { formatDuration } from "./format";

interface SessionRow {
  start: string;
  durationMinutes: number;
  toolCalls: number;
  filesMutated: number;
  project: string;
}

type SortKey = "start" | "durationMinutes" | "toolCalls" | "filesMutated";
type SortDirection = "asc" | "desc";

interface SessionTableProps {
  sessions: SessionRow[];
  timezone: string;
}

function formatRelative(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMin = Math.round((now - then) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.round(diffHr / 24);
  return `${diffDays}d ago`;
}

function intensityClass(toolCalls: number): string {
  if (toolCalls >= 200) return "bg-accent-400/40";
  if (toolCalls >= 100) return "bg-accent-400/30";
  if (toolCalls >= 50) return "bg-accent-400/20";
  if (toolCalls >= 10) return "bg-accent-400/10";
  return "bg-accent-400/5";
}

export function SessionTable({ sessions, timezone }: SessionTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("start");
  const [direction, setDirection] = useState<SortDirection>("desc");

  const filtered = useMemo(
    () => sessions.filter((s) => s.toolCalls > 0 || s.durationMinutes > 0),
    [sessions],
  );

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      if (sortKey === "start") {
        return direction === "asc"
          ? new Date(a.start).getTime() - new Date(b.start).getTime()
          : new Date(b.start).getTime() - new Date(a.start).getTime();
      }
      const left = a[sortKey];
      const right = b[sortKey];
      return direction === "asc" ? left - right : right - left;
    });
    return copy;
  }, [filtered, sortKey, direction]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setDirection("desc");
    }
  };

  const sortIndicator = (key: SortKey) =>
    sortKey === key ? (
      <span className="text-accent-400">{direction === "asc" ? "▲" : "▼"}</span>
    ) : null;

  const maxTools = Math.max(...filtered.map((s) => s.toolCalls), 1);

  if (filtered.length === 0) {
    return (
      <p className="text-muted text-sm font-mono py-8 text-center">
        no recent sessions
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Sort controls */}
      <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.16em] font-mono">
        {(
          [
            ["start", "recent"],
            ["durationMinutes", "duration"],
            ["toolCalls", "intensity"],
            ["filesMutated", "files"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => toggleSort(key)}
            className={clsx(
              "px-2 py-1 rounded-sm border transition-colors",
              sortKey === key
                ? "border-accent-400/30 text-accent-400 bg-accent-400/10"
                : "border-border-subtle text-muted hover:text-secondary hover:border-overlay-30",
            )}
          >
            {label} {sortIndicator(key)}
          </button>
        ))}
      </div>

      {/* Session cards */}
      <div className="flex flex-col gap-1.5">
        {sorted.map((session, i) => {
          const barWidth = Math.max(2, (session.toolCalls / maxTools) * 100);

          return (
            <div
              key={`${session.start}-${i}`}
              className="group relative rounded-md overflow-hidden border border-border-subtle/50 hover:border-accent-400/20 transition-colors"
            >
              {/* Intensity bar background */}
              <div
                className={clsx(
                  "absolute inset-y-0 left-0 transition-all",
                  intensityClass(session.toolCalls),
                )}
                style={{ width: `${barWidth}%` }}
              />

              {/* Content */}
              <div className="relative flex items-center gap-4 px-4 py-3">
                {/* Project + time */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-secondary truncate">
                      {session.project}
                    </span>
                    <span className="text-[10px] text-faint font-mono shrink-0">
                      {formatRelative(session.start)}
                    </span>
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-4 shrink-0 text-xs font-mono">
                  <span
                    className={clsx(
                      "tabular-nums",
                      session.durationMinutes > 10
                        ? "text-accent-400"
                        : "text-tertiary",
                    )}
                  >
                    {formatDuration(session.durationMinutes)}
                  </span>
                  <span
                    className={clsx(
                      "tabular-nums",
                      session.toolCalls >= 100
                        ? "text-accent-400"
                        : "text-tertiary",
                    )}
                  >
                    {session.toolCalls.toLocaleString()}
                    <span className="text-faint ml-0.5 hidden sm:inline">
                      calls
                    </span>
                  </span>
                  {session.filesMutated > 0 && (
                    <span className="tabular-nums text-tertiary">
                      {session.filesMutated}
                      <span className="text-faint ml-0.5 hidden sm:inline">
                        files
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-faint font-mono text-right">
        {filtered.length} sessions shown · {timezone}
      </p>
    </div>
  );
}
