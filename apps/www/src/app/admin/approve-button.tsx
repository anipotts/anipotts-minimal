"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveContent } from "./actions";

export default function ApproveButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <span className="inline-flex items-center gap-2">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setError(null);
          startTransition(async () => {
            try {
              await approveContent(id);
              router.refresh();
            } catch {
              setError("Failed");
            }
          });
        }}
        disabled={isPending}
        className="shrink-0 text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-white transition-colors"
      >
        {isPending ? "..." : "Approve"}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </span>
  );
}
