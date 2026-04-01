import Link from "next/link";
import type { ProjectEntry } from "@/content/projects";
import { MetaLine, StatusBadge, TagList } from "@/components/page/PageScaffold";

export default function ProjectCard({ project }: { project: ProjectEntry }) {
  return (
    <article className="w-full" data-no-flow>
      <details className="group rounded-md p-3 -m-3 border border-transparent hover:border-accent-400/20 hover:bg-accent-400/5 transition-all duration-200 open:border-accent-400/20 open:bg-accent-400/5">
        <summary className="list-none cursor-pointer">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-1">
              <div className="flex items-center gap-2">
                <span className="text-muted text-xs font-mono group-open:text-accent-400 transition-colors">
                  <span className="group-open:hidden">+</span>
                  <span className="hidden group-open:inline">&minus;</span>
                </span>
                <h3 className="text-lg font-semibold text-body group-hover:text-accent-400 transition-colors duration-200 font-heading">
                  {project.title}
                </h3>
                {project.status && <StatusBadge status={project.status} />}
              </div>
              <MetaLine
                items={[{ value: project.duration || project.year || "" }]}
                className="shrink-0"
              />
            </div>
            <p className="text-secondary leading-relaxed text-sm">
              {project.subtitle}
            </p>
          </div>
        </summary>

        <div className="pt-4 flex flex-col gap-4">
          <p className="text-secondary leading-relaxed text-sm max-w-2xl">
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
                  className="text-accent-400 hover:underline underline-offset-4"
                >
                  case study
                </Link>
              )}
              {project.links?.live && (
                <a
                  href={project.links.live}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-400 hover:underline underline-offset-4"
                >
                  live site
                </a>
              )}
              {project.links?.repo && (
                <a
                  href={project.links.repo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-tertiary hover:text-body hover:underline underline-offset-4"
                >
                  source
                </a>
              )}
            </div>
          )}
        </div>
      </details>
    </article>
  );
}
