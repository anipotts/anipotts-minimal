import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getExperiment, listExperiments } from "@/lib/content";
import { PageFrame } from "@/components/PageFrame";
import { Markdown } from "@/components/Markdown";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return listExperiments().map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = getExperiment(slug);
  if (!entry) return { title: "Not found" };
  return {
    title: entry.meta.title,
    description: entry.meta.summary,
  };
}

export default async function ExperimentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = getExperiment(slug);
  if (!entry) notFound();

  return (
    <PageFrame back={{ href: "/", label: "back" }}>
      <header className="mb-10">
        <h1 className="text-3xl font-medium tracking-tight">
          {entry.meta.title}
        </h1>
        <p className="mt-2 font-mono text-xs text-[color:var(--muted)]">
          {entry.meta.date}
          {entry.meta.tags && entry.meta.tags.length > 0
            ? ` · ${entry.meta.tags.join(" · ")}`
            : ""}
        </p>
      </header>
      <Markdown>{entry.body}</Markdown>
    </PageFrame>
  );
}
