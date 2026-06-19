"use client";

import { useMemo, useState } from "react";
import type { MiniProcess, MiniProcesses } from "@anipotts/lib/mini";
import { LiveValue } from "../../components/live-value";
import { Section } from "./live-ops-primitives";

type SortField = "cpu" | "mem" | "command";

export function ProcessSection({
  processes,
  live,
}: {
  processes: MiniProcesses | null;
  live: boolean;
}) {
  const [sortBy, setSortBy] = useState<SortField>("cpu");

  const sorted = useMemo(() => {
    if (!processes || processes.processes.length === 0) return [];
    const list = [...processes.processes];
    list.sort((a: MiniProcess, b: MiniProcess) => {
      if (sortBy === "cpu") return b.cpu - a.cpu;
      if (sortBy === "mem") return b.mem - a.mem;
      return a.command.localeCompare(b.command);
    });
    return list.slice(0, 12);
  }, [processes, sortBy]);

  if (!processes || processes.processes.length === 0) {
    return (
      <Section title="Processes">
        <div className="py-6 text-center">
          <p className="text-[12px] text-zinc-500">No process data</p>
        </div>
      </Section>
    );
  }

  return (
    <Section title={`Processes (${processes.processes.length})`} live={live}>
      <div className="space-y-1">
        <div className="flex items-center text-[10px] text-zinc-600 uppercase tracking-wide px-1 pb-1">
          <span className="flex-1">Command</span>
          <SortButton
            label="CPU%"
            field="cpu"
            current={sortBy}
            onSort={setSortBy}
          />
          <SortButton
            label="MEM%"
            field="mem"
            current={sortBy}
            onSort={setSortBy}
          />
        </div>
        {sorted.map((p: MiniProcess) => (
          <div
            key={`${p.pid}-${p.command}`}
            className="flex items-center gap-2 py-1 px-1 rounded hover:bg-zinc-800/20 text-[11px] font-mono"
          >
            <span className="flex-1 truncate text-zinc-400" title={p.command}>
              {truncateCommand(p.command)}
            </span>
            <span className="w-12 text-right text-zinc-500">
              <LiveValue value={p.cpu.toFixed(1)} />
            </span>
            <span className="w-12 text-right text-zinc-500">
              <LiveValue value={p.mem.toFixed(1)} />
            </span>
          </div>
        ))}
      </div>
    </Section>
  );
}

function SortButton({
  label,
  field,
  current,
  onSort,
}: {
  label: string;
  field: SortField;
  current: SortField;
  onSort: (f: SortField) => void;
}) {
  const isActive = current === field;
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={`w-12 text-right text-[10px] uppercase tracking-wide cursor-pointer ${
        isActive ? "text-[#61AEBA]" : "text-zinc-600 hover:text-zinc-400"
      }`}
    >
      {label}
    </button>
  );
}

function truncateCommand(cmd: string): string {
  const cleaned = cmd.replace(/^\/usr\/(?:local\/)?(?:bin|sbin)\//, "");
  if (cleaned.length <= 40) return cleaned;
  return cleaned.slice(0, 37) + "...";
}

export function ConnectionStatus({ connected }: { connected: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`w-2 h-2 rounded-full ${connected ? "bg-[#61AEBA] animate-pulse" : "bg-zinc-600"}`}
      />
      <span className="text-[11px] text-zinc-500">
        {connected ? "SSE connected" : "SSE disconnected"}
      </span>
    </div>
  );
}
