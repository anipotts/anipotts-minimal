"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";

/**
 * Search input for the /thoughts page.
 * Syncs with ?q= search param via router.push for server-side search.
 */
export default function ThoughtsSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync from URL on navigation
  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  const handleChange = (value: string) => {
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      if (value.trim()) {
        router.replace(`/thoughts?q=${encodeURIComponent(value.trim())}`);
      } else {
        router.replace("/thoughts");
      }
    }, 250);
  };

  return (
    <div className="relative max-w-md">
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") handleChange("");
        }}
        placeholder="Search thoughts..."
        className="w-full bg-input border border-border rounded-sm p-2 text-sm text-body font-mono placeholder-faint focus:border-accent-400/50 focus:outline-none transition-colors"
      />
      {query && (
        <button
          onClick={() => handleChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-secondary text-xs"
        >
          Clear
        </button>
      )}
    </div>
  );
}
