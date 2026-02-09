import { supabase } from "@/lib/supabaseClient";
import { FadeIn } from "@anipotts/ui";
import ThoughtLink from "@/components/thoughts/ThoughtLink";
import ThoughtsSearch from "@/components/thoughts/ThoughtsSearch";
import type { Metadata } from "next";
import { Suspense } from "react";

export const revalidate = 60;

interface ThoughtRow {
  id: string;
  title: string;
  slug: string;
  summary: string;
  created_at: string;
  series_type: string | null;
  tags: string | string[] | null;
  views: number;
}

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

async function getThoughts(): Promise<ThoughtRow[]> {
  if (!supabase) return [];
  try {
    const { data } = await supabase
      .from("thoughts")
      .select("id, title, slug, summary, created_at, series_type, tags, views")
      .eq("published", true)
      .order("created_at", { ascending: false });
    return (data as ThoughtRow[]) || [];
  } catch (e) {
    console.error("Error fetching thoughts:", e);
    return [];
  }
}

async function searchThoughts(query: string): Promise<ThoughtRow[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.rpc("search_content", {
      query,
      lim: 20,
    });
    if (error) throw error;
    if (!data) return [];

    // Filter to only thoughts, then fetch full data for each
    const thoughtResults = (data as { type: string; id: string; slug: string; title: string; summary: string; rank: number }[])
      .filter((r) => r.type === "thought");

    if (thoughtResults.length === 0) return [];

    const slugs = thoughtResults.map((r) => r.slug);
    const { data: thoughts } = await supabase
      .from("thoughts")
      .select("id, title, slug, summary, created_at, series_type, tags, views")
      .eq("published", true)
      .in("slug", slugs);

    if (!thoughts) return [];

    // Sort by search rank
    const rankMap = new Map(thoughtResults.map((r) => [r.slug, r.rank]));
    return (thoughts as ThoughtRow[]).sort((a, b) => (rankMap.get(b.slug) ?? 0) - (rankMap.get(a.slug) ?? 0));
  } catch (e) {
    console.error("Error searching thoughts:", e);
    return [];
  }
}

export default async function ThoughtsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const thoughts = query ? await searchThoughts(query) : await getThoughts();

  return (
    <div className="flex flex-col gap-8 py-8 px-4 max-w-4xl mx-auto">
      {/* Search input */}
      <Suspense fallback={null}>
        <ThoughtsSearch />
      </Suspense>

      {query && (
        <FadeIn delay={0.05}>
          <p className="text-xs text-muted uppercase tracking-wider font-mono">
            {thoughts.length} result{thoughts.length !== 1 ? "s" : ""} for &quot;{query}&quot;
          </p>
        </FadeIn>
      )}

      <div className="flex flex-col divide-y divide-border-subtle">
        {!supabase ? (
          <FadeIn delay={0.1}>
            <div className="p-4 border border-border-subtle rounded-sm bg-input">
              <p className="text-muted text-sm">Database unavailable. Content will appear when the connection is restored.</p>
            </div>
          </FadeIn>
        ) : thoughts.length === 0 ? (
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
          thoughts.map((thought: ThoughtRow, i: number) => (
            <FadeIn key={thought.slug} delay={i * 0.1} className="py-8 first:pt-0 last:pb-0">
              <ThoughtLink thought={thought} />
            </FadeIn>
          ))
        )}
      </div>
    </div>
  );
}
