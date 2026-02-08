"use client";

import Link from "next/link";

interface ThoughtLinkProps {
  thought: {
    slug: string;
    title: string;
    summary?: string;
    created_at: string;
    views?: number;
  };
}

/**
 * Preview card for a thought on the main site.
 * Uses internal routing for SPA navigation.
 */
export default function ThoughtLink({ thought }: ThoughtLinkProps) {
  // Use internal route path (middleware handles subdomain → route mapping)
  const href = `/thoughts/${thought.slug}`;

  return (
    <Link
      href={href}
      className="group block p-4 -mx-4 rounded-lg hover:bg-overlay-5 transition-colors"
    >
      <div className="flex flex-col gap-2">
        <h3 className="text-base font-semibold text-secondary group-hover:text-accent-400 transition-colors">
          {thought.title}
        </h3>
        {thought.summary && (
          <p className="text-sm text-muted line-clamp-2">{thought.summary}</p>
        )}
        <div className="flex items-center gap-4 text-xs text-faint font-mono">
          <span>
            {new Date(thought.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          {thought.views !== undefined && (
            <span>{thought.views} views</span>
          )}
        </div>
      </div>
    </Link>
  );
}
