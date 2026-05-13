import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getWeekly, listWeekly } from "@/lib/content";
import { PageFrame } from "@/components/PageFrame";
import { Markdown } from "@/components/Markdown";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return listWeekly().map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = getWeekly(slug);
  if (!entry) return { title: "Not found" };
  return {
    title: `${entry.meta.week} digest`,
    description: entry.meta.highlights.join(" · ") || "Weekly autonomous activity digest",
  };
}

export default async function WeeklyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = getWeekly(slug);
  if (!entry) notFound();

  return (
    <PageFrame back={{ href: "/", label: "back" }}>
      <Markdown>{entry.body}</Markdown>
    </PageFrame>
  );
}
