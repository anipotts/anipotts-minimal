import type { Metadata } from "next";
import { Stagger } from "@anipotts/ui";
import ProjectCard from "@/components/ProjectCard";
import NewsletterSubscribe from "@/components/NewsletterSubscribe";
import ThoughtLink from "@/components/thoughts/ThoughtLink";
import ViewAllLink from "@/components/ViewAllLink";
import {
  ContentBlocks,
  ListBlock,
  PageFrame,
  PagePrelude,
  PageSummary,
  PageTitle,
} from "@/components/page/PageScaffold";
import { getFeaturedProjects } from "@/content/projects";
import { getPublishedThoughts } from "@/content/thoughts";
import { homeContent } from "@/content/home";
import { sharedOpenGraph } from "@/content/site";

export const metadata: Metadata = {
  title: "software engineer",
  description:
    "software engineer in nyc building agent orchestration platforms. shares workflow tips and open source tools for claude code.",
  openGraph: {
    ...sharedOpenGraph,
    title: "ani potts | software engineer",
    description:
      "software engineer in nyc building agent orchestration platforms. shares workflow tips and open source tools for claude code.",
    url: "https://anipotts.com",
  },
  alternates: {
    canonical: "https://anipotts.com",
  },
};

export default async function Home() {
  const projects = getFeaturedProjects(4);
  const thoughts = await getPublishedThoughts();

  const recentThoughts = thoughts.slice(0, 3);

  return (
    <PageFrame>
      <Stagger as="section" className="flex flex-col gap-5">
        <PagePrelude>{homeContent.prelude}</PagePrelude>
        <PageTitle>{homeContent.heading}</PageTitle>
        <PageSummary>{homeContent.summary}</PageSummary>
      </Stagger>

      <Stagger as="section" className="flex flex-col gap-4" offset={0.18}>
        <PagePrelude>about</PagePrelude>
        <ContentBlocks>
          {homeContent.about.map((line, i) => (
            <p
              key={line}
              className="text-body leading-relaxed text-base md:text-lg"
            >
              {line}
              {i === homeContent.about.length - 1 && (
                <>
                  {" "}
                  Recently featured in{" "}
                  <a
                    href="https://www.businessinsider.com/ai-usage-limits-causing-some-to-restructure-their-workday-2026-4"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-4 decoration-zinc-500 hover:decoration-zinc-300 transition-colors"
                  >
                    Business Insider
                  </a>{" "}
                  on how developers are restructuring their days around AI
                  tools.
                </>
              )}
            </p>
          ))}
        </ContentBlocks>
      </Stagger>

      <section id="selected-work">
        <Stagger className="flex flex-col gap-6" offset={0.3}>
          <div className="flex items-center justify-between">
            <PagePrelude>selected work</PagePrelude>
            <ViewAllLink href="/work">view all work</ViewAllLink>
          </div>
          <Stagger
            className="grid grid-cols-1 sm:grid-cols-2 gap-8"
            interval={0.04}
          >
            {projects.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </Stagger>
        </Stagger>
      </section>

      <Stagger as="section" className="flex flex-col gap-6" offset={0.42}>
        <div className="flex items-center justify-between">
          <PagePrelude>latest thoughts</PagePrelude>
          <ViewAllLink href="/thoughts">view all thoughts</ViewAllLink>
        </div>
        <ListBlock>
          {recentThoughts.map((thought) => (
            <div key={thought.slug} className="py-5 first:pt-0 last:pb-0">
              <ThoughtLink thought={thought} />
            </div>
          ))}
        </ListBlock>
      </Stagger>

      <section aria-label="Newsletter">
        <Stagger className="flex flex-col gap-4" offset={0.5}>
          <NewsletterSubscribe />
        </Stagger>
      </section>
    </PageFrame>
  );
}
