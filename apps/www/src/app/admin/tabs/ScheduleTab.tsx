"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getAllAtoms,
  getAdminContent,
  getTypefullyQueue,
  checkTypefullyConnection,
  scheduleTypefullyDraftAction,
  publishTypefullyDraftAction,
  pushAtomToTypefully,
  getScheduledContent,
} from "../actions";
import type { Atom, Thought, TypefullyDraft, TypefullyQueueSummary } from "@anipotts/types";
import {
  FaCircle,
  FaClock,
  FaCalendarAlt,
  FaExternalLinkAlt,
  FaRocket,
  FaSync,
  FaChevronDown,
  FaChevronRight,
  FaPaperPlane,
  FaArrowUp,
} from "react-icons/fa";

const TYPEFULLY_PLATFORMS = ["twitter", "linkedin", "threads", "bluesky", "mastodon"];

function getPreviewText(draft: TypefullyDraft): string {
  for (const [, config] of Object.entries(draft.platforms || {})) {
    if (config.enabled && config.posts?.length > 0) {
      return config.posts[0].text;
    }
  }
  return "(no content)";
}

function getEnabledPlatforms(draft: TypefullyDraft): string[] {
  return Object.entries(draft.platforms || {})
    .filter(([, config]) => config.enabled)
    .map(([platform]) => platform);
}

function relativeTime(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  const absDiff = Math.abs(diff);
  const isPast = diff < 0;

  if (absDiff < 60_000) return "just now";
  if (absDiff < 3_600_000) {
    const mins = Math.floor(absDiff / 60_000);
    return isPast ? `${mins}m ago` : `in ${mins}m`;
  }
  if (absDiff < 86_400_000) {
    const hrs = Math.floor(absDiff / 3_600_000);
    return isPast ? `${hrs}h ago` : `in ${hrs}h`;
  }
  const days = Math.floor(absDiff / 86_400_000);
  return isPast ? `${days}d ago` : `in ${days}d`;
}

const PLATFORM_LABELS: Record<string, string> = {
  x: "X",
  twitter: "X",
  linkedin: "LI",
  threads: "TH",
  bluesky: "BS",
  mastodon: "MA",
};

const PLATFORM_BADGE_COLORS: Record<string, string> = {
  x: "bg-blue-500/20 text-blue-400",
  twitter: "bg-blue-500/20 text-blue-400",
  linkedin: "bg-blue-600/20 text-blue-500",
  threads: "bg-gray-500/20 text-gray-300",
  bluesky: "bg-sky-500/20 text-sky-400",
  mastodon: "bg-indigo-500/20 text-indigo-400",
};

function PlatformBadge({ platform }: { platform: string }) {
  return (
    <span
      className={`text-[11px] font-semibold px-2.5 py-1 rounded ${
        PLATFORM_BADGE_COLORS[platform] || "bg-gray-500/20 text-gray-400"
      }`}
    >
      {PLATFORM_LABELS[platform] || platform.toUpperCase()}
    </span>
  );
}

