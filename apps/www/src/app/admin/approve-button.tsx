"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveContent } from "./actions";

export default function ApproveButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        startTransition(async () => {
          await approveContent(id);
          router.refresh();
        });
      }}
      disabled={isPending}
      className="shrink-0 text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-white transition-colors"
    >
      {isPending ? "..." : "Approve"}
    </button>
  );
}
