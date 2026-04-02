import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Stagger } from "@anipotts/ui";
import ViewAllLink from "@/components/ViewAllLink";
import { getPublishedThoughts, getThoughtBySlug } from "@/content/thoughts";
import { sharedOpenGraph } from "@/content/site";
import {
  MetaLine,
  PageFrame,
  PageTitle,
  TagList,
} from "@/components/page/PageScaffold";

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
      ...sharedOpenGraph,
      title: thought.title,
      description: thought.summary,
      type: "article",
      publishedTime: thought.date,
      tags: thought.tags,
    },
    twitter: {
      card: "summary_large_image",
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

  const formattedDate = new Date(thought.date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <PageFrame className="pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Stagger as="section" className="flex flex-col gap-4">
        <ViewAllLink href="/thoughts">all thoughts</ViewAllLink>
        <PageTitle>{thought.title}</PageTitle>
        <MetaLine
          items={[
            { value: formattedDate },
            { value: `${readingTime} min read` },
          ]}
        />
        <TagList tags={thought.tags} />
      </Stagger>

      <Stagger offset={0.2}>
        <div className="prose dark:prose-invert prose-slate max-w-none prose-headings:font-heading prose-a:text-accent-400 prose-a:underline prose-a:decoration-accent-400/30 prose-a:underline-offset-4 hover:prose-a:decoration-accent-400/60 prose-img:rounded-lg prose-p:leading-relaxed prose-li:marker:text-muted prose-pre:border prose-pre:border-border-subtle prose-pre:bg-[rgba(var(--overlay-invert),0.5)]">
          <ReactMarkdown
            components={{
              img: ({ ...props }) => {
                if (!props.src || typeof props.src !== "string") return null;
                const isSafe =
                  props.src.startsWith("https://") ||
                  props.src.startsWith("http://") ||
                  props.src.startsWith("/");
                if (!isSafe) return null;
                return (
                  // eslint-disable-next-line @next/next/no-img-element
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
      </Stagger>
    </PageFrame>
  );
}
