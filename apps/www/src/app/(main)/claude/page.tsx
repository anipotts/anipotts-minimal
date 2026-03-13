import type { Metadata } from "next";
import Link from "next/link";
import { FadeIn } from "@anipotts/ui";
import { TipCard } from "./TipCard";
import { ThroughputChart } from "./ThroughputChart";
import { SessionTable } from "./SessionTable";
import { formatDuration } from "./format";
import claudeStats from "./claude-stats.json";
import { BLOB, REPO, docs, guideTiers, hooks, plugins } from "./data";
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
  description:
    "Claude Code systems, playbooks, and implementation patterns from ani potts",
  openGraph: {
    title: "claude | ani potts",
    description:
      "Claude Code systems, playbooks, and implementation patterns from ani potts",
    url: "https://anipotts.com/claude",
  },
  alternates: {
    canonical: "https://anipotts.com/claude",
  },
};

const formatNumber = (value: number) => value.toLocaleString();

const formatHumanTime = (minutes: number) => {
  const hours = Math.round(minutes / 60);
  if (hours < 48) {
    return `${hours.toLocaleString()}h`;
  }
  const days = Math.round(hours / 8);
  return `${hours.toLocaleString()}h (${days.toLocaleString()}d @ 8h)`;
};

const formatUpdatedDate = (value: string, timeZone: string) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));

const formatUpdatedTime = (value: string, timeZone: string) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

