import { supabase } from "@/lib/supabaseClient";
import { FadeIn } from "@anipotts/ui";
import ThoughtLink from "@/components/ThoughtLink";
import type { Thought } from "@anipotts/types";

export const revalidate = 0;

async function getThoughts() {
  if (!supabase) return [];
  try {
    const { data } = await supabase
      .from("thoughts")
      .select("*")
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
    <div className="flex flex-col gap-12 pb-20">
      <section className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
        <div className="col-span-1">
          <FadeIn>
            <h1 className="text-xs font-bold uppercase tracking-widest text-accent-400">thoughts</h1>
            <p className="text-xs text-muted mt-2">Technical writings and reflections</p>
          </FadeIn>
        </div>
        <div className="col-span-1 md:col-span-3 flex flex-col divide-y divide-border-subtle">
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
            thoughts.map((thought: Thought, i: number) => {
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
      </section>
    </div>
  );
}
