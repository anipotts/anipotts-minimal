import type { Metadata } from "next";
import Link from "next/link";
import { FadeIn } from "@anipotts/ui";
import ProjectCard from "@/components/ProjectCard";
import { getWorkProjects } from "@/content/projects";
import {
  ContentBlocks,
  PageFrame,
  PagePrelude,
  PageSummary,
  PageTitle,
} from "@/components/page/PageScaffold";

export const metadata: Metadata = {
  title: "work",
  description: "Curated projects and systems from ani potts",
  openGraph: {
    title: "work | ani potts",
    description: "Curated projects and systems from ani potts",
    url: "https://anipotts.com/work",
  },
  alternates: {
    canonical: "https://anipotts.com/work",
  },
};

const CATEGORIES = ["all", "ai", "product", "quant", "music", "other"] as const;
type WorkCategory = (typeof CATEGORIES)[number];

function getActiveCategory(raw: string | undefined): WorkCategory {
  const normalized = raw?.trim().toLowerCase() ?? "all";
  return (CATEGORIES as readonly string[]).includes(normalized)
    ? (normalized as WorkCategory)
    : "all";
}

export default async function WorkPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const activeCategory = getActiveCategory(params.category);
  const projects = getWorkProjects(
    activeCategory === "all" ? undefined : activeCategory,
  );

  return (
    <PageFrame>
      <section className="flex flex-col gap-5">
        <FadeIn>
          <PagePrelude>work</PagePrelude>
        </FadeIn>
        <FadeIn delay={0.04}>
          <PageTitle>selected systems and products</PageTitle>
        </FadeIn>
        <FadeIn delay={0.08}>
          <PageSummary>
            High-signal projects only. Each entry includes status, context, and
            links to live product, source, or case study.
          </PageSummary>
        </FadeIn>
      </section>

      <section className="flex flex-col gap-4">
        <FadeIn>
          <PagePrelude>catalog</PagePrelude>
        </FadeIn>
        <ContentBlocks>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <Link
                key={category}
                href={
                  category === "all" ? "/work" : `/work?category=${category}`
                }
                scroll={false}
                aria-current={activeCategory === category ? "page" : undefined}
                className={`px-3 py-1.5 text-xs uppercase tracking-wider rounded-sm border transition-all duration-200 ${
                  activeCategory === category
                    ? "border-accent-400 text-accent-400 bg-accent-400/10"
                    : "border-border text-muted hover:border-overlay-30 hover:text-secondary"
                }`}
              >
                {category}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-4 mt-4">
            {projects.length > 0 ? (
              projects.map((project) => (
                <ProjectCard key={project.slug} project={project} />
              ))
            ) : (
              <p className="text-muted text-sm font-mono py-8 text-center">
                no projects in &quot;{activeCategory}&quot; yet.
              </p>
            )}
          </div>
        </ContentBlocks>
      </section>
    </PageFrame>
  );
}
