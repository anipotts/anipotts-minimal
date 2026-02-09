import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { supabase } from "@/lib/supabaseClient";
import { parseTags } from "@anipotts/lib";
import ReactMarkdown from "react-markdown";
import { FadeIn } from "@anipotts/ui";
import { cache } from "react";
import ViewCounter from "@/components/thoughts/ViewCounter";
import IncrementView from "@/components/thoughts/IncrementView";
import type { Metadata } from "next";

export const revalidate = 60;

export async function generateStaticParams() {
  if (!supabase) return [];
  try {
    const { data } = await supabase
      .from("thoughts")
      .select("slug")
      .eq("published", true);
    return (data || []).map((t) => ({ slug: t.slug }));
  } catch {
    return [];
  }
}

const getThought = cache(async (slug: string) => {
  if (!supabase) return null;
  const { data } = await supabase
    .from("thoughts")
    .select("*")
    .eq("slug", slug)
    .single();
  return data;
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const thought = await getThought(slug);

  if (!thought) {
    return { title: "Not Found" };
  }

  return {
    title: thought.title,
    description: thought.summary || `${thought.title} — a thought by Ani Potts`,
    openGraph: {
      title: thought.title,
      description: thought.summary || `${thought.title} — a thought by Ani Potts`,
      type: "article",
      publishedTime: thought.created_at,
      tags: thought.tags,
    },
    twitter: {
      card: "summary",
      title: thought.title,
      description: thought.summary || `${thought.title} — a thought by Ani Potts`,
    },
    alternates: {
      canonical: `https://anipotts.com/thoughts/${slug}`,
    },
  };
}

export default async function ThoughtPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const thought = await getThought(slug);
  const backLink = '/thoughts';

  if (!thought) {
    if (!supabase) {
      return (
        <div className="flex flex-col gap-8 py-8 px-4 max-w-4xl mx-auto">
          <FadeIn>
            <Link href={backLink} className="text-xs uppercase tracking-widest text-muted hover:text-accent-400 transition-colors inline-flex items-center gap-1">
              <ArrowLeft size={12} /> back to thoughts
            </Link>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="p-4 border border-border-subtle rounded-sm bg-input">
              <p className="text-muted text-xs uppercase tracking-wider">System Offline (Dev Mode)</p>
            </div>
          </FadeIn>
        </div>
      );
    }
    notFound();
  }

  const tags = parseTags(thought.tags);
  const readingTime = thought.content ? Math.ceil(thought.content.split(/\s+/).length / 200) : null;

  return (
    <div className="flex flex-col gap-8 py-8 px-4 max-w-4xl mx-auto">
      <IncrementView slug={thought.slug} />

      <FadeIn>
        <Link href={backLink} className="text-xs uppercase tracking-widest text-muted hover:text-accent-400 transition-colors inline-flex items-center gap-1">
          <ArrowLeft size={12} /> back to thoughts
        </Link>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="border-b border-border pb-6">
          <h1 className="text-4xl md:text-5xl font-bold text-body leading-tight mb-4">
            {thought.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
            <time dateTime={thought.created_at}>
              {new Date(thought.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </time>
            {readingTime && (
              <span className="text-faint">· {readingTime} min read</span>
            )}
            <ViewCounter slug={thought.slug} initialViews={thought.views} />
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {tags.map((tag: string) => (
                <span key={tag} className="text-[10px] uppercase tracking-wider text-accent-400 border border-accent-400/20 px-2 py-1 rounded-sm">
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}
        </div>
      </FadeIn>

      <FadeIn delay={0.2}>
        <div className="prose prose-invert prose-gray max-w-none prose-headings:font-bold prose-a:text-accent-400 prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg prose-p:leading-relaxed prose-li:marker:text-muted">
          <ReactMarkdown
            components={{
              img: ({ node, ...props }) => {
                if (!props.src) return null;
                // eslint-disable-next-line @next/next/no-img-element
                return <img {...props} alt={props.alt || ""} style={{ maxWidth: "100%" }} />;
              },
            }}
          >
            {thought.content}
          </ReactMarkdown>
        </div>
      </FadeIn>
    </div>
  );
}
