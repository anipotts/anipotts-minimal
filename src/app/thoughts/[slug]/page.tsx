import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import ReactMarkdown from "react-markdown";
import FadeIn from "@/components/FadeIn";

export const revalidate = 60;

async function getThought(slug: string) {
  const { data } = await supabase
    .from("thoughts")
    .select("*")
    .eq("slug", slug)
    .single();
  return data;
}

export default async function ThoughtPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const thought = await getThought(slug);

  if (!thought) {
    notFound();
  }

  return (
    <article className="flex flex-col gap-8 pb-20">
      <FadeIn>
        <Link href="/thoughts" className="text-sm text-gray-500 hover:text-accent-400 transition-colors mb-8 inline-block">
          ← back to thoughts
        </Link>
      </FadeIn>

      <FadeIn delay={0.1}>
        <header className="flex flex-col gap-4 mb-8 border-b border-white/5 pb-8">
          <h1 className="text-3xl md:text-4xl font-bold font-heading text-gray-100 leading-tight">
            {thought.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 font-mono">
            <time dateTime={thought.created_at}>
              {new Date(thought.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </time>
            {thought.tags && (
              <div className="flex gap-2">
                {(Array.isArray(thought.tags) ? thought.tags : (typeof thought.tags === 'string' ? thought.tags.split(',') : [])).map((tag: string) => (
                  <span key={tag} className="text-accent-400 bg-accent-400/10 px-2 py-0.5 rounded-full text-xs">
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>
        </header>
      </FadeIn>

      <FadeIn delay={0.2}>
        <div className="prose prose-invert prose-gray max-w-none prose-headings:font-heading prose-headings:font-bold prose-a:text-accent-400 prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg">
          <ReactMarkdown>{thought.content}</ReactMarkdown>
        </div>
      </FadeIn>
    </article>
  );
}