export default function ScheduleTab() {
  const [queue, setQueue] = useState<TypefullyQueueSummary | null>(null);
  const [atoms, setAtoms] = useState<Atom[]>([]);
  const [content, setContent] = useState<Thought[]>([]);
  const [scheduledThoughts, setScheduledThoughts] = useState<Thought[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [manualExpanded, setManualExpanded] = useState(false);
  const [expandedDrafts, setExpandedDrafts] = useState<Set<number>>(new Set());
  const [confirmPublish, setConfirmPublish] = useState<number | null>(null);

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const [connResult, queueData, atomsData, contentData, scheduledData] = await Promise.all([
        checkTypefullyConnection(),
        getTypefullyQueue(),
        getAllAtoms(),
        getAdminContent(),
        getScheduledContent(),
      ]);

      setConnected(connResult.connected);
      setConnectionError(connResult.error || null);
      setQueue(queueData);
      setAtoms(atomsData || []);
      setContent(contentData || []);
      setScheduledThoughts(scheduledData || []);
      setLastFetched(new Date());
    } catch (err) {
      console.error("Error fetching schedule data:", err);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const getContentTitle = (contentId: string): string => {
    const item = content.find((c) => c.id === contentId);
    return item?.title || "Unknown";
  };

  const toggleDraft = (id: number) => {
    setExpandedDrafts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleScheduleNextSlot = async (draftId: number) => {
    const result = await scheduleTypefullyDraftAction(draftId, "next-free-slot");
    if (result.success) {
      fetchData(true);
    } else {
      alert(result.error || "Failed to schedule");
    }
  };

  const handlePublishNow = async (draftId: number) => {
    const result = await publishTypefullyDraftAction(draftId);
    if (result.success) {
      setConfirmPublish(null);
      fetchData(true);
    } else {
      alert(result.error || "Failed to publish");
    }
  };

  const handlePushAtom = async (atomId: string) => {
    const result = await pushAtomToTypefully(atomId);
    if (result.success) {
      fetchData(true);
    } else {
      alert(result.error || "Failed to push to Typefully");
    }
  };

  // Categorize drafts and atoms
  const draftItems = queue?.drafts.filter((d) => d.status === "draft") ?? [];
  const scheduledItems = queue?.drafts.filter((d) => d.status === "scheduled") ?? [];

  const pushableAtoms = atoms.filter(
    (a) =>
      a.status === "draft" &&
      TYPEFULLY_PLATFORMS.includes(a.platform) &&
      !a.typefully_draft_id
  );

  const manualAtoms = atoms.filter(
    (a) => a.status === "draft" && !TYPEFULLY_PLATFORMS.includes(a.platform)
  );

  // Group pushable atoms by content
  const atomsByContent = pushableAtoms.reduce<Record<string, Atom[]>>((acc, atom) => {
    const key = atom.content_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(atom);
    return acc;
  }, {});

  // Next scheduled time
  const nextScheduled = scheduledItems[0]?.scheduled_date;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="text-xs text-[var(--text-muted)] animate-pulse">Loading...</span>
      </div>
    );
  }

  return (
    <div className="h-full p-4 flex flex-col gap-3 overflow-y-auto">
      {/* Status Bar */}
      <div className="flex items-center gap-4 flex-wrap bg-[var(--input-bg)] border border-border rounded-lg px-4 py-3">
        {/* Connection */}
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              connected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-xs font-mono text-secondary">
            {connected ? "Connected" : connectionError || "Not Connected"}
          </span>
        </div>

        {/* Separator */}
        <span className="text-faint">|</span>

        {/* Posts meter */}
        {queue && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted">
              {queue.publishedThisMonth}/{queue.monthlyLimit} used
            </span>
            <div className="w-20 h-1.5 bg-input rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  queue.postsRemaining <= 2 ? "bg-red-500" : "bg-accent-400"
                }`}
                style={{
                  width: `${Math.min(100, (queue.publishedThisMonth / queue.monthlyLimit) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Separator */}
        <span className="text-faint">|</span>

        {/* Next scheduled */}
        <span className="text-xs font-mono text-muted">
          Next: {nextScheduled ? relativeTime(nextScheduled) : "none"}
        </span>

        {/* Refresh */}
        <button
          onClick={() => fetchData(true)}
          className="ml-auto flex items-center gap-1.5 text-xs text-muted hover:text-secondary transition-colors"
          disabled={refreshing}
        >
          <FaSync className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
          {lastFetched && (
            <span className="text-[11px] text-faint">
              {lastFetched.toLocaleTimeString("en-US", { hour12: false })}
            </span>
          )}
        </button>
      </div>

      {/* Scheduled Content (from Supabase scheduled_at) */}
      {scheduledThoughts.length > 0 && (
        <div className="bg-[var(--input-bg)] border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-[var(--card-darker)]">
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="w-3 h-3 text-orange-400" />
              <h3 className="text-[15px] font-semibold text-tertiary">
                Scheduled Content
              </h3>
              <span className="text-[11px] text-muted ml-2">
                Auto-publish queue
              </span>
              <span className="ml-auto text-xs font-bold text-muted">
                {scheduledThoughts.length}
              </span>
            </div>
          </div>
          <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto">
            {scheduledThoughts.map((thought) => (
              <div
                key={thought.id}
                className="flex items-center gap-3 px-4 py-3 bg-input border border-orange-500/20 rounded"
              >
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-secondary truncate">
                      {thought.title || "Untitled"}
                    </span>
                    {thought.status && (
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded ${
                        thought.status === "draft" ? "bg-yellow-500/15 text-yellow-300" :
                        thought.status === "ready" ? "bg-orange-500/15 text-orange-400" :
                        "bg-gray-500/15 text-gray-400"
                      }`}>
                        {thought.status}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted truncate mt-0.5">
                    {thought.summary || thought.slug}
                  </p>
                </div>
                <span className="text-[11px] text-orange-400 shrink-0 font-mono">
                  {thought.scheduled_at
                    ? relativeTime(thought.scheduled_at)
                    : "TBD"}
                </span>
                <span className="text-[10px] text-faint shrink-0">
                  {thought.scheduled_at
                    ? new Date(thought.scheduled_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Not Connected Fallback */}
      {!connected && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
          <p className="text-xs text-yellow-400 font-mono">
            Set <code className="bg-input px-1 rounded">TYPEFULLY_API_KEY</code> in{" "}
            <code className="bg-input px-1 rounded">.env.local</code> to enable live
            Typefully integration.
          </p>
        </div>
      )}

      {/* Typefully Drafts */}
      {connected && (
        <div className="bg-[var(--input-bg)] border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-[var(--card-darker)]">
            <div className="flex items-center gap-2">
              <FaRocket className="w-3 h-3 text-accent-400" />
              <h3 className="text-[15px] font-semibold text-tertiary">
                Drafts
              </h3>
              <span className="ml-auto text-xs font-bold text-muted">
                {draftItems.length}
              </span>
            </div>
          </div>
          <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
            {draftItems.length === 0 ? (
              <div className="text-center py-6 text-muted text-xs">
                No unscheduled drafts
              </div>
            ) : (
              draftItems.map((draft) => {
                const preview = getPreviewText(draft);
                const platforms = getEnabledPlatforms(draft);
                const isExpanded = expandedDrafts.has(draft.id);

                return (
                  <div
                    key={draft.id}
                    className="bg-input border border-border-subtle rounded hover:border-accent-400/50 transition-colors"
                  >
                    <div
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                      onClick={() => toggleDraft(draft.id)}
                    >
                      {isExpanded ? (
                        <FaChevronDown className="w-2.5 h-2.5 text-faint" />
                      ) : (
                        <FaChevronRight className="w-2.5 h-2.5 text-faint" />
                      )}
                      <div className="flex items-center gap-1.5">
                        {platforms.map((p) => (
                          <PlatformBadge key={p} platform={p} />
                        ))}
                      </div>
                      <p className="text-[11px] text-muted truncate flex-grow min-w-0">
                        {draft.draft_title || preview.substring(0, 80)}
                      </p>
                      <div className="flex items-center gap-2 ml-2 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleScheduleNextSlot(draft.id);
                          }}
                          className="text-[11px] bg-accent-400/20 text-accent-400 px-2.5 py-1 rounded hover:bg-accent-400/30 transition-colors flex items-center gap-1"
                        >
                          <FaClock className="w-2.5 h-2.5" />
                          Schedule
                        </button>
                        <a
                          href={`https://typefully.com/?d=${draft.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-faint hover:text-muted"
                        >
                          <FaExternalLinkAlt className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="px-3 pb-3 border-t border-border-subtle">
                        <pre className="text-[11px] text-tertiary whitespace-pre-wrap bg-[rgba(var(--overlay-invert),0.3)] rounded p-3 mt-2 max-h-[200px] overflow-y-auto">
                          {preview}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Scheduled */}
      {connected && scheduledItems.length > 0 && (
        <div className="bg-[var(--input-bg)] border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-[var(--card-darker)]">
            <div className="flex items-center gap-2">
              <FaClock className="w-3 h-3 text-blue-400" />
              <h3 className="text-[15px] font-semibold text-tertiary">
                Scheduled
              </h3>
              <span className="ml-auto text-xs font-bold text-muted">
                {scheduledItems.length}
              </span>
            </div>
          </div>
          <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto">
            {scheduledItems.map((draft) => {
              const preview = getPreviewText(draft);
              const platforms = getEnabledPlatforms(draft);

              return (
                <div
                  key={draft.id}
                  className="flex items-center gap-3 px-4 py-3 bg-input border border-blue-500/20 rounded"
                >
                  <div className="flex items-center gap-1.5">
                    {platforms.map((p) => (
                      <PlatformBadge key={p} platform={p} />
                    ))}
                  </div>
                  <p className="text-[11px] text-muted truncate flex-grow min-w-0">
                    {draft.draft_title || preview.substring(0, 60)}
                  </p>
                  <span className="text-[11px] text-blue-400 shrink-0">
                    {draft.scheduled_date
                      ? relativeTime(draft.scheduled_date)
                      : "TBD"}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {confirmPublish === draft.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handlePublishNow(draft.id)}
                          className="text-[11px] bg-green-500/20 text-green-400 px-2.5 py-1 rounded hover:bg-green-500/30"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmPublish(null)}
                          className="text-[11px] bg-red-500/20 text-red-400 px-2.5 py-1 rounded hover:bg-red-500/30"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmPublish(draft.id)}
                        className="text-[11px] bg-green-500/15 text-green-400 px-2.5 py-1 rounded hover:bg-green-500/25 transition-colors flex items-center gap-1"
                      >
                        <FaPaperPlane className="w-2 h-2" />
                        Publish Now
                      </button>
                    )}
                    <a
                      href={`https://typefully.com/?d=${draft.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-faint hover:text-muted"
                    >
                      <FaExternalLinkAlt className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Supabase Atoms Ready to Push */}
      {pushableAtoms.length > 0 && (
        <div className="bg-[var(--input-bg)] border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-[var(--card-darker)]">
            <div className="flex items-center gap-2">
              <FaArrowUp className="w-3 h-3 text-purple-400" />
              <h3 className="text-[15px] font-semibold text-tertiary">
                Ready to Push
              </h3>
              <span className="text-[11px] text-muted ml-2">
                Supabase atoms for Typefully
              </span>
              <span className="ml-auto text-xs font-bold text-muted">
                {pushableAtoms.length}
              </span>
            </div>
          </div>
          <div className="p-4 space-y-4 max-h-[300px] overflow-y-auto">
            {Object.entries(atomsByContent).map(([contentId, groupAtoms]) => (
              <div key={contentId}>
                <div className="text-[11px] text-faint uppercase tracking-wider mb-2">
                  {getContentTitle(contentId)}
                </div>
                <div className="space-y-1.5">
                  {groupAtoms.map((atom) => (
                    <div
                      key={atom.id}
                      className="flex items-center gap-3 px-4 py-3 bg-input border border-border-subtle rounded"
                    >
                      <span className="text-[11px] font-bold text-secondary uppercase">
                        {atom.platform}
                      </span>
                      <p className="text-[11px] text-muted truncate flex-grow min-w-0">
                        {atom.atom_content.substring(0, 60)}...
                      </p>
                      <button
                        onClick={() => handlePushAtom(atom.id)}
                        className="text-[11px] bg-purple-500/20 text-purple-400 px-2.5 py-1 rounded hover:bg-purple-500/30 transition-colors flex items-center gap-1 shrink-0"
                        disabled={!connected}
                      >
                        <FaArrowUp className="w-2 h-2" />
                        Push
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Platforms (collapsible) */}
      {manualAtoms.length > 0 && (
        <div className="bg-[var(--input-bg)] border border-border rounded-lg overflow-hidden">
          <button
            className="w-full px-4 py-3 flex items-center gap-2 bg-[var(--card-darker)] hover:bg-[rgba(var(--overlay-invert),0.3)] transition-colors"
            onClick={() => setManualExpanded(!manualExpanded)}
          >
            {manualExpanded ? (
              <FaChevronDown className="w-2.5 h-2.5 text-faint" />
            ) : (
              <FaChevronRight className="w-2.5 h-2.5 text-faint" />
            )}
            <FaCalendarAlt className="w-3 h-3 text-purple-400" />
            <h3 className="text-[15px] font-semibold text-tertiary">
              Manual Platforms
            </h3>
            <span className="text-[11px] text-muted ml-2">
              TikTok, Instagram, YouTube, etc.
            </span>
            <span className="ml-auto text-xs font-bold text-muted">
              {manualAtoms.length}
            </span>
          </button>
          {manualExpanded && (
            <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto">
              {manualAtoms.map((atom) => (
                <div
                  key={atom.id}
                  className="flex items-center justify-between px-4 py-3 bg-input border border-border-subtle rounded"
                >
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-secondary">
                        {atom.platform.toUpperCase()}
                      </span>
                      <span className="text-[11px] text-faint truncate">
                        {getContentTitle(atom.content_id)}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted truncate mt-1">
                      {atom.atom_content.substring(0, 80)}...
                    </p>
                  </div>
                  <span className="text-[11px] text-faint ml-4">Post manually</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
