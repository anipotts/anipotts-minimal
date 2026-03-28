"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { FadeIn } from "@anipotts/ui";

/**
 * Search input for the /thoughts page.
 * Syncs with ?q= search param via router.push for server-side search.
 * Uses useTransition to keep old content visible during navigation.
 */
export default function ThoughtsSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      startTransition(() => {
        if (value.trim()) {
          router.replace(`/thoughts?q=${encodeURIComponent(value.trim())}`);
        } else {
          router.replace("/thoughts");
        }
      });
    }, 250);
  };

  return (
    <FadeIn delay={0.12}>
      <div className="relative max-w-md">
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") handleChange("");
          }}
          placeholder="Search thoughts..."
          aria-label="Search thoughts"
          className={`w-full bg-input border border-border rounded-sm p-2 text-sm text-body font-mono placeholder-faint focus:border-accent-400/50 focus:outline-none transition-colors ${
            isPending ? "opacity-70" : ""
          }`}
        />
        <button
          onClick={() => handleChange("")}
          aria-hidden={!query}
          className={`absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-secondary text-xs lowercase transition-opacity duration-200 ${
            query ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          tabIndex={query ? 0 : -1}
        >
          clear
        </button>
      </div>
    </FadeIn>
  );
}
