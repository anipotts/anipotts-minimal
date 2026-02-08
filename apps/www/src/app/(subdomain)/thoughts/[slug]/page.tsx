import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import ReactMarkdown from "react-markdown";
import { FadeIn } from "@anipotts/ui";
import { getPostHogClient } from "@/lib/posthog-server";
import { headers } from "next/headers";
import ViewCounter from "@/components/thoughts/ViewCounter";
import IncrementView from "@/components/thoughts/IncrementView";
import type { Metadata } from "next";

/**
 * Get the correct back link based on whether we're on subdomain or main site.
 * Server-side detection via host header.
 */
async function getBackLink(): Promise<string> {
  const headersList = await headers();
  const host = headersList.get('host') || '';

  // On subdomain: use root path
  if (host.startsWith('thoughts.')) {
    return '/';
  }

  // On main site: use full path
  return '/thoughts';
}

export const revalidate = 60;

async function getThought(slug: string) {
  if (!supabase) return null;
  const { data } = await supabase
    .from("thoughts")
    .select("*")
    .eq("slug", slug)
    .single();
  return data;
}

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
      canonical: `https://thoughts.anipotts.com/${slug}`,
    },
  };
}

export default async function ThoughtPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const thought = await getThought(slug);
  const backLink = await getBackLink();

  // Track thought_read event on the server
  if (thought) {
    try {
      const headersList = await headers();
      const posthog = getPostHogClient();
      const forwardedFor = headersList.get('x-forwarded-for');
      const ip = forwardedFor ? forwardedFor.split(',')[0] : 'anonymous';
      const distinctId = `anon_${ip}`;

      posthog.capture({
        distinctId: distinctId,
        event: 'thought_read',
        properties: {
          thought_slug: thought.slug,
          thought_title: thought.title,
          thought_tags: thought.tags,
          $current_url: `/thoughts/${slug}`,
        },
      });
    } catch (error) {
      console.error('PostHog capture error:', error);
    }
  }

  if (!thought) {
    if (!supabase) {
      return (
        <div className="flex flex-col gap-8 py-8 px-4 max-w-4xl mx-auto">
          <FadeIn>
            <Link href={backLink} className="text-xs uppercase tracking-widest text-muted hover:text-accent-400 transition-colors">
              ← back to thoughts
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

  const tags = thought.tags
    ? (Array.isArray(thought.tags) ? thought.tags : thought.tags.split(','))
    : [];

  return (
    <div className="flex flex-col gap-8 py-8 px-4 max-w-4xl mx-auto">
      <IncrementView slug={thought.slug} />

      <FadeIn>
        <Link href={backLink} className="text-xs uppercase tracking-widest text-muted hover:text-accent-400 transition-colors">
          ← back to thoughts
        </Link>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="border-b border-border pb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-body leading-tight mb-4">
            {thought.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
            <time dateTime={thought.created_at}>
              {new Date(thought.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </time>
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
