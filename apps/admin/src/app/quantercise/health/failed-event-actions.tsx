"use client";

import { useState, useTransition } from "react";
import { resolveFailedEvent } from "../actions";

interface Props {
  eventId: string;
  source: string;
}

export function FailedEventActions({ eventId, source }: Props) {
  const [isPending, startTransition] = useTransition();
  const [resolved, setResolved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleResolve() {
    setError(null);
    startTransition(async () => {
      const res = await resolveFailedEvent(
        eventId,
        source,
        "Resolved from admin",
      );
      if (res && "error" in res) {
        setError(res.error);
      } else {
        setResolved(true);
      }
    });
  }

  if (resolved) {
    return (
      <span className="text-[10px] text-emerald-400 shrink-0">Resolved</span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1 shrink-0">
      <button
        onClick={handleResolve}
        disabled={isPending}
        className="px-2 py-1 rounded text-[10px] font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors disabled:opacity-50"
      >
        {isPending ? "..." : "Resolve"}
      </button>
      {error && <span className="text-[9px] text-red-400">{error}</span>}
    </div>
  );
}
