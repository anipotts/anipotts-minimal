import Link from "next/link";
import { projects } from "@/data/projects";
import { supabase } from "@/lib/supabaseClient";
import FadeIn from "@/components/FadeIn";

async function getLatestThoughts() {
  if (!supabase) return [];
  try {
    const { data } = await supabase
      .from("thoughts")
      .select("slug, title, summary, created_at")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(3);
    return data || [];
  } catch (e) {
    console.error("Error fetching thoughts:", e);
    return [];
  }
}

export default async function Home() {
  const recentProjects = projects.slice(0, 3);
  const latestThoughts = await getLatestThoughts();

  return (
    <div className="flex flex-col gap-16 md:gap-24 pb-20">
      {/* Hero */}
      <section className="flex flex-col gap-6">
        <FadeIn>
          <span className="text-sm text-gray-500">AP / index</span>
        </FadeIn>
        <FadeIn delay={0.1}>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-100">
            hi, i'm ani potts
          </h1>
        </FadeIn>
        <FadeIn delay={0.2}>
          <p className="text-xl md:text-2xl text-gray-400 max-w-2xl leading-relaxed">
            i’m a swe who works on clean interfaces for messy systems.
          </p>
        </FadeIn>
      </section>

      {/* About */}
      <section className="flex flex-col gap-6 text-gray-300 leading-relaxed max-w-2xl">
        <FadeIn delay={0.3}>
          <p>
            Right now, I'm building an internal research platform for PGI, serving quants at UChicago, NYU, Princeton, Brown, and other top institutions.
          </p>
        </FadeIn>
        <FadeIn delay={0.4}>
          <p>
            Previously, I built internal analytics dashboards for Atlantic Records, scaled lead generation systems for DADA Digital, automated social media scraping for Range Media Partners, and launched several profitable PWAs.
          </p>
        </FadeIn>
      </section>

      {/* Metrics */}
      {/* <FadeIn delay={0.5}>
        <section className="grid grid-cols-2 md:grid-cols-4 gap-8 border-y border-white/5 py-8">
          {[
            { value: "10 days", label: "Average time from idea to MVP" },
            { value: "50k+ users", label: "Served by platforms I’ve built" },
            { value: "250k+ generated", label: "Revenue generated for clients" },
            { value: "2.1m+ views", label: "Views on my projects" },
          ].map((metric, i) => (
            <div key={i} className="flex flex-col gap-1">
              <span className="text-2xl md:text-3xl font-bold text-gray-100 font-heading">{metric.value}</span>
              <span className="text-xs text-gray-500 uppercase tracking-wide">{metric.label}</span>
            </div>
          ))}
        </section>
      </FadeIn> */}

      {/* Recent Work */}
      <FadeIn delay={0.6}>
        <section className="flex flex-col gap-8">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">some recent work</h2>
          <div className="flex flex-col gap-10">
            {recentProjects.map((project) => (
              <Link key={project.slug} href={`/work#${project.slug}`} className="group block">
                <div className="flex flex-col gap-2">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-xl font-bold text-gray-200 group-hover:text-accent-400 transition-colors">
                      {project.title}
                    </h3>
                    <span className="text-xs text-gray-500 hidden md:block">
                      {project.role} • {project.duration}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm md:text-base">{project.description}</p>
                  <div className="flex gap-2 mt-1">
                    {project.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-xs text-gray-600 bg-white/5 px-2 py-1 rounded-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </FadeIn>

      {/* Latest Thoughts */}
      <FadeIn delay={0.7}>
        <section className="flex flex-col gap-8">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">latest thoughts</h2>
          {!supabase ? (
            <div className="p-4 border border-white/5 rounded-lg bg-white/5">
              <p className="text-gray-400 text-sm">Thoughts system is currently offline (Dev Mode).</p>
            </div>
          ) : latestThoughts.length > 0 ? (
            <div className="flex flex-col gap-6">
              {latestThoughts.map((thought: any) => (
                <Link key={thought.slug} href={`/thoughts/${thought.slug}`} className="group block">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-baseline justify-between">
                      <h3 className="text-lg font-medium text-gray-200 group-hover:text-accent-400 transition-colors">
                        {thought.title}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {new Date(thought.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2">{thought.summary}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
             <p className="text-gray-500 italic">No thoughts published yet.</p>
          )}
        </section>
      </FadeIn>
    </div>
  );
}
