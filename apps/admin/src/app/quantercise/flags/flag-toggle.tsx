"use client";

import { useState, useTransition } from "react";
import { updateFeatureFlag } from "../actions";

interface Props {
  flagId: string;
  initialActive: boolean;
  rolloutPercentage: number;
}

export function FlagToggle({
  flagId,
  initialActive,
  rolloutPercentage,
}: Props) {
  const [active, setActive] = useState(initialActive);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleToggle() {
    const next = !active;
    setError(null);
    setActive(next);
    startTransition(async () => {
      const res = await updateFeatureFlag(flagId, next, rolloutPercentage);
      if (res && "error" in res) {
        setActive(!next);
        setError(res.error);
      }
    });
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`relative w-9 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-zinc-950 ${
          active
            ? "bg-emerald-500 focus:ring-emerald-500/50"
            : "bg-zinc-700 focus:ring-zinc-500/50"
        } ${isPending ? "opacity-50" : ""}`}
        aria-label={active ? "Disable flag" : "Enable flag"}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            active ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
      {error && (
        <span
          className="text-[9px] text-red-400 max-w-[80px] text-center truncate"
          title={error}
        >
          Failed
        </span>
      )}
    </div>
  );
}
