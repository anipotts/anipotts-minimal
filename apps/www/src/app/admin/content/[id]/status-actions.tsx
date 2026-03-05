"use client";

import { useTransition } from "react";
import { updateContentStatus } from "../../actions";
import type { ContentStatus } from "@anipotts/types";

const TRANSITIONS: Record<string, { label: string; next: ContentStatus }[]> = {
  idea: [{ label: "Start Draft", next: "draft" }],
  draft: [{ label: "Approve", next: "ready" }],
  ready: [
    { label: "Mark Atomized", next: "atomized" },
    { label: "Publish", next: "published" },
  ],
  atomized: [{ label: "Publish", next: "published" }],
  published: [{ label: "Revert to Draft", next: "draft" }],
};

export default function StatusActions({
  id,
  currentStatus,
}: {
  id: string;
  currentStatus: string;
}) {
  const [isPending, startTransition] = useTransition();
  const actions = TRANSITIONS[currentStatus] || [];

  if (actions.length === 0) return null;

  return (
    <div className="flex gap-2 pt-2">
      {actions.map(({ label, next }) => (
        <button
          key={next}
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              await updateContentStatus(id, next);
              window.location.reload();
            });
          }}
          className={`text-sm px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
            next === "published"
              ? "bg-green-600 hover:bg-green-500 text-white"
              : next === "draft"
                ? "bg-zinc-700 hover:bg-zinc-600 text-zinc-300"
                : "bg-indigo-600 hover:bg-indigo-500 text-white"
          }`}
        >
          {isPending ? "..." : label}
        </button>
      ))}
    </div>
  );
}
