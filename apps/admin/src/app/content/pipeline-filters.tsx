"use client";

import { useRouter, useSearchParams } from "next/navigation";

const STATUSES = ["all", "draft", "ready", "atomized", "published"] as const;
const SERIES = [
  "all",
  "tip",
  "news",
  "tutorial",
  "essay",
  "behind-the-scenes",
] as const;

export default function PipelineFilters({
  currentStatus,
  currentSeries,
  currentView = "list",
  statusCounts,
}: {
  currentStatus: string;
  currentSeries: string;
  currentView?: string;
  statusCounts: Record<string, number>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    const defaults: Record<string, string> = { view: "list" };
    if (value === "all" || value === defaults[key]) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/content?${params.toString()}`);
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          defaultValue={searchParams.get("q") || ""}
          onChange={(e) => {
            const params = new URLSearchParams(searchParams.toString());
            if (e.target.value) {
              params.set("q", e.target.value);
            } else {
              params.delete("q");
            }
            router.push(`/content?${params.toString()}`);
          }}
          placeholder="Search..."
          className="flex-1 rounded-md px-3 py-1.5 text-[12px] text-zinc-200 admin-input"
        />
        <select
          value={searchParams.get("sort") || "updated"}
          onChange={(e) =>
            setFilter(
              "sort",
              e.target.value === "updated" ? "all" : e.target.value,
            )
          }
          className="rounded-md px-2 py-1.5 text-[12px] text-zinc-400 admin-input"
        >
          <option value="updated">Updated</option>
          <option value="created">Created</option>
          <option value="views">Views</option>
          <option value="title">Title</option>
        </select>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter("status", s)}
            data-active={currentStatus === s}
            className="admin-pill"
          >
            {s === "all" ? "All" : s}
            {s !== "all" && statusCounts[s] ? ` ${statusCounts[s]}` : ""}
          </button>
        ))}
        <span className="w-px h-3 bg-zinc-800 mx-1" />
        {SERIES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter("series", s)}
            data-active={currentSeries === s}
            className="admin-pill"
          >
            {s === "all" ? "All" : s}
          </button>
        ))}

        <span className="ml-auto" />
        <span className="w-px h-3 bg-zinc-800 mx-1" />
        <button
          onClick={() => setFilter("view", "list")}
          data-active={currentView === "list"}
          className="admin-pill"
          title="List view"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            className="inline-block"
          >
            <path
              d="M2 4h12M2 8h12M2 12h12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <button
          onClick={() => setFilter("view", "board")}
          data-active={currentView === "board"}
          className="admin-pill"
          title="Board view"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            className="inline-block"
          >
            <rect
              x="1"
              y="2"
              width="4"
              height="12"
              rx="1"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <rect
              x="6"
              y="2"
              width="4"
              height="8"
              rx="1"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <rect
              x="11"
              y="2"
              width="4"
              height="10"
              rx="1"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
