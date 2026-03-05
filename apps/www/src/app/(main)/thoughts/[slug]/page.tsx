import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import ReactMarkdown from "react-markdown";
import { FadeIn } from "@anipotts/ui";
import { getPublishedThoughts, getThoughtBySlug } from "@/content/thoughts";

export const revalidate = 60;

export async function generateStaticParams() {
  const thoughts = await getPublishedThoughts();
  return thoughts.map((thought) => ({ slug: thought.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const thought = await getThoughtBySlug(slug);

  if (!thought) {
    return { title: "Not Found" };
  }

  return {
    title: thought.title,
    description: thought.summary,
    openGraph: {
      title: thought.title,
      description: thought.summary,
      type: "article",
      publishedTime: thought.date,
      tags: thought.tags,
    },
    twitter: {
      card: "summary",
      title: thought.title,
      description: thought.summary,
    },
    alternates: {
      canonical: `https://anipotts.com/thoughts/${slug}`,
    },
  };
}

export default async function ThoughtPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const thought = await getThoughtBySlug(slug);

  if (!thought) {
    notFound();
  }

  const readingTime = Math.max(
    1,
    Math.ceil(thought.content.split(/\s+/).length / 220),
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: thought.title,
    description: thought.summary,
    datePublished: thought.date,
    dateModified: thought.date,
    author: {
      "@type": "Person",
      name: "Ani Potts",
      url: "https://anipotts.com",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://anipotts.com/thoughts/${thought.slug}`,
    },
  };

  return (
    <article className="flex flex-col gap-8 py-2 pb-16 max-w-4xl mx-auto w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <FadeIn>
        <Link
          href="/thoughts"
          className="text-xs uppercase tracking-widest text-muted hover:text-accent-400 transition-colors inline-flex items-center gap-1"
        >
          <ArrowLeft size={12} /> back to thoughts
        </Link>
      </FadeIn>

      <FadeIn delay={0.05}>
        <header className="border-b border-border pb-6">
          <p className="text-sm uppercase tracking-[0.16em] text-accent-400 mb-3">
            thought
          </p>
          <h1 className="text-4xl md:text-5xl font-semibold font-heading text-heading leading-tight mb-4">
            {thought.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted uppercase tracking-wide">
            <time dateTime={thought.date}>
              {new Date(thought.date).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </time>
            <span className="text-faint">{readingTime} min read</span>
          </div>
          {thought.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {thought.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] uppercase tracking-wider text-accent-400 border border-accent-400/20 px-2 py-1 rounded-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>
      </FadeIn>

      <FadeIn delay={0.12}>
        <div className="prose dark:prose-invert prose-slate max-w-none prose-headings:font-heading prose-a:text-accent-400 prose-a:underline prose-a:decoration-accent-400/30 prose-a:underline-offset-4 hover:prose-a:decoration-accent-400/60 prose-img:rounded-lg prose-p:leading-relaxed prose-li:marker:text-muted prose-pre:border prose-pre:border-border-subtle prose-pre:bg-[rgba(var(--overlay-invert),0.5)]">
          <ReactMarkdown
            components={{
              img: ({ ...props }) => {
                if (!props.src) return null;
                // eslint-disable-next-line @next/next/no-img-element
                return (
                  <img
                    {...props}
                    alt={props.alt || ""}
                    style={{ maxWidth: "100%" }}
                  />
                );
              },
            }}
          >
            {thought.content}
          </ReactMarkdown>
        </div>
      </FadeIn>
    </article>
  );
}
