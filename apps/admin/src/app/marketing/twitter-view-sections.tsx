"use client";

import type { QCTweet } from "@anipotts/lib/quantercise";
import { TWITTER_RESPONSE_TEMPLATES } from "./marketing-model";
import { MarketingStatsBar, MarketingTemplateRows } from "./marketing-ui";
import type { TrackingData } from "./use-tracking";

type TwitterTrackingAction = keyof TrackingData;

export function TwitterUnavailable() {
  return (
    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
      <p className="text-[12px] font-medium text-amber-400">
        Twitter API not configured
      </p>
      <p className="mt-1 text-[11px] text-zinc-500">
        Set TWITTER_BEARER_TOKEN on the Quantercise backend to enable Twitter
        search. Reddit search works without any additional configuration.
      </p>
    </div>
  );
}

export function TwitterControls({
  loading,
  resultCount,
  found,
  tracking,
  onSearch,
}: {
  loading: boolean;
  resultCount: number;
  found: number;
  tracking: TrackingData;
  onSearch: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <button
          onClick={onSearch}
          disabled={loading}
          className="admin-pill rounded bg-sky-500/10 px-3 py-1.5 text-[11px] font-medium text-sky-400 transition-colors hover:bg-sky-500/20 disabled:opacity-50"
        >
          {loading ? "Searching..." : "Search Twitter/X"}
        </button>
        {resultCount > 0 && (
          <span className="text-[10px] text-zinc-600">
            {resultCount} results from API
          </span>
        )}
      </div>
      <MarketingStatsBar found={found} tracking={tracking} />
    </div>
  );
}

