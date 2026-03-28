import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { Stagger } from "@anipotts/ui";
import { getProjectBySlug, projectEntries } from "@/content/projects";
import { projectContent } from "@/data/project-content";
import {
  BackLink,
  MetaLine,
  PageFrame,
  PageSummary,
  PageTitle,
  SectionBlock,
  StatusBadge,
  TagList,
} from "@/components/page/PageScaffold";

export async function generateStaticParams() {
  return projectEntries
    .filter(
      (project) =>
        project.links?.page && project.publishState === "publish_now",
    )
    .map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    return { title: "Project Not Found" };
  }

  return {
    title: `${project.title} | Ani Potts`,
    description: project.description,
    openGraph: {
      title: project.title,
      description: project.description,
      url: `https://anipotts.com/projects/${project.slug}`,
    },
    alternates: {
      canonical: `https://anipotts.com/projects/${project.slug}`,
    },
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  const content = project ? projectContent[project.slug] : null;

  if (!project || project.publishState !== "publish_now") {
    notFound();
  }

  return (
    <PageFrame>
      <Stagger>
        <BackLink href="/work">back to work</BackLink>
      </Stagger>

      <Stagger as="section" className="flex flex-col gap-4" offset={0.06}>
        <div className="flex items-center gap-3 flex-wrap">
          <PageTitle>{project.title}</PageTitle>
          {project.status && <StatusBadge status={project.status} />}
        </div>
        <PageSummary>{project.subtitle}</PageSummary>
        <MetaLine
          items={[
            { label: "role", value: project.role },
            { label: "duration", value: project.duration },
          ]}
        />
        <TagList tags={project.tags} />
        <div className="flex flex-wrap gap-4 text-xs font-mono">
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
      </Stagger>

      <SectionBlock label="overview">
        <p className="text-secondary leading-relaxed text-base md:text-lg">
          {content?.overview || project.description}
        </p>
      </SectionBlock>

      {content?.technical && (
        <SectionBlock label="technical">
          <Stagger className="flex flex-col gap-5" interval={0.04}>
            {content.technical.map((section) => (
              <div key={section.title} className="border-l border-border pl-4">
                <h3 className="text-sm font-semibold text-body mb-1">
                  {section.title}
                </h3>
                <p className="text-sm text-tertiary leading-relaxed">
                  {section.content}
                </p>
              </div>
            ))}
          </Stagger>
        </SectionBlock>
      )}

      {content?.roadmap && (
        <SectionBlock label="next">
          <Stagger className="flex flex-col gap-3" interval={0.03}>
            {content.roadmap.map((item, index) => (
              <div
                key={`${item.text}-${index}`}
                className="flex items-start gap-3 text-sm"
              >
                <span
                  className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                    item.status === "done"
                      ? "text-green-400 bg-green-500/10"
                      : item.status === "in-progress"
                        ? "text-yellow-400 bg-yellow-500/10"
                        : "text-muted bg-gray-500/10"
                  }`}
                >
                  {item.status === "done" ? (
                    "\u2713"
                  ) : item.status === "in-progress" ? (
                    <CaretRight size={10} />
                  ) : (
                    "\u25CB"
                  )}
                </span>
                <span
                  className={
                    item.status === "done" ? "text-muted" : "text-secondary"
                  }
                >
                  {item.text}
                </span>
              </div>
            ))}
          </Stagger>
        </SectionBlock>
      )}

      {content?.relatedThoughts && content.relatedThoughts.length > 0 && (
        <SectionBlock label="related thoughts">
          <Stagger className="flex flex-col gap-2" interval={0.03}>
            {content.relatedThoughts.map((thought) => (
              <Link
                key={thought.slug}
                href={`/thoughts/${thought.slug}`}
                className="text-sm text-tertiary hover:text-accent-400 transition-colors duration-200 inline-flex items-center gap-1.5"
              >
                <ArrowRight size={12} /> {thought.title}
              </Link>
            ))}
          </Stagger>
        </SectionBlock>
      )}
    </PageFrame>
  );
}
