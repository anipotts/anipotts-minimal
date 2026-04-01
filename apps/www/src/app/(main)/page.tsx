import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Stagger } from "@anipotts/ui";
import ProjectCard from "@/components/ProjectCard";
import NewsletterSubscribe from "@/components/NewsletterSubscribe";
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
  title: "ani potts | software engineer",
  description:
    "software engineer in nyc building agent orchestration platforms. shares workflow tips and open source tools for claude code.",
  openGraph: {
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
  const [projects, thoughts] = await Promise.all([
    Promise.resolve(getFeaturedProjects(4)),
    getPublishedThoughts(),
  ]);

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
          {homeContent.about.map((line) => (
            <p
              key={line}
              className="text-body leading-relaxed text-base md:text-lg"
            >
              {line}
            </p>
          ))}
        </ContentBlocks>
      </Stagger>

      <section id="selected-work">
        <Stagger className="flex flex-col gap-4" offset={0.3}>
          <PagePrelude>selected work</PagePrelude>
          <Stagger
            className="grid grid-cols-1 sm:grid-cols-2 gap-8"
            interval={0.04}
          >
            {projects.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </Stagger>
          <EndCta>
            <Link
              href="/work"
              className="group text-xs text-accent-400 hover:underline inline-flex items-center gap-1"
            >
              view all work
              <ArrowRight
                size={12}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </EndCta>
        </Stagger>
      </section>

      <Stagger as="section" className="flex flex-col gap-4" offset={0.42}>
        <PagePrelude>latest thoughts</PagePrelude>
        <ListBlock>
          {recentThoughts.map((thought) => (
            <div key={thought.slug} className="py-5 first:pt-0 last:pb-0">
              <ThoughtLink thought={thought} />
            </div>
          ))}
        </ListBlock>
        <EndCta>
          <Link
            href="/thoughts"
            className="group text-xs text-accent-400 hover:underline inline-flex items-center gap-1"
          >
            view all thoughts
            <ArrowRight
              size={12}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </EndCta>
      </Stagger>

      <section aria-label="Newsletter">
        <Stagger className="flex flex-col gap-4" offset={0.5}>
          <NewsletterSubscribe />
        </Stagger>
      </section>
    </PageFrame>
  );
}
