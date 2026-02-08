import { supabase } from "@/lib/supabaseClient";
import { FadeIn } from "@anipotts/ui";
import ThoughtLink from "@/components/thoughts/ThoughtLink";
import type { Metadata } from "next";

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

async function getThoughts() {
  if (!supabase) return [];
  try {
    const { data } = await supabase
      .from("thoughts")
      .select("id, title, slug, summary, created_at, series_type, tags, views, content")
      .eq("published", true)
      .order("created_at", { ascending: false });
    return data || [];
  } catch (e) {
    console.error("Error fetching thoughts:", e);
    return [];
  }
}

export default async function ThoughtsPage() {
  const thoughts = await getThoughts();

  return (
    <div className="flex flex-col gap-8 py-8 px-4 max-w-4xl mx-auto">
      <div className="flex flex-col divide-y divide-border-subtle">
        {!supabase ? (
          <FadeIn delay={0.1}>
            <div className="p-4 border border-border-subtle rounded-sm bg-input">
              <p className="text-muted text-xs uppercase tracking-wider">System Offline (Dev Mode)</p>
            </div>
          </FadeIn>
        ) : thoughts.length === 0 ? (
          <FadeIn delay={0.1}>
            <p className="text-muted italic text-sm">No thoughts published yet.</p>
          </FadeIn>
        ) : (
          thoughts.map((thought: any, i: number) => {
            const readingTime = thought.content
              ? Math.ceil(thought.content.split(/\s+/).length / 200)
              : undefined;
            return (
              <FadeIn key={thought.slug} delay={i * 0.1} className="py-8 first:pt-0 last:pb-0">
                <ThoughtLink thought={thought} readingTime={readingTime} />
              </FadeIn>
            );
          })
        )}
      </div>
    </div>
  );
}
