import Link from "next/link";
import type { ProjectEntry } from "@/content/projects";

function StatusBadge({ project }: { project: ProjectEntry }) {
  if (project.status === "in-progress") {
    return (
      <span className="text-[10px] uppercase tracking-wider text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-1.5 py-0.5 rounded font-medium">
        in progress
      </span>
    );
  }

  return null;
}

export default function ProjectCard({ project }: { project: ProjectEntry }) {
  return (
    <article className="w-full">
      <details className="group border-l-2 border-border transition-colors duration-200 hover:border-overlay-30 hover:bg-overlay-5 open:border-accent-400/40">
        <summary className="list-none cursor-pointer pl-4 pr-4 py-3">
          <div className="flex justify-between items-start gap-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 font-mono text-sm">
                <span className="text-muted group-open:hidden">[+]</span>
                <span className="hidden text-accent-400 group-open:inline">
                  [-]
                </span>
                <h3 className="font-semibold text-secondary group-hover:text-heading font-heading">
                  {project.title}
                </h3>
                <StatusBadge project={project} />
              </div>
              <p className="text-xs text-muted pl-6">{project.subtitle}</p>
            </div>
            <span className="text-xs text-faint font-mono shrink-0">
              {project.year}
            </span>
          </div>
        </summary>

        <div className="pl-10 pr-4 pb-5 pt-2 flex flex-col gap-5 animate-[fadeInUp_0.5s_ease-out_both]">
          <p className="text-sm text-secondary leading-relaxed max-w-2xl border-l border-border pl-4">
            {project.description}
          </p>

          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] uppercase tracking-wider text-muted bg-input px-2 py-1 rounded-sm"
              >
                {tag}
              </span>
            ))}
          </div>

          {(project.links?.page ||
            project.links?.live ||
            project.links?.repo) && (
            <div className="flex flex-wrap gap-4 text-xs font-mono">
              {project.links?.page && (
                <Link
                  href={project.links.page}
                  className="text-accent-400 hover:underline decoration-accent-400/30 underline-offset-4"
                >
                  ./case_study.md
                </Link>
              )}
              {project.links?.live && (
                <a
                  href={project.links.live}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-400 hover:underline decoration-accent-400/30 underline-offset-4"
                >
                  ./launch_site.sh
                </a>
              )}
              {project.links?.repo && (
                <a
                  href={project.links.repo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-tertiary hover:text-body hover:underline decoration-overlay-30 underline-offset-4"
                >
                  ./view_source.git
                </a>
              )}
            </div>
          )}
        </div>
      </details>
    </article>
  );
}
