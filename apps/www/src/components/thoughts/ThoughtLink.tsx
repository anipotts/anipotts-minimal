"use client";

import Link from "next/link";
import { usePostHog } from "posthog-js/react";
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
 * Thought preview card for the thoughts list page.
 */
export default function ThoughtLink({ thought, readingTime }: { thought: Thought; readingTime?: number }) {
  const posthog = usePostHog();
  const handleClick = () => {
    posthog.capture('thought_clicked', {
      thought_slug: thought.slug,
      thought_title: thought.title,
    });
  };

  const href = `/thoughts/${thought.slug}`;

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
