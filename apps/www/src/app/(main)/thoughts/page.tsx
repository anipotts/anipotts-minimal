import { fetchThoughts, searchThoughts } from "@anipotts/lib/cms";
import type { ThoughtSummary } from "@anipotts/lib/cms";
import { FadeIn } from "@anipotts/ui";
import ThoughtLink from "@/components/thoughts/ThoughtLink";
import ThoughtsSearch from "@/components/thoughts/ThoughtsSearch";
import type { Metadata } from "next";
import { Suspense } from "react";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "thoughts",
  description: "Technical writings and reflections from ani potts",
  openGraph: {
    title: "thoughts | ani potts",
    description: "Technical writings and reflections from ani potts",
    url: "https://anipotts.com/thoughts",
    siteName: "anipotts.com",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "thoughts | ani potts",
    description: "Technical writings and reflections from ani potts",
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
  const thoughts = query ? await searchThoughts(query) : await fetchThoughts({ published: true });

  return (
    <div className="flex flex-col gap-16 md:gap-20 pb-20">
      <section className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1 flex flex-col gap-4">
          <FadeIn>
            <h1 className="text-sm font-mono text-accent-400 tracking-widest uppercase">
              thoughts
            </h1>
          </FadeIn>
          <Suspense fallback={null}>
            <ThoughtsSearch />
          </Suspense>
        </div>
        <div className="col-span-1 md:col-span-3 flex flex-col gap-8">
          {query && (
            <FadeIn delay={0.05}>
              <p className="text-xs text-muted uppercase tracking-wider font-mono">
                {thoughts.length} result{thoughts.length !== 1 ? "s" : ""} for &quot;{query}&quot;
              </p>
            </FadeIn>
          )}

          <div className="flex flex-col divide-y divide-border-subtle">
            {thoughts.length === 0 ? (
              <FadeIn delay={0.1}>
                <p className="text-muted text-sm font-mono py-8 text-center">
                  {query ? (
                    <>no results for &quot;{query}&quot;. <a href="/thoughts" className="text-accent-400 hover:underline">clear search</a></>
                  ) : (
                    "no thoughts published yet. check back soon."
                  )}
                </p>
              </FadeIn>
            ) : (
              thoughts.map((thought: ThoughtSummary, i: number) => (
                <FadeIn key={thought.slug} delay={i * 0.1} className="py-8 first:pt-0 last:pb-0">
                  <ThoughtLink thought={thought} />
                </FadeIn>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
