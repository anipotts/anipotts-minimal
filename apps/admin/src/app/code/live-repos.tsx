"use client";

import { useState, useMemo, useCallback } from "react";
import { useMiniStream } from "@anipotts/lib/mini/stream";
import type {
  MiniRepos,
  MiniRepoStatus,
  MiniSessions,
} from "@anipotts/lib/mini";
import { LiveValue } from "../../components/live-value";

type SortKey = "name" | "dirty" | "unpushed";

interface InitialCodeData {
  repos: MiniRepos | null;
  sessions: MiniSessions | null;
}

function Section({
  title,
  live,
  children,
}: {
  title: string;
  live?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-zinc-800/60 bg-zinc-950/50">
      <div className="px-4 py-2.5 border-b border-zinc-800/40 flex items-center gap-2">
        <h3 className="text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
          {title}
        </h3>
        {live && (
          <span className="w-1.5 h-1.5 rounded-full bg-[#61AEBA] animate-pulse" />
        )}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function sortRepos(repos: MiniRepoStatus[], sortBy: SortKey): MiniRepoStatus[] {
  return [...repos].sort((a, b) => {
    switch (sortBy) {
      case "dirty":
        // dirty first, then by name
        if (a.dirty !== b.dirty) return a.dirty ? -1 : 1;
        return a.name.localeCompare(b.name);
      case "unpushed":
        // most unpushed first, then by name
        if (a.unpushed_count !== b.unpushed_count)
          return b.unpushed_count - a.unpushed_count;
        return a.name.localeCompare(b.name);
      case "name":
      default:
        return a.name.localeCompare(b.name);
    }
  });
}

function SortHeader({
  label,
  sortKey,
  activeSortKey,
  onSort,
  className = "",
}: {
  label: string;
  sortKey: SortKey;
  activeSortKey: SortKey;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const isActive = sortKey === activeSortKey;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={`${className} cursor-pointer select-none transition-colors ${isActive ? "text-zinc-300" : "text-zinc-500 hover:text-zinc-400"}`}
    >
      {label}
      {isActive && <span className="ml-0.5 text-[8px]">&#9660;</span>}
    </button>
  );
}

function ReposSection({
  repos,
  live,
}: {
  repos: MiniRepos | null;
  live: boolean;
}) {
  const [sortBy, setSortBy] = useState<SortKey>("dirty");

  const handleSort = useCallback((key: SortKey) => {
    setSortBy(key);
  }, []);

  const sorted = useMemo(
    () => (repos ? sortRepos(repos.repos, sortBy) : []),
    [repos, sortBy],
  );

  if (!repos || repos.repos.length === 0) {
    return (
      <Section title="Repos">
        <div className="py-6 text-center">
          <p className="text-[12px] text-zinc-500">Mini offline</p>
        </div>
      </Section>
    );
  }

  const dirtyCount = repos.repos.filter((r) => r.dirty).length;

  return (
    <Section title={`Repos (${repos.repos.length})`} live={live}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-3">
          {dirtyCount > 0 && (
            <span className="text-[11px] text-amber-400 font-mono">
              {dirtyCount} dirty
            </span>
          )}
        </div>
      </div>
      <div className="admin-row text-[10px] uppercase tracking-wide border-b border-zinc-800/40">
        <SortHeader
          label="Repo"
          sortKey="name"
          activeSortKey={sortBy}
          onSort={handleSort}
          className="flex-1 text-left"
        />
        <SortHeader
          label="Status"
          sortKey="dirty"
          activeSortKey={sortBy}
          onSort={handleSort}
          className="w-14 text-center"
        />
        <SortHeader
          label="Unpushed"
          sortKey="unpushed"
          activeSortKey={sortBy}
          onSort={handleSort}
          className="w-16 text-right"
        />
        <div className="w-24 text-right text-zinc-500">Last commit</div>
      </div>
      {sorted.map((r) => (
        <div key={r.name} className="admin-row text-[12px]">
          <div className="flex-1 min-w-0">
            <div className="text-zinc-200 font-medium font-mono">{r.name}</div>
            {r.last_commit?.message && (
              <div className="text-[10px] text-zinc-600 truncate max-w-[280px]">
                {r.last_commit.message}
              </div>
            )}
          </div>
          <div className="w-14 flex justify-center">
            {r.dirty && (
              <span className="admin-badge bg-amber-950/40 text-amber-400 border border-amber-900/30">
                dirty
              </span>
            )}
          </div>
          <div className="w-16 text-right text-zinc-500 font-mono">
            {r.unpushed_count > 0 && (
              <LiveValue
                value={`${r.unpushed_count}`}
                className="text-amber-400"
              />
            )}
          </div>
          <div className="w-24 text-right text-[10px] text-zinc-600 font-mono">
            {r.last_commit?.date?.split(" ")[0]}
          </div>
        </div>
      ))}
    </Section>
  );
}

function SessionsSection({
  sessions,
  live,
}: {
  sessions: MiniSessions | null;
  live: boolean;
}) {
  if (!sessions || !sessions.available) {
    return (
      <Section title="CC Analytics">
        <div className="py-6 text-center">
          <p className="text-[12px] text-zinc-500">
            {sessions?.reason || "mine.db unavailable"}
          </p>
        </div>
      </Section>
    );
  }

  return (
    <Section title="CC Analytics" live={live}>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Today", data: sessions.today },
          { label: "7d", data: sessions.last_7d },
          { label: "30d", data: sessions.last_30d },
        ].map(
          ({ label, data }) =>
            data && (
              <div key={label} className="text-center space-y-1">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wide">
                  {label}
                </div>
                <div className="text-[14px] font-medium text-zinc-200 font-mono">
                  <LiveValue value={data.sessions} />
                </div>
                <div className="text-[10px] text-zinc-600 font-mono">
                  {data.tool_calls.toLocaleString()} tools
                </div>
              </div>
            ),
        )}
      </div>
    </Section>
  );
}

export default function LiveCodeSections({
  initial,
}: {
  initial: InitialCodeData;
}) {
  const stream = useMiniStream();
  const repos = stream.repos ?? initial.repos;
  const sessions = stream.sessions ?? initial.sessions;
  const isLive = stream.connected;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`w-2 h-2 rounded-full ${isLive ? "bg-[#61AEBA] animate-pulse" : "bg-zinc-600"}`}
        />
        <span className="text-[11px] text-zinc-500">
          {isLive ? "Live" : "Cached"}
        </span>
      </div>
      <ReposSection repos={repos} live={isLive} />
      <SessionsSection sessions={sessions} live={isLive} />
    </div>
  );
}
