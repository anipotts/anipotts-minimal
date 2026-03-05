import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { FadeIn } from "@anipotts/ui";
import { getProjectBySlug, projectEntries } from "@/content/projects";
import { projectContent } from "@/data/project-content";

export async function generateStaticParams() {
  return projectEntries
    .filter((project) => project.links?.page && project.publishState === "publish_now")
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
    <div className="flex flex-col gap-14 pb-20 max-w-4xl mx-auto w-full">
      <section className="flex flex-col gap-5">
        <FadeIn>
          <Link
            href="/work"
            className="text-xs font-mono text-muted hover:text-accent-400 transition-colors inline-flex items-center gap-1"
          >
            <ArrowLeft size={12} /> back to work
          </Link>
        </FadeIn>

        <FadeIn delay={0.04}>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-4xl md:text-5xl font-semibold font-heading text-heading">
              {project.title}
            </h1>
            {project.status === "live" && (
              <span className="text-[10px] uppercase tracking-wider text-green-400 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded">
                live
              </span>
            )}
          </div>
          <p className="text-secondary mt-2 text-lg">{project.subtitle}</p>
        </FadeIn>

        <FadeIn delay={0.08}>
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
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="flex flex-wrap gap-4 text-xs font-mono">
            {project.links?.live && (
              <a
                href={project.links.live}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-400 hover:underline"
              >
                ./launch_site.sh
              </a>
            )}
            {project.links?.repo && (
              <a
                href={project.links.repo}
                target="_blank"
                rel="noopener noreferrer"
                className="text-tertiary hover:text-body hover:underline"
              >
                ./view_source.git
              </a>
            )}
          </div>
        </FadeIn>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xs uppercase tracking-[0.16em] text-accent-400">overview</h2>
        <p className="text-secondary leading-relaxed text-base md:text-lg">
          {content?.overview || project.description}
        </p>
      </section>

      {content?.technical && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xs uppercase tracking-[0.16em] text-accent-400">technical</h2>
          <div className="flex flex-col gap-5">
            {content.technical.map((section) => (
              <div key={section.title} className="border-l border-border pl-4">
                <h3 className="text-sm font-semibold text-body mb-1">{section.title}</h3>
                <p className="text-sm text-tertiary leading-relaxed">{section.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {content?.roadmap && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xs uppercase tracking-[0.16em] text-accent-400">next</h2>
          <div className="flex flex-col gap-3">
            {content.roadmap.map((item, index) => (
              <div key={`${item.text}-${index}`} className="flex items-start gap-3 text-sm">
                <span
                  className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                    item.status === "done"
                      ? "text-green-400 bg-green-500/10"
                      : item.status === "in-progress"
                        ? "text-yellow-400 bg-yellow-500/10"
                        : "text-muted bg-gray-500/10"
                  }`}
                >
                  {item.status === "done" ? "✓" : item.status === "in-progress" ? <CaretRight size={10} /> : "○"}
                </span>
                <span className={item.status === "done" ? "text-muted" : "text-secondary"}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {content?.relatedThoughts && content.relatedThoughts.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs uppercase tracking-[0.16em] text-accent-400">related thoughts</h2>
          <div className="flex flex-col gap-2">
            {content.relatedThoughts.map((thought) => (
              <Link
                key={thought.slug}
                href={`/thoughts/${thought.slug}`}
                className="text-sm text-tertiary hover:text-accent-400 transition-colors inline-flex items-center gap-1.5"
              >
                <ArrowRight size={12} /> {thought.title}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
