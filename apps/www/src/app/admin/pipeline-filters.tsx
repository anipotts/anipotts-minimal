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
  statusCounts,
}: {
  currentStatus: string;
  currentSeries: string;
  statusCounts: Record<string, number>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/?${params.toString()}`);
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
            router.push(`/?${params.toString()}`);
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
      </div>
    </div>
  );
}
