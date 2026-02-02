import { FadeIn } from "@anipotts/ui";
import { FaBook, FaGithub, FaCubes, FaNetworkWired } from "react-icons/fa";
import { subdomains, site } from "@anipotts/lib/data";
import { projects } from "@anipotts/lib/data";

const projectsWithDocs = projects.filter((p) => p.links?.repo);

export default function DocsPage() {
  return (
    <div className="flex flex-col gap-8 py-8 px-4 max-w-4xl mx-auto">
      <FadeIn>
        <div className="border-b border-border pb-6">
          <h1 className="text-xs uppercase tracking-widest text-accent-400 mb-2">
            Documentation
          </h1>
          <p className="text-muted text-sm">
            Architecture reference for the {site.domain} ecosystem
          </p>
        </div>
      </FadeIn>

      {/* Ecosystem map */}
      <FadeIn delay={0.1}>
        <div className="space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-muted flex items-center gap-2">
            <FaNetworkWired className="text-accent-400" />
            Subdomains
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {subdomains.map((sub) => (
              <a
                key={sub.name}
                href={sub.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-input border border-border rounded-lg hover:border-accent-400/20 transition-all group"
              >
                <span className="text-accent-400 font-mono text-sm">
                  {sub.name}
                </span>
                <span className="text-faint text-xs">{sub.desc}</span>
              </a>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* Architecture overview */}
      <FadeIn delay={0.2}>
        <div className="p-5 bg-input border border-border rounded-lg">
          <h2 className="text-xs uppercase tracking-widest text-muted mb-4 flex items-center gap-2">
            <FaCubes className="text-accent-400" />
            Architecture
          </h2>
          <pre className="text-xs text-tertiary font-mono overflow-x-auto leading-relaxed">
{`anipotts.com/
├── apps/
│   ├── www          # Main site (anipotts.com)
│   ├── thoughts     # Blog (thoughts.anipotts.com)
│   ├── dev          # Tech stack (dev.anipotts.com)
│   ├── links        # Link tree (links.anipotts.com)
│   ├── updates      # Changelog (updates.anipotts.com)
│   ├── metrics      # GitHub + WakaTime stats
│   ├── status       # Service uptime monitoring
│   ├── lab          # Experiments & open source
│   └── docs         # This page
├── packages/
│   ├── ui           # Shared React components
│   ├── lib          # Business logic & API clients
│   ├── types        # Shared TypeScript types
│   ├── config       # Shared configs (Tailwind, ESLint)
│   └── styles       # Shared CSS (tokens, fonts)
└── turbo.json       # Turborepo pipeline config`}
          </pre>
        </div>
      </FadeIn>

      {/* Project repos */}
      <FadeIn delay={0.3}>
        <div className="space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-muted flex items-center gap-2">
            <FaBook className="text-accent-400" />
            Project Repos
          </h2>
          <div className="space-y-2">
            {projectsWithDocs.map((project) => (
              <a
                key={project.slug}
                href={project.links!.repo!}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-input border border-border rounded-lg hover:border-accent-400/20 transition-all group"
              >
                <div>
                  <span className="text-secondary text-sm font-medium group-hover:text-accent-400 transition-colors">
                    {project.title}
                  </span>
                  <span className="text-faint text-xs ml-2">
                    {project.subtitle}
                  </span>
                </div>
                <FaGithub className="text-faint group-hover:text-accent-400 transition-colors" />
              </a>
            ))}
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.4}>
        <div className="text-center pt-4 border-t border-border-subtle">
          <p className="text-xs text-faint">
            Full documentation coming soon • Source on{" "}
            <a
              href={`https://github.com/${site.github}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-400 hover:underline"
            >
              GitHub
            </a>
          </p>
        </div>
      </FadeIn>
    </div>
  );
}
