import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import FadeIn from "@/components/FadeIn";

export const revalidate = 60;

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
      <FadeIn>
        <h1 className="text-4xl font-bold font-heading text-gray-100">thoughts</h1>
      </FadeIn>

      <div className="flex flex-col gap-10">
        {!supabase ? (
          <FadeIn delay={0.1}>
            <div className="p-6 border border-white/5 rounded-lg bg-white/5 flex flex-col gap-2">
              <h3 className="text-lg font-bold text-gray-200">System Offline</h3>
              <p className="text-gray-400">The thoughts database is currently unavailable in development mode.</p>
            </div>
          </FadeIn>
        ) : thoughts.length === 0 ? (
          <FadeIn delay={0.1}>
            <p className="text-gray-500 italic">No thoughts published yet.</p>
          </FadeIn>
        ) : (
          thoughts.map((thought: any, i) => (
            <FadeIn key={thought.slug} delay={i * 0.1}>
              <Link href={`/thoughts/${thought.slug}`} className="group block">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-1">
                    <h2 className="text-2xl font-bold text-gray-200 group-hover:text-accent-400 transition-colors font-heading">
                      {thought.title}
                    </h2>
                    <span className="text-xs text-gray-500 font-mono">
                      {new Date(thought.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  <p className="text-gray-400 leading-relaxed line-clamp-2">
                    {thought.summary}
                  </p>
                  {thought.tags && (
                    <div className="flex gap-2 mt-1">
                      {(Array.isArray(thought.tags) ? thought.tags : (typeof thought.tags === 'string' ? thought.tags.split(',') : [])).map((tag: string) => (
                        <span key={tag} className="text-xs text-accent-400 bg-accent-400/10 px-2 py-1 rounded-full">
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            </FadeIn>
          ))
        )}
      </div>
    </div>
  );
}
