"use client";

import { useState, useCallback } from "react";
import type { QCTweet } from "@anipotts/lib/quantercise";
import { searchTwitter } from "./actions";
import { TWITTER_RESPONSE_TEMPLATES } from "./marketing-model";
import {
  MarketingError,
  MarketingStatsBar,
  MarketingTemplateRows,
} from "./marketing-ui";
import { useTracking } from "./use-tracking";

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
        <MarketingStatsBar found={tweets.length} tracking={tracking} />
      </div>

      {error && <MarketingError error={error} />}

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
                        {TWITTER_RESPONSE_TEMPLATES.map((tpl) => (
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
                    <MarketingTemplateRows
                      heading="Quick copy templates"
                      templates={TWITTER_RESPONSE_TEMPLATES}
                      copiedId={copiedId}
                      compact
                      getCopyId={(template) => `${tweet.id}-${template.label}`}
                      onCopy={(template) => {
                        copyText(
                          template.text,
                          `${tweet.id}-${template.label}`,
                        );
                        track(tweet.id, "responded");
                      }}
                    />
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
