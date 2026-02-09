"use client";

import { useEffect, useState, useMemo, memo } from "react";
import { getAdminContent, getAllAtoms } from "../actions";
import type { Thought, Atom } from "@anipotts/types";
import { FaEye, FaFileAlt, FaAtom, FaChartBar } from "react-icons/fa";

interface Stats {
  totalContent: number;
  totalAtoms: number;
  totalViews: number;
  byStatus: Record<string, number>;
  bySeries: Record<string, number>;
  atomsByPlatform: Record<string, number>;
}

// Memoized stat card for zero re-renders
const StatCard = memo(function StatCard({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: typeof FaFileAlt;
  value: string | number;
  label: string;
  color: string;
}) {
  return (
    <div className="bg-[var(--overlay-5)] border border-[var(--border)] rounded-lg p-4 flex flex-col">
      <Icon className={`w-4 h-4 ${color} mb-2`} />
      <div className="text-2xl font-bold text-[var(--text-primary)]">{value}</div>
      <div className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wide font-medium mt-1">{label}</div>
    </div>
  );
});

// Memoized progress bar
const ProgressBar = memo(function ProgressBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-[var(--text-secondary)] capitalize font-medium">{label}</span>
        <span className="text-[var(--text-tertiary)] font-bold">{count}</span>
      </div>
      <div className="h-2 bg-[var(--input-bg)] rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%`, willChange: "width" }} />
      </div>
    </div>
  );
});

// Status colors lookup
const STATUS_COLORS: Record<string, string> = {
  idea: "bg-blue-400",
  draft: "bg-yellow-400",
  ready: "bg-orange-400",
  atomized: "bg-purple-400",
  published: "bg-green-400",
};

export default memo(function AnalyticsTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [content, setContent] = useState<Thought[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [contentData, atomsData] = await Promise.all([
          getAdminContent(),
          getAllAtoms(),
        ]);
        if (!mounted) return;

        const allContent = contentData || [];
        const allAtoms = atomsData || [];

        const byStatus: Record<string, number> = { idea: 0, draft: 0, ready: 0, atomized: 0, published: 0 };
        const bySeries: Record<string, number> = {};
        const atomsByPlatform: Record<string, number> = {};

        for (const c of allContent) {
          byStatus[c.status || "draft"]++;
          const s = c.series_type || "unassigned";
          bySeries[s] = (bySeries[s] || 0) + 1;
        }
        for (const a of allAtoms) {
          atomsByPlatform[a.platform] = (atomsByPlatform[a.platform] || 0) + 1;
        }

        setContent(allContent);
        setStats({
          totalContent: allContent.length,
          totalAtoms: allAtoms.length,
          totalViews: allContent.reduce((s, c) => s + (c.views || 0), 0),
          byStatus,
          bySeries,
          atomsByPlatform,
        });
      } catch {
        /* silent */
      }
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  // Memoized top content
  const topContent = useMemo(
    () => [...content].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 4),
    [content]
  );

  // Memoized series entries (non-zero only)
  const seriesEntries = useMemo(
    () => Object.entries(stats?.bySeries || {}).filter(([, c]) => c > 0),
    [stats?.bySeries]
  );

  // Memoized platform entries
  const platformEntries = useMemo(
    () => Object.entries(stats?.atomsByPlatform || {}).sort(([, a], [, b]) => b - a),
    [stats?.atomsByPlatform]
  );

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="text-xs text-[var(--text-muted)] animate-pulse">Loading...</span>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="text-xs text-[var(--text-muted)]">Unable to load</span>
      </div>
    );
  }

  return (
    <div className="h-full p-4 grid grid-rows-[auto_1fr] gap-3 overflow-hidden">
      {/* Top row: key metrics */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard icon={FaFileAlt} value={stats.totalContent} label="Content" color="text-blue-400" />
        <StatCard icon={FaAtom} value={stats.totalAtoms} label="Atoms" color="text-purple-400" />
        <StatCard icon={FaEye} value={stats.totalViews.toLocaleString()} label="Views" color="text-green-400" />
        <StatCard icon={FaChartBar} value={stats.totalContent > 0 ? (stats.totalAtoms / stats.totalContent).toFixed(1) : "0"} label="Atoms/Content" color="text-orange-400" />
      </div>

      {/* Main grid: 2x2 */}
      <div className="grid grid-cols-2 grid-rows-2 gap-3 min-h-0">
        {/* By Status */}
        <div className="bg-[var(--overlay-3)] border border-[var(--border)] rounded-lg flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--overlay-5)] shrink-0">
            <span className="text-[15px] font-semibold text-[var(--text-secondary)]">By Status</span>
          </div>
          <div className="flex-1 p-4 flex flex-col justify-center gap-3 overflow-hidden">
            {Object.entries(stats.byStatus).map(([status, count]) => (
              <ProgressBar key={status} label={status} count={count} total={stats.totalContent} color={STATUS_COLORS[status] || "bg-gray-400"} />
            ))}
          </div>
        </div>

        {/* By Series */}
        <div className="bg-[var(--overlay-3)] border border-[var(--border)] rounded-lg flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--overlay-5)] shrink-0">
            <span className="text-[15px] font-semibold text-[var(--text-secondary)]">By Series</span>
          </div>
          <div className="flex-1 p-4 flex flex-col justify-center gap-3 overflow-hidden">
            {seriesEntries.length === 0 ? (
              <span className="text-xs text-[var(--text-muted)] text-center">No series assigned</span>
            ) : (
              seriesEntries.map(([series, count]) => (
                <ProgressBar key={series} label={series} count={count} total={stats.totalContent} color="bg-[var(--accent-400)]" />
              ))
            )}
          </div>
        </div>

        {/* Top Content */}
        <div className="bg-[var(--overlay-3)] border border-[var(--border)] rounded-lg flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--overlay-5)] shrink-0">
            <span className="text-[15px] font-semibold text-[var(--text-secondary)]">Top Content</span>
          </div>
          <div className="flex-1 flex flex-col justify-center divide-y divide-[var(--border)] overflow-hidden">
            {topContent.length === 0 ? (
              <span className="text-xs text-[var(--text-muted)] text-center p-4">No content yet</span>
            ) : (
              topContent.map((item, i) => (
                <div key={item.id} className="px-4 py-3 flex items-center gap-3 hover:bg-[var(--overlay-5)] transition-colors">
                  <span className="text-xs font-bold text-[var(--text-muted)] w-4">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text-primary)] truncate font-medium">{item.title || "Untitled"}</p>
                  </div>
                  <span className="text-xs font-bold text-[var(--accent-400)]">{item.views || 0}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Atoms by Platform */}
        <div className="bg-[var(--overlay-3)] border border-[var(--border)] rounded-lg flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--overlay-5)] shrink-0">
            <span className="text-[15px] font-semibold text-[var(--text-secondary)]">By Platform</span>
          </div>
          <div className="flex-1 p-4 flex flex-wrap items-center justify-center gap-2 content-center overflow-hidden">
            {platformEntries.length === 0 ? (
              <span className="text-xs text-[var(--text-muted)]">No atoms created</span>
            ) : (
              platformEntries.map(([platform, count]) => (
                <div key={platform} className="px-2.5 py-1.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-md text-xs">
                  <span className="text-[var(--text-primary)] font-semibold capitalize">{platform}</span>
                  <span className="text-[var(--text-tertiary)] ml-1.5 font-medium">{count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
