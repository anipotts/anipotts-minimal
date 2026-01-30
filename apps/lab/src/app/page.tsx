import { FadeIn } from "@anipotts/ui";
import { FaFlask, FaGithub, FaExternalLinkAlt } from "react-icons/fa";
import { projects } from "@anipotts/lib/data";

// Show projects that have a repo link — these are real, explorable work
const explorable = projects.filter((p) => p.links?.repo);

export default function LabPage() {
  return (
    <div className="flex flex-col gap-8 py-8 px-4 max-w-4xl mx-auto">
      <FadeIn>
        <div className="border-b border-border pb-6">
          <h1 className="text-xs uppercase tracking-widest text-accent-400 mb-2">
            Lab
          </h1>
          <p className="text-muted text-sm">
            Experiments, side projects, and open-source work
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-muted flex items-center gap-2">
            <FaFlask className="text-accent-400" />
            Open Source
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {explorable.map((project, i) => (
              <FadeIn key={project.slug} delay={0.1 + i * 0.05}>
                <div className="flex flex-col justify-between h-full p-4 bg-input border border-border rounded-lg hover:border-accent-400/20 transition-all group">
                  <div className="mb-3">
                    <h3 className="text-white font-medium mb-1">
                      {project.title}
                    </h3>
                    <p className="text-muted text-sm leading-relaxed">
                      {project.subtitle}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      {project.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-1.5 py-0.5 bg-[rgba(var(--overlay-invert),0.4)] border border-border-subtle rounded text-muted"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      {project.links?.repo && (
                        <a
                          href={project.links.repo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-faint hover:text-accent-400 transition-colors"
                          title="View source"
                        >
                          <FaGithub />
                        </a>
                      )}
                      {project.links?.live && (
                        <a
                          href={project.links.live}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-faint hover:text-accent-400 transition-colors"
                          title="View live"
                        >
                          <FaExternalLinkAlt className="text-xs" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.4}>
        <div className="p-5 bg-accent-400/5 border border-accent-400/20 rounded-lg">
          <h2 className="text-xs uppercase tracking-widest text-accent-400 mb-3">
            This Site
          </h2>
          <p className="text-sm text-tertiary mb-3">
            anipotts.com is itself an experiment — a Turborepo monorepo with 10
            Next.js apps sharing a unified UI library, data layer, and admin
            system. The terminal window UI is a custom state machine with four
            modes: open, collapsed, minimized, and fullscreen.
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              "Turborepo",
              "Next.js 16",
              "React 19",
              "Tailwind 4",
              "Framer Motion",
              "Supabase",
              "PostHog",
            ].map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-1 bg-[rgba(var(--overlay-invert),0.4)] border border-border rounded text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
