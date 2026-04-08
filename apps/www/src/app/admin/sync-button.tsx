"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { syncMarkdownThoughts } from "./actions";

export default function SyncButton() {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <button
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            setFeedback(null);
            const result = await syncMarkdownThoughts();
            if (!("success" in result)) {
              setFeedback(result.error);
            } else if (
              "errors" in result &&
              Array.isArray(result.errors) &&
              result.errors.length > 0
            ) {
              setFeedback(`${result.message} (${result.errors.length} errors)`);
              router.refresh();
            } else {
              setFeedback(result.message || "Done");
              router.refresh();
            }
          });
        }}
        className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 transition-colors disabled:opacity-50"
      >
        {isPending ? "Syncing..." : "Sync Markdown"}
      </button>
      {feedback && (
        <span
          className={`text-xs ${feedback.includes("error") ? "text-yellow-400" : feedback.startsWith("Failed") ? "text-red-400" : "text-green-400"}`}
        >
          {feedback}
        </span>
      )}
    </div>
  );
}
