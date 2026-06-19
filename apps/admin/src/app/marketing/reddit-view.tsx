"use client";

import { useState, useCallback } from "react";
import type { QCRedditPost } from "@anipotts/lib/quantercise";
import { searchReddit } from "./actions";
import {
  DEFAULT_REDDIT_KEYWORDS,
  DEFAULT_REDDIT_SUBREDDITS,
  REDDIT_RESPONSE_TEMPLATES,
} from "./marketing-model";
import {
  MarketingError,
  MarketingStatsBar,
  MarketingTemplateRows,
} from "./marketing-ui";
import { useTracking } from "./use-tracking";

type SortKey = "score" | "date" | "comments" | "relevance";

export default function RedditView({ slug }: { slug: string }) {
  const [posts, setPosts] = useState<QCRedditPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subredditFilter, setSubredditFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { tracking, track } = useTracking("admin_reddit_tracking");
  const [searchMeta, setSearchMeta] = useState<{
    subredditsSearched: string[];
    totalFound: number;
  } | null>(null);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await searchReddit(slug, {
        subreddits: DEFAULT_REDDIT_SUBREDDITS,
        keywords: DEFAULT_REDDIT_KEYWORDS,
        days: 7,
        limit: 50,
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setPosts(result.data.posts);
      setSearchMeta({
        subredditsSearched: result.data.searchMeta.subredditsSearched,
        totalFound: result.data.searchMeta.totalFound,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const uniqueSubreddits = [...new Set(posts.map((p) => p.subreddit))].sort();

  const filtered = posts
    .filter((p) => subredditFilter === "all" || p.subreddit === subredditFilter)
    .sort((a, b) => {
      if (sortKey === "relevance") return 0;
      if (sortKey === "score") return b.score - a.score;
      if (sortKey === "comments") return b.num_comments - a.num_comments;
      return b.created_utc - a.created_utc;
    });

  const copyTemplate = async (text: string, postId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(postId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Clipboard API unavailable
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSearch}
            disabled={loading}
            className="admin-pill data-[active]:bg-emerald-500/10 data-[active]:text-emerald-400 px-3 py-1.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50 transition-colors"
          >
            {loading ? "Searching..." : "Search Reddit"}
          </button>
          {searchMeta && (
            <span className="text-[10px] text-zinc-600">
              {searchMeta.subredditsSearched.length} subreddits searched
            </span>
          )}
        </div>
        <MarketingStatsBar found={posts.length} tracking={tracking} />
      </div>

      {error && <MarketingError error={error} />}

      {/* Filters */}
      {posts.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-zinc-600 uppercase tracking-wide">
            Subreddit:
          </span>
          <button
            onClick={() => setSubredditFilter("all")}
            data-active={subredditFilter === "all" ? "" : undefined}
            className={`admin-pill px-2 py-0.5 rounded text-[10px] transition-colors ${
              subredditFilter === "all"
                ? "bg-zinc-700/50 text-zinc-200"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            All ({posts.length})
          </button>
          {uniqueSubreddits.map((sub) => {
            const count = posts.filter((p) => p.subreddit === sub).length;
            return (
              <button
                key={sub}
                onClick={() => setSubredditFilter(sub)}
                className={`admin-pill px-2 py-0.5 rounded text-[10px] transition-colors ${
                  subredditFilter === sub
                    ? "bg-zinc-700/50 text-zinc-200"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                r/{sub} ({count})
              </button>
            );
          })}

          <span className="ml-4 text-[10px] text-zinc-600 uppercase tracking-wide">
            Sort:
          </span>
          {(["relevance", "score", "date", "comments"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setSortKey(key)}
              className={`admin-pill px-2 py-0.5 rounded text-[10px] transition-colors ${
                sortKey === key
                  ? "bg-zinc-700/50 text-zinc-200"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {key}
            </button>
          ))}
        </div>
      )}

      {/* Post Cards */}
      <div className="space-y-2">
        {filtered.map((post) => {
          const isExpanded = expandedId === post.id;
          const isResponded = tracking.responded.includes(post.id);
          const isSaved = tracking.saved.includes(post.id);
          const isSkipped = tracking.skipped.includes(post.id);

          return (
            <div
              key={post.id}
              className={`rounded-lg border bg-zinc-950/50 transition-colors ${
                isResponded
                  ? "border-emerald-500/20"
                  : isSkipped
                    ? "border-zinc-800/30 opacity-60"
                    : "border-zinc-800/60"
              }`}
            >
              {/* Header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : post.id)}
                className="w-full px-4 py-3 text-left flex items-start justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="admin-badge px-1.5 py-0.5 rounded text-[9px] font-medium bg-blue-500/10 text-blue-400">
                      r/{post.subreddit}
                    </span>
                    <span className="text-[10px] text-zinc-600">
                      u/{post.author}
                    </span>
                    <span className="text-[10px] text-zinc-700">
                      {new Date(post.created_utc * 1000).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[12px] text-zinc-200 leading-relaxed truncate">
                    {post.title}
                  </p>
                  {post.selftext && !isExpanded && (
                    <p className="text-[11px] text-zinc-500 mt-1 truncate">
                      {post.selftext.slice(0, 120)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0 text-[10px] text-zinc-500">
                  <span title="Score">{post.score} pts</span>
                  <span title="Comments">{post.num_comments} comments</span>
                  <span className="text-zinc-700">
                    {isExpanded ? "▲" : "▼"}
                  </span>
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-zinc-800/40">
                  {post.selftext && (
                    <p className="text-[11px] text-zinc-400 leading-relaxed mt-3 whitespace-pre-wrap max-h-40 overflow-y-auto admin-scroll">
                      {post.selftext}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3">
                    <a
                      href={`https://reddit.com${post.permalink}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 rounded text-[10px] font-medium bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700/50 transition-colors"
                    >
                      Open on Reddit ↗
                    </a>
                    <button
                      onClick={() => track(post.id, "responded")}
                      className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                        isResponded
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50"
                      }`}
                    >
                      {isResponded ? "Responded ✓" : "Mark Responded"}
                    </button>
                    <button
                      onClick={() => track(post.id, "saved")}
                      className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                        isSaved
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50"
                      }`}
                    >
                      {isSaved ? "Saved ✓" : "Save"}
                    </button>
                    <button
                      onClick={() => track(post.id, "skipped")}
                      className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                        isSkipped
                          ? "bg-zinc-600/20 text-zinc-400"
                          : "bg-zinc-800/50 text-zinc-500 hover:bg-zinc-700/50"
                      }`}
                    >
                      {isSkipped ? "Skipped" : "Skip"}
                    </button>
                  </div>

                  <MarketingTemplateRows
                    heading="Response templates"
                    templates={REDDIT_RESPONSE_TEMPLATES}
                    copiedId={copiedId}
                    getCopyId={(template) => `${post.id}-${template.label}`}
                    onCopy={(template) => {
                      copyTemplate(
                        template.text,
                        `${post.id}-${template.label}`,
                      );
                      track(post.id, "responded");
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {posts.length === 0 && !loading && !error && (
        <p className="text-[12px] text-zinc-600">
          Click &quot;Search Reddit&quot; to find relevant posts.
        </p>
      )}
    </div>
  );
}
