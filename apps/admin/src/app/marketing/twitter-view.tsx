"use client";

import { useCallback, useState } from "react";
import type { QCTweet } from "@anipotts/lib/quantercise";
import { searchTwitter } from "./actions";
import { MarketingError } from "./marketing-ui";
import {
  TweetCard,
  TwitterControls,
  TwitterEmptyState,
  TwitterUnavailable,
} from "./twitter-view-sections";
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
    return <TwitterUnavailable />;
  }

  return (
    <div className="space-y-4">
      <TwitterControls
        loading={loading}
        resultCount={resultCount}
        found={tweets.length}
        tracking={tracking}
        onSearch={handleSearch}
      />

      {error && <MarketingError error={error} />}

      <div className="space-y-2">
        {tweets.map((tweet) => {
          const isExpanded = expandedId === tweet.id;
          const showComposer = activeComposerId === tweet.id;

          return (
            <TweetCard
              key={tweet.id}
              tweet={tweet}
              copiedId={copiedId}
              composerText={composerText}
              isExpanded={isExpanded}
              isResponded={tracking.responded.includes(tweet.id)}
              isSaved={tracking.saved.includes(tweet.id)}
              isSkipped={tracking.skipped.includes(tweet.id)}
              showComposer={showComposer}
              onComposerTextChange={setComposerText}
              onCopyText={copyText}
              onToggleComposer={() => {
                if (!showComposer) setComposerText("");
                setActiveComposerId(showComposer ? null : tweet.id);
              }}
              onToggleExpanded={() =>
                setExpandedId(isExpanded ? null : tweet.id)
              }
              onTrack={track}
            />
          );
        })}
      </div>

      {tweets.length === 0 && !loading && !error && <TwitterEmptyState />}
    </div>
  );
}
