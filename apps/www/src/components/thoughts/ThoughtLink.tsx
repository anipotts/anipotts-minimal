"use client";

import Link from "next/link";
import posthog from "posthog-js";
import ViewCounter from "./ViewCounter";

interface Thought {
  slug: string;
  title: string;
  summary: string;
  tags?: string | string[];
  created_at: string;
  views?: number;
}

/**
 * Determines if we're on a subdomain (where paths should be relative)
 * vs main site (where paths need the /thoughts prefix).
 */
function useSubdomainPath(slug: string): string {
  if (typeof window === 'undefined') {
    // SSR: use full path (safe default)
    return `/thoughts/${slug}`;
  }

  const hostname = window.location.hostname;
  const searchParams = new URLSearchParams(window.location.search);

  // On subdomain: use relative path (/slug)
  // thoughts.anipotts.com or localhost with _subdomain param
  if (
    hostname.startsWith('thoughts.') ||
    searchParams.get('_subdomain') === 'thoughts'
  ) {
    return `/${slug}`;
  }

  // On main site: use full path (/thoughts/slug)
  return `/thoughts/${slug}`;
}

/**
 * Thought preview card for the thoughts list page.
 * Links to the thought detail page using context-aware routing.
 */
export default function ThoughtLink({ thought, readingTime }: { thought: Thought; readingTime?: number }) {
  const handleClick = () => {
    posthog.capture('thought_clicked', {
      thought_slug: thought.slug,
      thought_title: thought.title,
    });
  };

  const href = useSubdomainPath(thought.slug);

  return (
    <Link href={href} className="group block" onClick={handleClick}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-baseline">
        <div className="md:col-span-2 flex flex-col gap-2">
          <h2 className="text-xl font-bold text-body group-hover:text-accent-400 transition-colors">
            {thought.title}
          </h2>
          <p className="text-tertiary leading-relaxed line-clamp-2 text-sm md:text-base">
            {thought.summary}
          </p>
          {thought.tags && (
            <div className="flex gap-2 mt-1">
              {(Array.isArray(thought.tags) ? thought.tags : (typeof thought.tags === 'string' ? thought.tags.split(',') : [])).map((tag: string) => (
                <span key={tag} className="text-[10px] uppercase tracking-wider text-accent-400 border border-accent-400/20 px-2 py-1 rounded-sm">
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="md:col-span-1 md:text-right flex flex-col md:items-end gap-1">
          <span className="text-xs text-muted uppercase tracking-wide">
            {new Date(thought.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            {readingTime != null && (
              <span className="text-faint ml-2">· {readingTime} min read</span>
            )}
          </span>
          <ViewCounter slug={thought.slug} initialViews={thought.views} />
        </div>
      </div>
    </Link>
  );
}
