"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 px-4">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-heading font-mono">
          something went wrong
        </h2>
        <p className="text-sm text-muted max-w-md">
          an unexpected error occurred. try refreshing the page, or head back to
          the homepage.
        </p>
        {error.digest && (
          <p className="text-xs text-faint font-mono">
            error id: {error.digest}
          </p>
        )}
      </div>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="text-xs uppercase tracking-widest text-accent-400 border border-accent-400/20 px-4 py-2 rounded-sm hover:bg-accent-400/10 transition-colors font-mono"
        >
          try again
        </button>
        <Link
          href="/"
          className="text-xs uppercase tracking-widest text-muted border border-border px-4 py-2 rounded-sm hover:bg-overlay-5 transition-colors font-mono"
        >
          go home
        </Link>
      </div>
    </div>
  );
}
