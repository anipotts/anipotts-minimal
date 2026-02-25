import type { Metadata } from "next";
import Link from "next/link";
import { FadeIn } from "@anipotts/ui";
import { TipCard } from "./TipCard";
import {
  BLOB,
  REPO,
  docs,
  guideTiers,
  hooks,
  plugins,
  stats,
} from "./data";
import { getFeaturedProjects } from "@/content/projects";
import {
  CardBlock,
  ContentBlocks,
  PageFrame,
  PagePrelude,
  PageSummary,
  PageTitle,
} from "@/components/page/PageScaffold";

export const metadata: Metadata = {
  title: "claude",
  description: "Claude Code systems, playbooks, and implementation patterns from ani potts",
  alternates: {
    canonical: "https://anipotts.com/claude",
  },
};

export default function ClaudePage() {
  const selectedProjects = getFeaturedProjects(3);

  return (
    <PageFrame>
      <section className="flex flex-col gap-5" id="proof">
        <FadeIn>
          <PagePrelude>claude</PagePrelude>
        </FadeIn>
        <FadeIn delay={0.04}>
          <PageTitle>claude code systems that ship</PageTitle>
        </FadeIn>
        <FadeIn delay={0.08}>
          <PageSummary>
            I design practical workflows for coding agents, quality gates, and high-velocity implementation loops.
          </PageSummary>
        </FadeIn>
        <FadeIn delay={0.12}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <CardBlock>
              <p className="text-[10px] uppercase tracking-[0.16em] text-faint">sessions</p>
              <p className="text-2xl font-heading text-accent-400 mt-1">{stats.sessions}</p>
            </CardBlock>
            <CardBlock>
              <p className="text-[10px] uppercase tracking-[0.16em] text-faint">messages</p>
              <p className="text-2xl font-heading text-accent-400 mt-1">{stats.messages}</p>
            </CardBlock>
            <CardBlock>
              <p className="text-[10px] uppercase tracking-[0.16em] text-faint">tool calls</p>
              <p className="text-2xl font-heading text-accent-400 mt-1">{stats.toolCalls}</p>
            </CardBlock>
            <CardBlock>
              <p className="text-[10px] uppercase tracking-[0.16em] text-faint">focus</p>
              <p className="text-sm text-secondary mt-2">execution quality</p>
            </CardBlock>
          </div>
        </FadeIn>
      </section>

      <section className="flex flex-col gap-4" id="systems">
        <FadeIn>
          <PagePrelude>selected systems</PagePrelude>
        </FadeIn>
        <ContentBlocks>
          {selectedProjects.map((project, index) => (
            <FadeIn key={project.slug} delay={0.04 + index * 0.04}>
              <CardBlock>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.16em] text-accent-400">{project.title}</p>
                    <p className="text-sm text-secondary mt-1">{project.summary}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    {project.links?.page && (
                      <Link href={project.links.page} className="text-accent-400 hover:underline">
                        case study
                      </Link>
                    )}
                    {project.links?.repo && (
                      <a href={project.links.repo} target="_blank" rel="noopener noreferrer" className="text-tertiary hover:text-body hover:underline">
                        repo
                      </a>
                    )}
                  </div>
                </div>
              </CardBlock>
            </FadeIn>
          ))}
        </ContentBlocks>
      </section>

      <section className="flex flex-col gap-4" id="plugins">
        <FadeIn>
          <PagePrelude>plugins + hooks</PagePrelude>
        </FadeIn>

        <ContentBlocks>
          {plugins.slice(0, 4).map((plugin, index) => (
            <FadeIn key={plugin.slug} delay={0.03 + index * 0.03}>
              <TipCard
                name={plugin.name}
                tagline={plugin.tagline}
                install={plugin.install}
                href={plugin.href}
                features={plugin.features}
                flagship={plugin.flagship}
              />
            </FadeIn>
          ))}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {hooks.slice(0, 6).map((hook) => (
              <CardBlock key={hook.name}>
                <a href={hook.href} target="_blank" rel="noopener noreferrer" className="group flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-accent-400 text-xs uppercase tracking-[0.16em]">{hook.name}</span>
                    <span className="text-[10px] uppercase tracking-[0.16em] text-muted bg-input border border-border-subtle px-1.5 py-0.5 rounded">
                      {hook.event}
                    </span>
                  </div>
                  <p className="text-xs text-tertiary group-hover:text-secondary transition-colors">
                    {hook.desc}
                  </p>
                </a>
              </CardBlock>
            ))}
          </div>
        </ContentBlocks>
      </section>

      <section className="flex flex-col gap-4" id="playbooks">
        <FadeIn>
          <PagePrelude>playbooks + docs</PagePrelude>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {guideTiers.map((tier) => (
            <CardBlock key={tier.level}>
              <a href={tier.href} target="_blank" rel="noopener noreferrer" className="group block">
                <p className="text-xs uppercase tracking-[0.16em] text-accent-400">{tier.level}</p>
                <p className="text-base font-heading text-secondary mt-1 group-hover:text-heading transition-colors">
                  {tier.label}
                </p>
                <p className="text-xs text-tertiary mt-2">{tier.topics.join(" · ")}</p>
              </a>
            </CardBlock>
          ))}

          {docs.slice(0, 4).map((doc) => (
            <CardBlock key={doc.name}>
              <a href={doc.href} target="_blank" rel="noopener noreferrer" className="group block">
                <p className="text-xs uppercase tracking-[0.16em] text-accent-400">doc</p>
                <p className="text-sm text-secondary group-hover:text-heading transition-colors mt-1">
                  {doc.name}
                </p>
                <p className="text-xs text-tertiary mt-1">{doc.desc}</p>
              </a>
            </CardBlock>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4" id="work-together">
        <FadeIn>
          <PagePrelude>work together</PagePrelude>
        </FadeIn>
        <CardBlock>
          <div className="flex flex-col gap-3">
            <p className="text-secondary leading-relaxed">
              If you need execution support on Claude Code workflows, agent architecture, or repo automation, I can help you ship faster.
            </p>
            <div className="flex items-center gap-4 text-xs font-mono">
              <Link href="/connect?intent=claude-consulting" className="text-accent-400 hover:underline">
                /connect --intent=claude-consulting
              </Link>
              <a href={REPO} target="_blank" rel="noopener noreferrer" className="text-tertiary hover:text-body hover:underline">
                {BLOB ? "view repo" : "repo"}
              </a>
            </div>
          </div>
        </CardBlock>
      </section>
    </PageFrame>
  );
}
