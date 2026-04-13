"use client";

import { useState } from "react";
import RedditView from "./reddit-view";
import TwitterView from "./twitter-view";

type Tab = "reddit" | "twitter";

export default function MarketingTabs({
  twitterConfigured,
}: {
  twitterConfigured: boolean;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("reddit");

  return (
    <div className="space-y-4">
      {/* Tab Bar */}
      <div className="flex items-center gap-1 border-b border-zinc-800/40 pb-px">
        <button
          onClick={() => setActiveTab("reddit")}
          className={`px-3 py-1.5 rounded-t text-[11px] font-medium transition-colors ${
            activeTab === "reddit"
              ? "bg-zinc-800/50 text-zinc-200 border-b-2 border-emerald-500"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Reddit
        </button>
        <button
          onClick={() => setActiveTab("twitter")}
          className={`px-3 py-1.5 rounded-t text-[11px] font-medium transition-colors ${
            activeTab === "twitter"
              ? "bg-zinc-800/50 text-zinc-200 border-b-2 border-sky-500"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Twitter/X
          {!twitterConfigured && (
            <span
              className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-amber-500"
              title="Not configured"
            />
          )}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "reddit" && <RedditView />}
      {activeTab === "twitter" && (
        <TwitterView twitterConfigured={twitterConfigured} />
      )}
    </div>
  );
}