export function TweetCard({
  tweet,
  copiedId,
  composerText,
  isExpanded,
  isResponded,
  isSaved,
  isSkipped,
  showComposer,
  onComposerTextChange,
  onCopyText,
  onToggleComposer,
  onToggleExpanded,
  onTrack,
}: {
  tweet: QCTweet;
  copiedId: string | null;
  composerText: string;
  isExpanded: boolean;
  isResponded: boolean;
  isSaved: boolean;
  isSkipped: boolean;
  showComposer: boolean;
  onComposerTextChange: (value: string) => void;
  onCopyText: (text: string, id: string) => void | Promise<void>;
  onToggleComposer: () => void;
  onToggleExpanded: () => void;
  onTrack: (id: string, action: TwitterTrackingAction) => void;
}) {
  return (
    <div
      className={`rounded-lg border bg-zinc-950/50 transition-colors ${
        isResponded
          ? "border-emerald-500/20"
          : isSkipped
            ? "border-zinc-800/30 opacity-60"
            : "border-zinc-800/60"
      }`}
    >
      <button onClick={onToggleExpanded} className="w-full px-4 py-3 text-left">
        <div className="mb-1.5 flex items-center gap-2">
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
        <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-zinc-300">
          {tweet.text}
        </p>
        <div className="mt-2 flex items-center gap-4 text-[10px] text-zinc-500">
          <span>{tweet.public_metrics.like_count} likes</span>
          <span>{tweet.public_metrics.retweet_count} retweets</span>
          <span>{tweet.public_metrics.reply_count} replies</span>
          <span className="ml-auto text-zinc-700">
            {isExpanded ? "▲" : "▼"}
          </span>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-zinc-800/40 px-4 pb-4">
          <TweetActions
            isResponded={isResponded}
            isSaved={isSaved}
            isSkipped={isSkipped}
            showComposer={showComposer}
            tweetId={tweet.id}
            onToggleComposer={onToggleComposer}
            onTrack={onTrack}
          />

          {showComposer ? (
            <TweetComposer
              copiedId={copiedId}
              composerText={composerText}
              tweetId={tweet.id}
              onComposerTextChange={onComposerTextChange}
              onCopyText={onCopyText}
              onTrack={onTrack}
            />
          ) : (
            <MarketingTemplateRows
              heading="Quick copy templates"
              templates={TWITTER_RESPONSE_TEMPLATES}
              copiedId={copiedId}
              compact
              getCopyId={(template) => `${tweet.id}-${template.label}`}
              onCopy={(template) => {
                onCopyText(template.text, `${tweet.id}-${template.label}`);
                onTrack(tweet.id, "responded");
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

function TweetActions({
  tweetId,
  showComposer,
  isResponded,
  isSaved,
  isSkipped,
  onToggleComposer,
  onTrack,
}: {
  tweetId: string;
  showComposer: boolean;
  isResponded: boolean;
  isSaved: boolean;
  isSkipped: boolean;
  onToggleComposer: () => void;
  onTrack: (id: string, action: TwitterTrackingAction) => void;
}) {
  return (
    <div className="mt-3 flex items-center gap-2">
      <a
        href={`https://twitter.com/i/web/status/${encodeURIComponent(tweetId)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded bg-zinc-800/50 px-2 py-1 text-[10px] font-medium text-zinc-300 transition-colors hover:bg-zinc-700/50"
      >
        Open on X ↗
      </a>
      <button
        onClick={onToggleComposer}
        className="rounded bg-sky-500/10 px-2 py-1 text-[10px] font-medium text-sky-400 transition-colors hover:bg-sky-500/20"
      >
        {showComposer ? "Hide Composer" : "Compose Reply"}
      </button>
      <button
        onClick={() => onTrack(tweetId, "responded")}
        className={`rounded px-2 py-1 text-[10px] font-medium transition-colors ${
          isResponded
            ? "bg-emerald-500/20 text-emerald-400"
            : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50"
        }`}
      >
        {isResponded ? "Responded ✓" : "Mark Responded"}
      </button>
      <button
        onClick={() => onTrack(tweetId, "saved")}
        className={`rounded px-2 py-1 text-[10px] font-medium transition-colors ${
          isSaved
            ? "bg-blue-500/20 text-blue-400"
            : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50"
        }`}
      >
        {isSaved ? "Saved ✓" : "Save"}
      </button>
      <button
        onClick={() => onTrack(tweetId, "skipped")}
        className={`rounded px-2 py-1 text-[10px] font-medium transition-colors ${
          isSkipped
            ? "bg-zinc-600/20 text-zinc-400"
            : "bg-zinc-800/50 text-zinc-500 hover:bg-zinc-700/50"
        }`}
      >
        {isSkipped ? "Skipped" : "Skip"}
      </button>
    </div>
  );
}

function TweetComposer({
  copiedId,
  composerText,
  tweetId,
  onComposerTextChange,
  onCopyText,
  onTrack,
}: {
  copiedId: string | null;
  composerText: string;
  tweetId: string;
  onComposerTextChange: (value: string) => void;
  onCopyText: (text: string, id: string) => void | Promise<void>;
  onTrack: (id: string, action: TwitterTrackingAction) => void;
}) {
  const composerCopyId = `composer-${tweetId}`;

  return (
    <div className="mt-3 space-y-2 rounded border border-zinc-800/40 bg-zinc-900/50 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-wide text-zinc-600">
          Templates:
        </span>
        {TWITTER_RESPONSE_TEMPLATES.map((template) => (
          <button
            key={template.label}
            onClick={() => onComposerTextChange(template.text)}
            className="rounded bg-zinc-800/50 px-2 py-0.5 text-[9px] font-medium text-zinc-400 transition-colors hover:bg-zinc-700/50"
          >
            {template.label}
          </button>
        ))}
      </div>
      <textarea
        value={composerText}
        onChange={(event) =>
          onComposerTextChange(event.target.value.slice(0, 280))
        }
        rows={4}
        className="admin-input w-full rounded border border-zinc-800/60 bg-zinc-950/80 px-3 py-2 text-[11px] text-zinc-200 placeholder-zinc-600 focus:border-zinc-700 focus:outline-none"
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
            onCopyText(composerText, composerCopyId);
            onTrack(tweetId, "responded");
          }}
          disabled={!composerText}
          className="rounded bg-sky-500/10 px-3 py-1 text-[10px] font-medium text-sky-400 transition-colors hover:bg-sky-500/20 disabled:opacity-40"
        >
          {copiedId === composerCopyId ? "Copied!" : "Copy to Clipboard"}
        </button>
      </div>
    </div>
  );
}

export function TwitterEmptyState() {
  return (
    <p className="text-[12px] text-zinc-600">
      Click &quot;Search Twitter/X&quot; to find relevant tweets.
    </p>
  );
}
