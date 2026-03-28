import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { FadeIn } from "@anipotts/ui";
import ProjectCard from "@/components/ProjectCard";
import ThoughtLink from "@/components/thoughts/ThoughtLink";
import {
  ContentBlocks,
  EndCta,
  ListBlock,
  PageFrame,
  PagePrelude,
  PageSummary,
  PageTitle,
} from "@/components/page/PageScaffold";
import { getFeaturedProjects } from "@/content/projects";
import { getPublishedThoughts } from "@/content/thoughts";
import { homeContent } from "@/content/home";

export const metadata: Metadata = {
  title: "ani potts | software engineer at Structured AI (YC F25)",
  description:
    "software engineer at Structured AI (YC F25), building autonomous agents and AI infrastructure. based in nyc.",
  openGraph: {
    title: "ani potts | software engineer at Structured AI (YC F25)",
    description:
      "software engineer at Structured AI (YC F25), building autonomous agents and AI infrastructure. based in nyc.",
    url: "https://anipotts.com",
  },
  alternates: {
    canonical: "https://anipotts.com",
  },
};

export default async function Home() {
  const [projects, thoughts] = await Promise.all([
    Promise.resolve(getFeaturedProjects(4)),
    getPublishedThoughts(),
  ]);

  const recentThoughts = thoughts.slice(0, 3);

  return (
    <PageFrame>
      <section className="flex flex-col gap-5">
        <FadeIn>
          <PagePrelude>{homeContent.prelude}</PagePrelude>
        </FadeIn>
        <FadeIn delay={0.04}>
          <PageTitle>{homeContent.heading}</PageTitle>
        </FadeIn>
        <FadeIn delay={0.08}>
          <PageSummary>{homeContent.summary}</PageSummary>
        </FadeIn>
      </section>

      <section className="flex flex-col gap-4">
        <FadeIn>
          <PagePrelude>about</PagePrelude>
        </FadeIn>
        <ContentBlocks>
          {homeContent.about.map((line, index) => (
            <FadeIn key={line} delay={0.08 + index * 0.04}>
              <p className="text-body leading-relaxed text-base md:text-lg">
                {line}
              </p>
            </FadeIn>
          ))}
        </ContentBlocks>
      </section>

      <section className="flex flex-col gap-4" id="selected-work">
        <FadeIn>
          <PagePrelude>selected work</PagePrelude>
        </FadeIn>
        <div className="flex flex-col gap-3">
          {projects.map((project, index) => (
            <FadeIn key={project.slug} delay={0.04 + index * 0.03}>
              <ProjectCard project={project} />
            </FadeIn>
          ))}
        </div>
        <EndCta>
          <Link
            href="/work"
            className="group text-xs text-accent-400 hover:underline decoration-accent-400/30 underline-offset-4 inline-flex items-center gap-1"
          >
            view all work
            <ArrowRight
              size={12}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </EndCta>
      </section>

      <section className="flex flex-col gap-4">
        <FadeIn>
          <PagePrelude>latest thoughts</PagePrelude>
        </FadeIn>
        <ListBlock>
          {recentThoughts.map((thought, index) => (
            <FadeIn
              key={thought.slug}
              delay={0.04 + index * 0.03}
              className="py-5 first:pt-0 last:pb-0"
            >
              <ThoughtLink thought={thought} />
            </FadeIn>
          ))}
        </ListBlock>
        <EndCta>
          <Link
            href="/thoughts"
            className="group text-xs text-accent-400 hover:underline decoration-accent-400/30 underline-offset-4 inline-flex items-center gap-1"
          >
            view all thoughts
            <ArrowRight
              size={12}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </EndCta>
      </section>
    </PageFrame>
  );
}
