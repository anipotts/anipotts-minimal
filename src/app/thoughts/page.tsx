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
      <section className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
        <div className="col-span-1">
          <FadeIn>
            <h1 className="text-xs font-bold uppercase tracking-widest text-gray-500">thoughts</h1>
          </FadeIn>
        </div>
        <div className="col-span-1 md:col-span-3 flex flex-col gap-8">
          {!supabase ? (
            <FadeIn delay={0.1}>
              <div className="p-4 border border-white/5 rounded-sm bg-white/5">
                <p className="text-gray-500 text-xs uppercase tracking-wider">System Offline (Dev Mode)</p>
              </div>
            </FadeIn>
          ) : thoughts.length === 0 ? (
            <FadeIn delay={0.1}>
              <p className="text-gray-500 italic text-sm">No thoughts published yet.</p>
            </FadeIn>
          ) : (
            thoughts.map((thought: any, i) => (
              <FadeIn key={thought.slug} delay={i * 0.1}>
                <Link href={`/thoughts/${thought.slug}`} className="group block">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-baseline">
                    <div className="md:col-span-2 flex flex-col gap-2">
                      <h2 className="text-xl font-bold text-gray-200 group-hover:text-accent-400 transition-colors">
                        {thought.title}
                      </h2>
                      <p className="text-gray-400 leading-relaxed line-clamp-2 text-sm md:text-base">
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
                    <div className="md:col-span-1 md:text-right">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">
                        {new Date(thought.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                </Link>
              </FadeIn>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
