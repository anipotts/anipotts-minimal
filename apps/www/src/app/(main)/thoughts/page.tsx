import type { Metadata } from "next";
import { Suspense } from "react";
import { Stagger } from "@anipotts/ui";
import ThoughtLink from "@/components/thoughts/ThoughtLink";
import ThoughtsSearch from "@/components/thoughts/ThoughtsSearch";
import { getPublishedThoughts, searchThoughtEntries } from "@/content/thoughts";
import {
  ListBlock,
  PageFrame,
  PagePrelude,
  PageSummary,
  PageTitle,
} from "@/components/page/PageScaffold";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "thoughts",
  description: "Technical writing and notes from ani potts",
  openGraph: {
    title: "thoughts | ani potts",
    description: "Technical writing and notes from ani potts",
    url: "https://anipotts.com/thoughts",
  },
  alternates: {
    canonical: "https://anipotts.com/thoughts",
  },
};

export default async function ThoughtsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const thoughts = query
    ? await searchThoughtEntries(query)
    : await getPublishedThoughts();

  return (
    <PageFrame>
      <Stagger as="section" className="flex flex-col gap-5">
        <PagePrelude>thoughts</PagePrelude>
        <PageTitle>writing, systems, and product notes</PageTitle>
        <PageSummary>
          Short technical essays and operating notes from projects, experiments,
          and shipping cycles.
        </PageSummary>
      </Stagger>

      <section className="flex flex-col gap-4">
        <Suspense fallback={null}>
          <ThoughtsSearch />
        </Suspense>

        {query && (
          <p className="text-xs text-muted uppercase tracking-wider font-mono">
            {thoughts.length} result{thoughts.length !== 1 ? "s" : ""} for
            &quot;{query}&quot;
          </p>
        )}

        <ListBlock>
          {thoughts.length === 0 ? (
            <p className="text-muted text-sm font-mono py-8 text-center">
              no results. try a broader query.
            </p>
          ) : (
            <Stagger
              className="flex flex-col divide-y divide-border-subtle"
              interval={0.04}
            >
              {thoughts.map((thought) => (
                <div key={thought.slug} className="py-7 first:pt-0 last:pb-0">
                  <ThoughtLink thought={thought} />
                </div>
              ))}
            </Stagger>
          )}
        </ListBlock>
      </section>
    </PageFrame>
  );
}
