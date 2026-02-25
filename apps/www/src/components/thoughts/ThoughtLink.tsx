"use client";

import Link from "next/link";
import { usePostHog } from "posthog-js/react";

interface ThoughtPreview {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  date: string;
}

export default function ThoughtLink({ thought }: { thought: ThoughtPreview }) {
  const posthog = usePostHog();

  const handleClick = () => {
    posthog.capture("thought_clicked", {
      thought_slug: thought.slug,
      thought_title: thought.title,
    });
  };

  return (
    <Link
      href={`/thoughts/${thought.slug}`}
      className="group block rounded-md p-4 -m-4 border border-transparent hover:border-accent-400/20 hover:bg-accent-400/5 transition-all"
      onClick={handleClick}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-baseline">
        <div className="md:col-span-2 flex flex-col gap-2">
          <h2 className="text-2xl font-semibold text-body group-hover:text-accent-400 transition-colors font-heading">
            {thought.title}
          </h2>
          <p className="text-secondary leading-relaxed line-clamp-2 text-base md:text-lg">
            {thought.summary}
          </p>
          {thought.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {thought.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] uppercase tracking-wider text-accent-400 border border-accent-400/20 px-2 py-1 rounded-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="md:col-span-1 md:text-right flex flex-col md:items-end gap-1">
          <span className="text-xs text-muted uppercase tracking-wide">
            {new Date(thought.date).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
      </div>
    </Link>
  );
}
