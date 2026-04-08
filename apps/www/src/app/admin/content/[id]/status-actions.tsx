"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateContentStatus, publishEverywhere } from "../../actions";
import type { ContentStatus } from "@anipotts/types";
import type { PublishResult } from "../../actions";

const TRANSITIONS: Record<string, { label: string; next: ContentStatus }[]> = {
  idea: [{ label: "Start Draft", next: "draft" }],
  draft: [{ label: "Approve", next: "ready" }],
  ready: [{ label: "Mark Atomized", next: "atomized" }],
  atomized: [{ label: "Revert to Ready", next: "ready" }],
  published: [{ label: "Revert to Draft", next: "draft" }],
};

export default function StatusActions({
  id,
  currentStatus,
}: {
  id: string;
  currentStatus: ContentStatus;
}) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [publishResults, setPublishResults] = useState<PublishResult | null>(
    null,
  );
  const router = useRouter();
  const actions = TRANSITIONS[currentStatus] || [];
  const canPublishEverywhere =
    currentStatus === "ready" || currentStatus === "atomized";

  function handlePublishEverywhere() {
    if (
      !confirm(
        "Publish this content everywhere? This will push to Typefully and Buttondown.",
      )
    )
      return;
    startTransition(async () => {
      setFeedback(null);
      setPublishResults(null);
      const result = await publishEverywhere(id);
      if ("error" in result) {
        setFeedback(result.error);
      } else {
        setPublishResults(result);
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-3 pt-2">
      {/* Status transition buttons */}
      {actions.length > 0 && (
        <div className="flex gap-2">
          {actions.map(({ label, next }) => (
            <button
              key={next}
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  await updateContentStatus(id, next);
                  router.refresh();
                });
              }}
              className={`text-[12px] px-3 py-1.5 rounded-md font-medium transition-colors disabled:opacity-50 ${
                next === "draft"
                  ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/50"
                  : "bg-indigo-600/90 hover:bg-indigo-500 text-white"
              }`}
            >
              {isPending ? "..." : label}
            </button>
          ))}
        </div>
      )}

      {/* Publish Everywhere */}
      {canPublishEverywhere && (
        <button
          disabled={isPending}
          onClick={handlePublishEverywhere}
          className="w-full py-2 bg-green-600/90 hover:bg-green-500 disabled:opacity-50 rounded-md font-medium text-white transition-colors text-[12px] flex items-center justify-center gap-2"
        >
          {isPending ? (
            "Publishing..."
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
              Publish Everywhere
            </>
          )}
        </button>
      )}

      {/* Publish results */}
      {publishResults && (
        <div className="bg-zinc-800 rounded-lg p-3 space-y-2 text-sm">
          <p className="text-zinc-400 font-medium text-xs uppercase tracking-wide">
            Publish Results
          </p>
          <ResultLine
            label="Status set to published"
            success={publishResults.status.success}
            error={publishResults.status.error}
          />
          <ResultLine
            label="X draft via Typefully"
            success={publishResults.typefully.x.success}
            error={publishResults.typefully.x.error}
          />
          <ResultLine
            label="LinkedIn draft via Typefully"
            success={publishResults.typefully.linkedin.success}
            error={publishResults.typefully.linkedin.error}
          />
          <ResultLine
            label="Buttondown email draft"
            success={publishResults.buttondown.success}
            error={publishResults.buttondown.error}
          />
        </div>
      )}

      {feedback && <p className="text-sm text-red-400">{feedback}</p>}
    </div>
  );
}

function ResultLine({
  label,
  success,
  error,
}: {
  label: string;
  success: boolean;
  error?: string;
}) {
  return (
    <div className="flex items-start gap-2">
      {success ? (
        <svg
          className="w-4 h-4 text-green-400 mt-0.5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 12.75l6 6 9-13.5"
          />
        </svg>
      ) : (
        <svg
          className="w-4 h-4 text-red-400 mt-0.5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      )}
      <div>
        <span className={success ? "text-zinc-300" : "text-red-300"}>
          {label}
        </span>
        {error && <p className="text-xs text-red-400 mt-0.5">{error}</p>}
      </div>
    </div>
  );
}
