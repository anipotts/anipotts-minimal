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

type SortKey =
  | "start"
  | "durationMinutes"
  | "toolCalls"
  | "filesMutated"
  | "project";

type SortDirection = "asc" | "desc";

interface SessionTableProps {
  sessions: SessionRow[];
  timezone: string;
}

function formatDate(value: string, timeZone: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function SessionTable({ sessions, timezone }: SessionTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("start");
  const [direction, setDirection] = useState<SortDirection>("desc");

  const sorted = useMemo(() => {
    const copy = [...sessions];
    copy.sort((a, b) => {
      const left = a[sortKey];
      const right = b[sortKey];

      if (sortKey === "start") {
        const leftDate = new Date(left).getTime();
        const rightDate = new Date(right).getTime();
        return direction === "asc" ? leftDate - rightDate : rightDate - leftDate;
      }

      if (typeof left === "number" && typeof right === "number") {
        return direction === "asc" ? left - right : right - left;
      }

      return direction === "asc"
        ? String(left).localeCompare(String(right))
        : String(right).localeCompare(String(left));
    });
    return copy;
  }, [sessions, sortKey, direction]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setDirection(direction === "asc" ? "desc" : "asc");
      return;
    }
    setSortKey(key);
    setDirection(key === "project" ? "asc" : "desc");
  };

  const headerButton = (label: string, key: SortKey) => (
    <button
      type="button"
      onClick={() => toggleSort(key)}
      className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted hover:text-secondary"
    >
      {label}
      <span
        className={clsx(
          "text-[9px]",
          sortKey === key ? "text-accent-400" : "text-muted",
        )}
      >
        {sortKey === key ? (direction === "asc" ? "▲" : "▼") : "↕"}
      </span>
    </button>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="text-left border-b border-border-subtle">
            <th className="pb-3 pr-4">{headerButton("date", "start")}</th>
            <th className="pb-3 pr-4">{headerButton("duration", "durationMinutes")}</th>
            <th className="pb-3 pr-4">{headerButton("tool calls", "toolCalls")}</th>
            <th className="pb-3 pr-4">{headerButton("files", "filesMutated")}</th>
            <th className="pb-3">{headerButton("project", "project")}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((session, index) => (
            <tr
              key={`${session.start}-${index}`}
              className="border-b border-border-subtle text-tertiary"
            >
              <td className="py-3 pr-4 text-secondary font-mono text-xs">
                {formatDate(session.start, timezone)}
              </td>
              <td className="py-3 pr-4 text-xs font-mono">
                {formatDuration(session.durationMinutes)}
              </td>
              <td className="py-3 pr-4 text-xs font-mono">
                {session.toolCalls.toLocaleString()}
              </td>
              <td className="py-3 pr-4 text-xs font-mono">
                {session.filesMutated.toLocaleString()}
              </td>
              <td className="py-3 text-xs font-mono text-secondary">
                {session.project}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
