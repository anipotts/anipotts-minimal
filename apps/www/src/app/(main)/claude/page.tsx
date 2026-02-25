import type { Metadata } from "next";
import { FadeIn } from "@anipotts/ui";
import { TipCard } from "./TipCard";
import {
  REPO,
  BLOB,
  plugins,
  hooks,
  skills,
  agents,
  guideTiers,
  docs,
  stats,
} from "./data";

export const metadata: Metadata = {
  title: "claude code tips",
  description:
    "plugins, hooks, agents, and a comprehensive guide for claude code. tested across 4,000+ sessions.",
  openGraph: {
    title: "claude code tips | ani potts",
    description:
      "plugins, hooks, agents, and a comprehensive guide for claude code",
    url: "https://anipotts.com/claude",
    siteName: "ani potts",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "claude code tips | ani potts",
    description:
      "plugins, hooks, agents, and a comprehensive guide for claude code",
  },
  alternates: {
    canonical: "https://anipotts.com/claude",
  },
};

export default function ClaudePage() {
  let delayCounter = 0;
  const nextDelay = () => delayCounter++ * 0.04;

  return (
    <div className="flex flex-col gap-16 md:gap-20 pb-20">
      {/* Hero */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1">
          <FadeIn delay={nextDelay()}>
            <span className="text-sm font-mono tracking-widest uppercase text-accent-400">
              claude
            </span>
          </FadeIn>
        </div>
        <div className="col-span-1 md:col-span-3 flex flex-col gap-6">
          <FadeIn delay={nextDelay()}>
            <h1 className="text-4xl md:text-5xl font-bold font-heading text-heading">
              claude-code-tips
            </h1>
          </FadeIn>
          <FadeIn delay={nextDelay()}>
            <p className="text-lg text-secondary leading-relaxed">
              plugins, hooks, agents, and a comprehensive guide for getting the
              most out of claude code.
            </p>
          </FadeIn>
          <FadeIn delay={nextDelay()}>
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-muted">
              <span>
                <span className="text-accent-400">{stats.sessions}</span>{" "}
                sessions
              </span>
              <span className="text-border">|</span>
              <span>
                <span className="text-accent-400">{stats.messages}</span>{" "}
                messages
              </span>
              <span className="text-border">|</span>
              <span>
                <span className="text-accent-400">{stats.toolCalls}</span> tool
                calls
              </span>
            </div>
          </FadeIn>
          <FadeIn delay={nextDelay()}>
            <a
              href={REPO}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-accent-400 hover:underline decoration-accent-400/30 underline-offset-4 inline-flex items-center gap-1.5 w-fit"
            >
              ./view_repo.git
            </a>
          </FadeIn>
        </div>
      </section>

      {/* Plugins */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1">
          <FadeIn delay={nextDelay()}>
            <span className="text-sm font-mono tracking-widest uppercase text-accent-400">
              plugins
            </span>
          </FadeIn>
        </div>
        <div className="col-span-1 md:col-span-3 flex flex-col gap-4">
          <FadeIn delay={nextDelay()}>
            <p className="text-secondary text-base leading-relaxed">
              installable plugins that extend claude code with new capabilities.
              click to expand.
            </p>
          </FadeIn>
          {plugins.map((plugin) => (
            <FadeIn key={plugin.slug} delay={nextDelay()}>
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
        </div>
      </section>

      {/* Hooks */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1">
          <FadeIn delay={nextDelay()}>
            <span className="text-sm font-mono tracking-widest uppercase text-accent-400">
              hooks
            </span>
          </FadeIn>
        </div>
        <div className="col-span-1 md:col-span-3">
          <div className="flex flex-col gap-3">
            {hooks.map((hook) => (
              <FadeIn key={hook.name} delay={nextDelay()}>
                <a
                  href={hook.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3 py-2 min-h-[44px]"
                >
                  <span className="text-accent-400 font-mono text-xs font-bold shrink-0 pt-0.5 group-hover:underline decoration-accent-400/30 underline-offset-4">
                    {hook.name}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-muted bg-input border border-border-subtle px-1.5 py-0.5 rounded shrink-0">
                    {hook.event}
                  </span>
                  <span className="text-tertiary text-xs leading-relaxed">
                    {hook.desc}
                  </span>
                </a>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Skills & Commands */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1">
          <FadeIn delay={nextDelay()}>
            <span className="text-sm font-mono tracking-widest uppercase text-accent-400">
              skills
            </span>
          </FadeIn>
        </div>
        <div className="col-span-1 md:col-span-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
            {skills.map((skill) => (
              <FadeIn key={skill.name} delay={nextDelay()}>
                <a
                  href={skill.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-baseline gap-2 py-1.5 min-h-[44px] items-center"
                >
                  <code className="text-accent-400 text-xs font-mono font-bold group-hover:underline decoration-accent-400/30 underline-offset-4">
                    {skill.name}
                  </code>
                  <span className="text-tertiary text-xs">{skill.desc}</span>
                </a>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Agents */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1">
          <FadeIn delay={nextDelay()}>
            <span className="text-sm font-mono tracking-widest uppercase text-accent-400">
              agents
            </span>
          </FadeIn>
        </div>
        <div className="col-span-1 md:col-span-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
            {agents.map((agent) => (
              <FadeIn key={agent.name} delay={nextDelay()}>
                <a
                  href={agent.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-baseline gap-2 py-1.5 min-h-[44px] items-center"
                >
                  <span className="text-accent-400 text-xs font-mono font-bold group-hover:underline decoration-accent-400/30 underline-offset-4">
                    {agent.name}
                  </span>
                  <span className="text-tertiary text-xs">{agent.desc}</span>
                </a>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* The Guide */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1">
          <FadeIn delay={nextDelay()}>
            <span className="text-sm font-mono tracking-widest uppercase text-accent-400">
              the guide
            </span>
          </FadeIn>
        </div>
        <div className="col-span-1 md:col-span-3 flex flex-col gap-6">
          <FadeIn delay={nextDelay()}>
            <p className="text-secondary text-base leading-relaxed">
              a structured path from first session to power user. everything
              learned across {stats.sessions} sessions distilled into one doc.
            </p>
          </FadeIn>
          <div className="flex flex-col gap-4">
            {guideTiers.map((tier, i) => (
              <FadeIn key={tier.level} delay={nextDelay()}>
                <a
                  href={tier.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block border-l-2 border-border hover:border-accent-400 pl-4 py-3 transition-all duration-300"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono text-accent-400 font-bold">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm font-bold text-secondary group-hover:text-heading transition-colors">
                      {tier.label}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-muted">
                      {tier.level}
                    </span>
                  </div>
                  <p className="text-xs text-tertiary pl-6">
                    {tier.topics.join(" · ")}
                  </p>
                </a>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Docs */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1">
          <FadeIn delay={nextDelay()}>
            <span className="text-sm font-mono tracking-widest uppercase text-accent-400">
              docs
            </span>
          </FadeIn>
        </div>
        <div className="col-span-1 md:col-span-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
            {docs.map((doc) => (
              <FadeIn key={doc.name} delay={nextDelay()}>
                <a
                  href={doc.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-baseline gap-2 py-1.5 min-h-[44px] items-center"
                >
                  <span className="text-accent-400 text-xs font-mono font-bold group-hover:underline decoration-accent-400/30 underline-offset-4">
                    {doc.name}
                  </span>
                  <span className="text-tertiary text-xs">{doc.desc}</span>
                </a>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Cost Tracking Callout */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1">
          <FadeIn delay={nextDelay()}>
            <span className="text-sm font-mono tracking-widest uppercase text-accent-400">
              cost tracking
            </span>
          </FadeIn>
        </div>
        <div className="col-span-1 md:col-span-3">
          <FadeIn delay={nextDelay()}>
            <div className="border border-accent-400/20 bg-accent-400/5 rounded-lg p-6 flex flex-col gap-4">
              <p className="text-secondary text-base leading-relaxed">
                the miner plugin tracks every token, every tool call, every
                session. know exactly what you're spending and where the
                value is.
              </p>
              <div className="flex flex-wrap gap-4 text-xs font-mono text-muted">
                <span>per-session cost breakdowns</span>
                <span className="text-border">|</span>
                <span>daily/weekly/monthly reports</span>
                <span className="text-border">|</span>
                <span>tool usage analytics</span>
                <span className="text-border">|</span>
                <span>budget alerts</span>
              </div>
              <a
                href={`${BLOB}/docs/cost-tracking.md`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-accent-400 hover:underline decoration-accent-400/30 underline-offset-4 w-fit"
              >
                ./learn_more.md
              </a>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