export default function ClaudePage() {
  const selectedProjects = getFeaturedProjects(3);
  const liveClass = claudeStats.live.isCodingNow
    ? "bg-accent-400 animate-pulse"
    : "bg-muted/40";
  const updatedDate = formatUpdatedDate(
    claudeStats.generatedAt,
    claudeStats.timezone,
  );
  const updatedTime = formatUpdatedTime(
    claudeStats.generatedAt,
    claudeStats.timezone,
  );

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
            I design practical workflows for coding agents, quality gates, and
            high-velocity implementation loops.
          </PageSummary>
        </FadeIn>
        <FadeIn delay={0.12}>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <CardBlock>
              <p className="text-[10px] uppercase tracking-[0.16em] text-faint">
                sessions
              </p>
              <p className="text-2xl font-heading text-accent-400 mt-1">
                {formatNumber(claudeStats.totals.sessions)}
              </p>
            </CardBlock>
            <CardBlock>
              <p className="text-[10px] uppercase tracking-[0.16em] text-faint">
                tool calls
              </p>
              <p className="text-2xl font-heading text-accent-400 mt-1">
                {formatNumber(claudeStats.totals.toolCalls)}
              </p>
            </CardBlock>
            <CardBlock>
              <p className="text-[10px] uppercase tracking-[0.16em] text-faint">
                files mutated
              </p>
              <p className="text-2xl font-heading text-accent-400 mt-1">
                {formatNumber(claudeStats.totals.filesMutated)}
              </p>
            </CardBlock>
            <CardBlock>
              <p className="text-[10px] uppercase tracking-[0.16em] text-faint">
                human time saved
              </p>
              <p className="text-2xl font-heading text-accent-400 mt-1">
                {formatHumanTime(claudeStats.totals.humanMinutesSaved)}
              </p>
            </CardBlock>
            <CardBlock>
              <p className="text-[10px] uppercase tracking-[0.16em] text-faint">
                current streak
              </p>
              <p className="text-2xl font-heading text-accent-400 mt-1">
                {claudeStats.totals.streakDays}d
              </p>
            </CardBlock>
          </div>
        </FadeIn>
        <FadeIn delay={0.16}>
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-tertiary">
            <span className="inline-flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${liveClass}`} />
              {claudeStats.live.isCodingNow ? "coding now" : "idle"}
            </span>
            <span className="text-muted">
              last updated {updatedDate} · {updatedTime} ({claudeStats.timezone}
              )
            </span>
          </div>
        </FadeIn>
      </section>

      <section className="flex flex-col gap-4" id="leaderboard">
        <FadeIn>
          <PagePrelude>code time leaderboard</PagePrelude>
        </FadeIn>
        <FadeIn delay={0.04}>
          <PageSummary>
            Live session telemetry across Claude Code projects, tuned to show
            how quickly AI-assisted shipping compresses timelines.
          </PageSummary>
        </FadeIn>
        <ContentBlocks>
          <FadeIn delay={0.08}>
            <CardBlock>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between text-xs font-mono text-tertiary">
                  <span>throughput · last 30 days</span>
                  <span>{claudeStats.timezone}</span>
                </div>
                <ThroughputChart data={claudeStats.daily} />
              </div>
            </CardBlock>
          </FadeIn>
          <FadeIn delay={0.12}>
            <CardBlock>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between text-xs font-mono text-tertiary">
                  <span>session history · last 20</span>
                  <span>sortable</span>
                </div>
                <SessionTable
                  sessions={claudeStats.sessions}
                  timezone={claudeStats.timezone}
                />
              </div>
            </CardBlock>
          </FadeIn>
        </ContentBlocks>
      </section>

      <section className="flex flex-col gap-4" id="burst-records">
        <FadeIn>
          <PagePrelude>burst records</PagePrelude>
        </FadeIn>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <CardBlock>
            <p className="text-[10px] uppercase tracking-[0.16em] text-faint">
              fastest commit cadence
            </p>
            <p className="text-xl font-heading text-accent-400 mt-1">
              {claudeStats.records.fastestCommitCadence.commitsPerHour.toLocaleString()}{" "}
              commits/hour
            </p>
            <p className="text-xs text-tertiary mt-2">
              {claudeStats.records.fastestCommitCadence.repo
                ? `${claudeStats.records.fastestCommitCadence.repo}${claudeStats.records.fastestCommitCadence.windowStart ? ` · ${claudeStats.records.fastestCommitCadence.windowStart.slice(0, 10)}` : ""}`
                : "no git data"}
            </p>
          </CardBlock>
          <CardBlock>
            <p className="text-[10px] uppercase tracking-[0.16em] text-faint">
              most files changed
            </p>
            <p className="text-xl font-heading text-accent-400 mt-1">
              {claudeStats.records.mostFilesChanged.files.toLocaleString()}{" "}
              files
            </p>
            <p className="text-xs text-tertiary mt-2">
              {claudeStats.records.mostFilesChanged.project
                ? `${claudeStats.records.mostFilesChanged.project}${claudeStats.records.mostFilesChanged.startedAt ? ` · ${claudeStats.records.mostFilesChanged.startedAt.slice(0, 10)}` : ""}`
                : "no session data"}
            </p>
          </CardBlock>
          <CardBlock>
            <p className="text-[10px] uppercase tracking-[0.16em] text-faint">
              longest session
            </p>
            <p className="text-xl font-heading text-accent-400 mt-1">
              {formatDuration(
                claudeStats.records.longestSession.durationMinutes,
              )}
            </p>
            <p className="text-xs text-tertiary mt-2">
              {claudeStats.records.longestSession.project
                ? `${claudeStats.records.longestSession.project}${claudeStats.records.longestSession.startedAt ? ` · ${claudeStats.records.longestSession.startedAt.slice(0, 10)}` : ""}`
                : "no session data"}
            </p>
          </CardBlock>
          <CardBlock>
            <p className="text-[10px] uppercase tracking-[0.16em] text-faint">
              most tool calls
            </p>
            <p className="text-xl font-heading text-accent-400 mt-1">
              {claudeStats.records.mostToolCalls.toolCalls.toLocaleString()}{" "}
              calls
            </p>
            <p className="text-xs text-tertiary mt-2">
              {claudeStats.records.mostToolCalls.project
                ? `${claudeStats.records.mostToolCalls.project}${claudeStats.records.mostToolCalls.startedAt ? ` · ${claudeStats.records.mostToolCalls.startedAt.slice(0, 10)}` : ""}`
                : "no session data"}
            </p>
          </CardBlock>
        </div>
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
                    <p className="text-sm uppercase tracking-[0.16em] text-accent-400">
                      {project.title}
                    </p>
                    <p className="text-sm text-secondary mt-1">
                      {project.summary}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    {project.links?.page && (
                      <Link
                        href={project.links.page}
                        className="text-accent-400 hover:underline"
                      >
                        case study
                      </Link>
                    )}
                    {project.links?.repo && (
                      <a
                        href={project.links.repo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-tertiary hover:text-body hover:underline"
                      >
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
              />
            </FadeIn>
          ))}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {hooks.slice(0, 6).map((hook) => (
              <CardBlock key={hook.name}>
                <a
                  href={hook.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-accent-400 text-xs uppercase tracking-[0.16em]">
                      {hook.name}
                    </span>
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
              <a
                href={tier.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <p className="text-xs uppercase tracking-[0.16em] text-accent-400">
                  {tier.level}
                </p>
                <p className="text-base font-heading text-secondary mt-1 group-hover:text-heading transition-colors">
                  {tier.label}
                </p>
                <p className="text-xs text-tertiary mt-2">
                  {tier.topics.join(" · ")}
                </p>
              </a>
            </CardBlock>
          ))}

          {docs.slice(0, 4).map((doc) => (
            <CardBlock key={doc.name}>
              <a
                href={doc.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <p className="text-xs uppercase tracking-[0.16em] text-accent-400">
                  doc
                </p>
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
              If you need execution support on Claude Code workflows, agent
              architecture, or repo automation, I can help you ship faster.
            </p>
            <div className="flex items-center gap-4 text-xs font-mono">
              <Link
                href="/connect?intent=claude-consulting"
                className="text-accent-400 hover:underline"
              >
                /connect --intent=claude-consulting
              </Link>
              <a
                href={REPO}
                target="_blank"
                rel="noopener noreferrer"
                className="text-tertiary hover:text-body hover:underline"
              >
                {BLOB ? "view repo" : "repo"}
              </a>
            </div>
          </div>
        </CardBlock>
      </section>
    </PageFrame>
  );
}
