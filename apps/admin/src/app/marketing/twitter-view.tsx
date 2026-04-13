"use client";

import { useState, useCallback } from "react";
import type { QCTweet } from "@anipotts/lib/quantercise";
import { searchTwitter } from "./actions";
import { useTracking } from "./use-tracking";

const RESPONSE_TEMPLATES = [
  {
    label: "Mental Math Practice",
    text: "If you're drilling mental math for quant interviews, check out quantercise.com. Timed problems across difficulty levels, designed for speed under pressure.",
  },
  {
    label: "Quant Interview Prep",
    text: "For quant prep, daily timed practice > cramming. quantercise.com has adaptive problem sets covering probability, estimation, mental math, and logic.",
  },
  {
    label: "Looking for Resources",
    text: "Adding quantercise.com to the list. Focuses on quantitative reasoning and mental math with timed drills that adapt to your level. Free tier available.",
  },
  {
    label: "Specific Firm Interview",
    text: "The mental math round is usually the first filter. quantercise.com has drills designed for exactly that kind of speed + accuracy test.",
  },
  {
    label: "Generic",
    text: "Worth checking out quantercise.com for quant reasoning practice. Timed drills, adaptive difficulty, built around how these skills actually get tested.",
  },
] as const;

export default function TwitterView({
  twitterConfigured,
  slug,
}: {
  twitterConfigured: boolean;
  slug: string;
}) {
  const [tweets, setTweets] = useState<QCTweet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [composerText, setComposerText] = useState("");
  const [activeComposerId, setActiveComposerId] = useState<string | null>(null);
  const { tracking, track } = useTracking("admin_twitter_tracking");
  const [resultCount, setResultCount] = useState(0);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await searchTwitter(slug, { days: 7, limit: 50 });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setTweets(result.data.tweets);
      setResultCount(result.data.searchMeta.resultCount);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const copyText = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Clipboard API unavailable
    }
  };

  if (!twitterConfigured) {
    return (
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
        <p className="text-[12px] text-amber-400 font-medium">
          Twitter API not configured
        </p>
        <p className="text-[11px] text-zinc-500 mt-1">
          Set TWITTER_BEARER_TOKEN on the Quantercise backend to enable Twitter
          search. Reddit search works without any additional configuration.
        </p>
      </div>
    );
  }

  const statsBar = (
    <div className="flex items-center gap-4 text-[10px] text-zinc-500">
      <span>
        Found: <span className="text-zinc-300">{tweets.length}</span>
      </span>
      <span>
        Responded:{" "}
        <span className="text-emerald-400">{tracking.responded.length}</span>
      </span>
      <span>
        Saved: <span className="text-blue-400">{tracking.saved.length}</span>
      </span>
      <span>
        Skipped:{" "}
        <span className="text-zinc-400">{tracking.skipped.length}</span>
      </span>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSearch}
            disabled={loading}
            className="admin-pill px-3 py-1.5 rounded text-[11px] font-medium bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 disabled:opacity-50 transition-colors"
          >
            {loading ? "Searching..." : "Search Twitter/X"}
          </button>
          {resultCount > 0 && (
            <span className="text-[10px] text-zinc-600">
              {resultCount} results from API
            </span>
          )}
        </div>
        {statsBar}
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
          <p className="text-[11px] text-red-400">{error}</p>
        </div>
      )}

      {/* Tweet Cards */}
      <div className="space-y-2">
        {tweets.map((tweet) => {
          const isExpanded = expandedId === tweet.id;
          const isResponded = tracking.responded.includes(tweet.id);
          const isSaved = tracking.saved.includes(tweet.id);
          const isSkipped = tracking.skipped.includes(tweet.id);
          const showComposer = activeComposerId === tweet.id;

          return (
            <div
              key={tweet.id}
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
                onClick={() => setExpandedId(isExpanded ? null : tweet.id)}
                className="w-full px-4 py-3 text-left"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  {tweet.author && (
                    <>
                      <span className="text-[11px] font-medium text-zinc-200">
                        {tweet.author.name}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        @{tweet.author.username}
                      </span>
                    </>
                  )}
                  <span className="text-[10px] text-zinc-700">
                    {new Date(tweet.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-[12px] text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {tweet.text}
                </p>
                <div className="flex items-center gap-4 mt-2 text-[10px] text-zinc-500">
                  <span>{tweet.public_metrics.like_count} likes</span>
                  <span>{tweet.public_metrics.retweet_count} retweets</span>
                  <span>{tweet.public_metrics.reply_count} replies</span>
                  <span className="ml-auto text-zinc-700">
                    {isExpanded ? "▲" : "▼"}
                  </span>
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-zinc-800/40">
                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3">
                    <a
                      href={`https://twitter.com/i/web/status/${encodeURIComponent(tweet.id)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 rounded text-[10px] font-medium bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700/50 transition-colors"
                    >
                      Open on X ↗
                    </a>
                    <button
                      onClick={() => {
                        if (!showComposer) setComposerText("");
                        setActiveComposerId(showComposer ? null : tweet.id);
                      }}
                      className="px-2 py-1 rounded text-[10px] font-medium bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-colors"
                    >
                      {showComposer ? "Hide Composer" : "Compose Reply"}
                    </button>
                    <button
                      onClick={() => track(tweet.id, "responded")}
                      className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                        isResponded
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50"
                      }`}
                    >
                      {isResponded ? "Responded ✓" : "Mark Responded"}
                    </button>
                    <button
                      onClick={() => track(tweet.id, "saved")}
                      className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                        isSaved
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50"
                      }`}
                    >
                      {isSaved ? "Saved ✓" : "Save"}
                    </button>
                    <button
                      onClick={() => track(tweet.id, "skipped")}
                      className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                        isSkipped
                          ? "bg-zinc-600/20 text-zinc-400"
                          : "bg-zinc-800/50 text-zinc-500 hover:bg-zinc-700/50"
                      }`}
                    >
                      {isSkipped ? "Skipped" : "Skip"}
                    </button>
                  </div>

                  {/* Composer */}
                  {showComposer && (
                    <div className="mt-3 space-y-2 rounded border border-zinc-800/40 bg-zinc-900/50 p-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] text-zinc-600 uppercase tracking-wide">
                          Templates:
                        </span>
                        {RESPONSE_TEMPLATES.map((tpl) => (
                          <button
                            key={tpl.label}
                            onClick={() => setComposerText(tpl.text)}
                            className="px-2 py-0.5 rounded text-[9px] font-medium bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 transition-colors"
                          >
                            {tpl.label}
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={composerText}
                        onChange={(e) =>
                          setComposerText(e.target.value.slice(0, 280))
                        }
                        rows={4}
                        className="admin-input w-full rounded border border-zinc-800/60 bg-zinc-950/80 px-3 py-2 text-[11px] text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
                        placeholder="Compose your reply..."
                      />
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] ${composerText.length > 260 ? "text-amber-400" : "text-zinc-600"}`}
                        >
                          {composerText.length}/280
                        </span>
                        <button
                          onClick={() => {
                            copyText(composerText, `composer-${tweet.id}`);
                            track(tweet.id, "responded");
                          }}
                          disabled={!composerText}
                          className="px-3 py-1 rounded text-[10px] font-medium bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 disabled:opacity-40 transition-colors"
                        >
                          {copiedId === `composer-${tweet.id}`
                            ? "Copied!"
                            : "Copy to Clipboard"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Quick Templates (when composer is hidden) */}
                  {!showComposer && (
                    <div className="mt-3 space-y-1.5">
                      <span className="text-[10px] text-zinc-600 uppercase tracking-wide">
                        Quick copy templates
                      </span>
                      {RESPONSE_TEMPLATES.map((tpl) => (
                        <div
                          key={tpl.label}
                          className="flex items-start justify-between gap-2 rounded border border-zinc-800/40 bg-zinc-900/50 p-2"
                        >
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-medium text-zinc-400">
                              {tpl.label}
                            </span>
                            <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">
                              {tpl.text}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              copyText(tpl.text, `${tweet.id}-${tpl.label}`);
                              track(tweet.id, "responded");
                            }}
                            className="shrink-0 px-2 py-1 rounded text-[10px] font-medium bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 transition-colors"
                          >
                            {copiedId === `${tweet.id}-${tpl.label}`
                              ? "Copied!"
                              : "Copy"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {tweets.length === 0 && !loading && !error && (
        <p className="text-[12px] text-zinc-600">
          Click &quot;Search Twitter/X&quot; to find relevant tweets.
        </p>
      )}
    </div>
  );
}
