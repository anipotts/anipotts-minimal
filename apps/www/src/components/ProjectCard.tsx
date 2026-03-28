import Link from "next/link";
import type { ProjectEntry } from "@/content/projects";
import { StatusBadge, TagList } from "@/components/page/PageScaffold";

export default function ProjectCard({ project }: { project: ProjectEntry }) {
  return (
    <article className="w-full">
      <details className="group border-l-2 border-border transition-all duration-300 hover:border-overlay-30 hover:bg-overlay-5 open:border-accent-400/40 open:bg-overlay-5">
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
                {project.status && <StatusBadge status={project.status} />}
              </div>
              <p className="text-xs text-muted pl-8">{project.subtitle}</p>
            </div>
            <span className="text-xs text-faint font-mono shrink-0">
              {project.duration || project.year}
            </span>
          </div>
        </summary>

        <div className="pl-8 pr-4 pb-4 pt-3 flex flex-col gap-5">
          <p className="text-sm text-secondary leading-relaxed max-w-2xl border-l border-border pl-4">
            {project.description}
          </p>

          <TagList tags={project.tags} />

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
