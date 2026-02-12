import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { FadeIn } from "@anipotts/ui";
import { fetchPageContent, fetchProjects, fetchThoughts } from "@anipotts/lib/cms";
import type { ThoughtSummary } from "@anipotts/lib/cms";
import ProjectCard from "@/components/ProjectCard";
import CompanyLink from "@/components/CompanyLink";
import ThoughtLink from "@/components/thoughts/ThoughtLink";
import type { HomepageContent } from "@anipotts/types";

export const revalidate = 60;

/** Default homepage content used when CMS is unavailable */
const DEFAULT_CONTENT: HomepageContent = {
  sections: {
    intro: {
      visible: true,
      label: "index",
      heading: "hi, i'm ani.",
      subheading: "i'm a SWE based in NYC, who builds minimal interfaces to orchestrate complex systems.",
    },
    about: {
      visible: true,
      label: "about me",
      heading: "",
    },
    past_work: {
      visible: true,
      label: "past work",
      heading: "",
      limit: 5,
      view_all: "/work",
    },
    latest_thoughts: {
      visible: true,
      label: "latest thoughts",
      heading: "",
      limit: 5,
      view_all: "/thoughts",
    },
  },
  section_order: ["intro", "about", "past_work", "latest_thoughts"],
};

export default async function Home() {
  const pageContent = await fetchPageContent<HomepageContent>("homepage");
  const content = pageContent?.content ?? DEFAULT_CONTENT;
  const order = content.section_order ?? DEFAULT_CONTENT.section_order;

  const workLimit = content.sections.past_work?.limit ?? 5;
  const thoughtsLimit = content.sections.latest_thoughts?.limit ?? 5;

  const [recentProjects, latestThoughts] = await Promise.all([
    fetchProjects({ featured: true, limit: workLimit }),
    fetchThoughts({ published: true, limit: thoughtsLimit }),
  ]);

  let delayCounter = 0;
  const nextDelay = () => delayCounter++ * 0.05;

  const sectionRenderers: Record<string, () => React.ReactNode> = {
    intro: () => {
      const s = content.sections.intro;
      if (!s?.visible) return null;
      return (
        <section key="intro" className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1">
            <FadeIn delay={nextDelay()}>
              <span className="text-sm font-mono text-accent-400 tracking-widest uppercase">
                {s.label ?? "index"}
              </span>
            </FadeIn>
          </div>
          <div className="col-span-1 md:col-span-3 flex flex-col gap-6">
            <FadeIn delay={nextDelay()}>
              <h1 className="text-4xl md:text-5xl font-bold font-heading text-heading">
                {s.heading}
              </h1>
            </FadeIn>
            {s.subheading && (
              <FadeIn delay={nextDelay()}>
                <p className="text-lg md:text-xl text-secondary leading-relaxed">
                  {s.subheading}
                </p>
              </FadeIn>
            )}
          </div>
        </section>
      );
    },

    about: () => {
      const s = content.sections.about;
      if (!s?.visible) return null;
      return (
        <section key="about" className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1">
            <FadeIn delay={nextDelay()}>
              <span className="text-sm font-mono text-accent-400 tracking-widest uppercase">
                {s.label ?? "about me"}
              </span>
            </FadeIn>
          </div>
          <div className="col-span-1 md:col-span-3 flex flex-col gap-6 text-body text-base md:text-lg leading-relaxed">
            <FadeIn delay={nextDelay()}>
              <p>
                Right now, I'm building an investment research platform for <CompanyLink href="https://www.pgiuchicago.com/" companyName="PGI">PGI</CompanyLink>, serving quants at UChicago, NYU, Princeton, Brown, and other top institutions.
              </p>
            </FadeIn>
            <FadeIn delay={nextDelay()}>
              <p>
                Previously, I built internal analytics dashboards for <CompanyLink href="https://www.atlanticrecords.com/" companyName="Atlantic Records">Atlantic</CompanyLink>, automated social media scraping for <CompanyLink href="https://www.rangemp.com/" companyName="Range Media Partners">Range Media Partners</CompanyLink>, and launched several profitable <a href="#selected-work" className="text-body hover:text-accent-400 font-medium underline decoration-overlay-30 underline-offset-4 transition-colors">PWAs</a> (see below).
              </p>
            </FadeIn>
          </div>
        </section>
      );
    },

    past_work: () => {
      const s = content.sections.past_work;
      if (!s?.visible) return null;
      return (
        <section key="past_work" id="selected-work" className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1">
            <FadeIn delay={nextDelay()}>
              <span className="text-sm font-mono text-accent-400 tracking-widest uppercase">
                {s.label ?? "past work"}
              </span>
            </FadeIn>
          </div>
          <div className="col-span-1 md:col-span-3 flex flex-col gap-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {recentProjects.map((project) => (
                <FadeIn key={project.slug} delay={nextDelay()}>
                  <ProjectCard project={project} />
                </FadeIn>
              ))}
            </div>
            <FadeIn delay={nextDelay()}>
              <Link
                href={s.view_all ?? "/work"}
                className="group text-xs text-accent-400 hover:underline inline-flex items-center gap-1"
              >
                view all work <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </FadeIn>
          </div>
        </section>
      );
    },

    latest_thoughts: () => {
      const s = content.sections.latest_thoughts;
      if (!s?.visible) return null;
      return (
        <section key="latest_thoughts" className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1">
            <FadeIn delay={nextDelay()}>
              <span className="text-sm font-mono text-accent-400 tracking-widest uppercase">
                {s.label ?? "latest thoughts"}
              </span>
            </FadeIn>
          </div>
          <div className="col-span-1 md:col-span-3 flex flex-col gap-8">
            {latestThoughts.length > 0 ? (
              <>
                {latestThoughts.map((thought: ThoughtSummary) => (
                  <FadeIn key={thought.slug} delay={nextDelay()}>
                    <ThoughtLink thought={thought} />
                  </FadeIn>
                ))}
                <FadeIn delay={nextDelay()}>
                  <Link
                    href={s.view_all ?? "/thoughts"}
                    className="group text-xs text-accent-400 hover:underline inline-flex items-center gap-1"
                  >
                    view all thoughts <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                </FadeIn>
              </>
            ) : (
              <FadeIn delay={nextDelay()}>
                <p className="text-muted font-mono text-sm">
                  $ cat thoughts.md<br />
                  <span className="text-faint">no entries found. check back soon.</span>
                </p>
              </FadeIn>
            )}
          </div>
        </section>
      );
    },
  };

  return (
    <div className="flex flex-col gap-16 md:gap-20 pb-20">
      {order.map((key) => sectionRenderers[key]?.())}
    </div>
  );
}
