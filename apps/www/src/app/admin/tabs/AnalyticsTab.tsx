"use client";

import { useEffect, useState } from "react";
import { getAdminStats, getAdminContent, getAllAtoms } from "../actions";
import type { Thought, Atom } from "@anipotts/types";
import { FaCircle, FaEye, FaFileAlt, FaAtom, FaChartBar } from "react-icons/fa";

interface Stats {
  totalContent: number;
  totalAtoms: number;
  totalViews: number;
  byStatus: Record<string, number>;
  bySeries: Record<string, number>;
  atomsByPlatform: Record<string, number>;
}

export default function AnalyticsTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [content, setContent] = useState<Thought[]>([]);
  const [atoms, setAtoms] = useState<Atom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contentData, atomsData] = await Promise.all([
          getAdminContent(),
          getAllAtoms(),
        ]);

        setContent(contentData || []);
        setAtoms(atomsData || []);

        // Calculate stats
        const allContent = contentData || [];
        const allAtoms = atomsData || [];

        const byStatus: Record<string, number> = {
          idea: 0,
          draft: 0,
          ready: 0,
          atomized: 0,
          published: 0,
        };

        const bySeries: Record<string, number> = {
          "60s-fix": 0,
          "i-tried-it": 0,
          "quick-tip": 0,
          "stack-update": 0,
          "viral-reel": 0,
          unassigned: 0,
        };

        const atomsByPlatform: Record<string, number> = {};

        allContent.forEach((c) => {
          const status = c.status || "draft";
          byStatus[status] = (byStatus[status] || 0) + 1;

          const series = c.series_type || "unassigned";
          bySeries[series] = (bySeries[series] || 0) + 1;
        });

        allAtoms.forEach((a) => {
          atomsByPlatform[a.platform] = (atomsByPlatform[a.platform] || 0) + 1;
        });

        setStats({
          totalContent: allContent.length,
          totalAtoms: allAtoms.length,
          totalViews: allContent.reduce((sum, c) => sum + (c.views || 0), 0),
          byStatus,
          bySeries,
          atomsByPlatform,
        });
      } catch (err) {
        console.error("Error fetching data:", err);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 font-mono text-xs text-muted animate-pulse">
        Loading analytics...
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8 text-muted text-sm">
        Unable to load analytics
      </div>
    );
  }

  // Top performing content
  const topContent = [...content]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <FaCircle className="w-2 h-2 text-accent-400" />
        <h2 className="text-sm font-mono uppercase tracking-widest text-secondary">
          Analytics Dashboard
        </h2>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[rgba(var(--overlay-invert),0.4)] border border-border rounded-lg p-4">
          <FaFileAlt className="w-4 h-4 text-blue-400 mb-2" />
          <div className="text-2xl font-bold text-white">{stats.totalContent}</div>
          <div className="text-xs text-muted uppercase tracking-wider">Content Pieces</div>
        </div>
        <div className="bg-[rgba(var(--overlay-invert),0.4)] border border-border rounded-lg p-4">
          <FaAtom className="w-4 h-4 text-purple-400 mb-2" />
          <div className="text-2xl font-bold text-white">{stats.totalAtoms}</div>
          <div className="text-xs text-muted uppercase tracking-wider">Generated Atoms</div>
        </div>
        <div className="bg-[rgba(var(--overlay-invert),0.4)] border border-border rounded-lg p-4">
          <FaEye className="w-4 h-4 text-green-400 mb-2" />
          <div className="text-2xl font-bold text-white">{stats.totalViews.toLocaleString()}</div>
          <div className="text-xs text-muted uppercase tracking-wider">Total Views</div>
        </div>
        <div className="bg-[rgba(var(--overlay-invert),0.4)] border border-border rounded-lg p-4">
          <FaChartBar className="w-4 h-4 text-orange-400 mb-2" />
          <div className="text-2xl font-bold text-white">
            {stats.totalContent > 0
              ? (stats.totalAtoms / stats.totalContent).toFixed(1)
              : 0}
          </div>
          <div className="text-xs text-muted uppercase tracking-wider">Atoms/Content</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Status */}
        <div className="bg-[rgba(var(--overlay-invert),0.4)] border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-[rgba(var(--overlay-invert),0.2)]">
            <h3 className="text-xs font-mono uppercase tracking-widest text-tertiary">
              Content by Status
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {Object.entries(stats.byStatus).map(([status, count]) => {
              const percentage = stats.totalContent > 0 ? (count / stats.totalContent) * 100 : 0;
              const colors: Record<string, string> = {
                idea: "bg-blue-400",
                draft: "bg-yellow-400",
                ready: "bg-orange-400",
                atomized: "bg-purple-400",
                published: "bg-green-400",
              };
              return (
                <div key={status}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-secondary capitalize">{status}</span>
                    <span className="text-muted">{count}</span>
                  </div>
                  <div className="h-2 bg-input rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colors[status] || "bg-gray-400"}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* By Series */}
        <div className="bg-[rgba(var(--overlay-invert),0.4)] border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-[rgba(var(--overlay-invert),0.2)]">
            <h3 className="text-xs font-mono uppercase tracking-widest text-tertiary">
              Content by Series
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {Object.entries(stats.bySeries)
              .filter(([_, count]) => count > 0)
              .map(([series, count]) => {
                const percentage = stats.totalContent > 0 ? (count / stats.totalContent) * 100 : 0;
                return (
                  <div key={series}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-secondary">{series}</span>
                      <span className="text-muted">{count}</span>
                    </div>
                    <div className="h-2 bg-input rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent-400"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Top Performing Content */}
        <div className="bg-[rgba(var(--overlay-invert),0.4)] border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-[rgba(var(--overlay-invert),0.2)]">
            <h3 className="text-xs font-mono uppercase tracking-widest text-tertiary">
              Top Performing Content
            </h3>
          </div>
          <div className="divide-y divide-border">
            {topContent.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted">
                No content yet
              </div>
            ) : (
              topContent.map((item, i) => (
                <div key={item.id} className="px-4 py-3 flex items-center gap-3">
                  <span className="text-xs font-bold text-faint w-4">{i + 1}</span>
                  <div className="flex-grow min-w-0">
                    <p className="text-xs text-secondary truncate">{item.title || "Untitled"}</p>
                    <p className="text-[10px] text-faint">{item.series_type || "unassigned"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-accent-400">{item.views || 0}</p>
                    <p className="text-[10px] text-faint">views</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Atoms by Platform */}
        <div className="bg-[rgba(var(--overlay-invert),0.4)] border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-[rgba(var(--overlay-invert),0.2)]">
            <h3 className="text-xs font-mono uppercase tracking-widest text-tertiary">
              Atoms by Platform
            </h3>
          </div>
          <div className="p-4">
            {Object.keys(stats.atomsByPlatform).length === 0 ? (
              <div className="text-center text-xs text-muted py-4">
                No atoms generated yet
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.atomsByPlatform)
                  .sort(([, a], [, b]) => b - a)
                  .map(([platform, count]) => (
                    <div
                      key={platform}
                      className="px-3 py-2 bg-input border border-border rounded text-xs"
                    >
                      <span className="text-secondary font-bold">{platform}</span>
                      <span className="text-muted ml-2">{count}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Weekly Targets */}
      <div className="bg-[rgba(var(--overlay-invert),0.4)] border border-border rounded-lg p-4">
        <h3 className="text-xs font-mono uppercase tracking-widest text-tertiary mb-3">
          Weekly Targets
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-secondary">4-5</div>
            <div className="text-[10px] text-muted">Original Pieces</div>
          </div>
          <div>
            <div className="text-lg font-bold text-secondary">15-25</div>
            <div className="text-[10px] text-muted">Total Atoms</div>
          </div>
          <div>
            <div className="text-lg font-bold text-secondary">2</div>
            <div className="text-[10px] text-muted">60s Fix Videos</div>
          </div>
          <div>
            <div className="text-lg font-bold text-secondary">1</div>
            <div className="text-[10px] text-muted">I Tried It Deep Dive</div>
          </div>
        </div>
      </div>
    </div>
  );
}
