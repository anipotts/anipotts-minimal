"use client";

import Link from "next/link";
import { usePostHog } from "posthog-js/react";
import { MetaLine, TagList } from "@/components/page/PageScaffold";

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

  const formattedDate = new Date(thought.date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link
      href={`/thoughts/${thought.slug}`}
      className="group block rounded-md p-3 -m-3 border border-transparent hover:border-accent-400/20 hover:bg-accent-400/5 transition-all duration-200"
      data-no-flow
      onClick={handleClick}
    >
      <div className="flex flex-col gap-2">
        <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-1">
          <h2 className="text-2xl font-semibold text-body group-hover:text-accent-400 transition-colors duration-200 font-heading">
            {thought.title}
          </h2>
          <MetaLine items={[{ value: formattedDate }]} className="shrink-0" />
        </div>
        <p className="text-secondary leading-relaxed line-clamp-2 text-base md:text-lg">
          {thought.summary}
        </p>
        <TagList tags={thought.tags} />
      </div>
    </Link>
  );
}
