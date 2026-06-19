import type {
  CmsProjectContent,
  CmsWritingContent,
  NewsletterContent,
} from "@anipotts/types";

export type EditorKind = "project" | "writing" | "newsletter";

export type EditorSelection = { kind: EditorKind; id: string };

export type EditorItem =
  | { kind: "project"; id: string; label: string; meta: string }
  | { kind: "writing"; id: string; label: string; meta: string }
  | { kind: "newsletter"; id: "newsletter"; label: string; meta: string };

export interface SiteContentEditorProps {
  projects: CmsProjectContent[];
  writing: CmsWritingContent[];
  newsletter: NewsletterContent;
  newsletterMeta: {
    source: "cms" | "d1" | "fallback";
    updated_at: string | null;
    version: number | null;
  };
}

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function projectKey(project: CmsProjectContent) {
  return project.id ?? project.slug;
}

export function writingKey(item: CmsWritingContent) {
  return item.id ?? item.slug;
}

export function getInitialEditorSelection(
  projects: CmsProjectContent[],
  writing: CmsWritingContent[],
): EditorSelection {
  const firstProject = projects[0];
  if (firstProject) return { kind: "project", id: projectKey(firstProject) };

  const firstWriting = writing[0];
  if (firstWriting) return { kind: "writing", id: writingKey(firstWriting) };

  return { kind: "newsletter", id: "newsletter" };
}

export function buildEditorItems({
  projects,
  writing,
  newsletterSource,
  newsletterVersion,
  query,
}: {
  projects: CmsProjectContent[];
  writing: CmsWritingContent[];
  newsletterSource: "cms" | "d1" | "fallback";
  newsletterVersion: number | null;
  query: string;
}): EditorItem[] {
  const all: EditorItem[] = [
    ...projects.map((project) => ({
      kind: "project" as const,
      id: projectKey(project),
      label: project.title || project.slug,
      meta: `${project.visible ? "visible" : "hidden"} / ${project.status}`,
    })),
    ...writing.map((item) => ({
      kind: "writing" as const,
      id: writingKey(item),
      label: item.title || item.slug,
      meta: `${item.visible ? "published" : "draft"} / ${item.date || "undated"}`,
    })),
    {
      kind: "newsletter",
      id: "newsletter",
      label: "newsletter copy",
      meta:
        newsletterSource === "cms"
          ? `cms v${newsletterVersion ?? 1}`
          : "fallback",
    },
  ];

  const needle = query.trim().toLowerCase();
  if (!needle) return all;

  return all.filter(
    (item) =>
      item.label.toLowerCase().includes(needle) ||
      item.meta.toLowerCase().includes(needle) ||
      item.kind.includes(needle),
  );
}

export function validateEditorContent({
  active,
  project,
  writing,
  newsletter,
}: {
  active: EditorSelection;
  project: CmsProjectContent | null;
  writing: CmsWritingContent | null;
  newsletter: NewsletterContent;
}) {
  if (project) {
    if (!project.title.trim()) return "Project title is required";
    if (!project.summary.trim()) return "Project summary is required";
    if (!project.body.trim()) return "Project body is required";
  }

  if (writing) {
    if (!writing.title.trim()) return "Writing title is required";
    if (!writing.preview.trim()) return "Writing preview is required";
    if (!writing.body.trim()) return "Writing body is required";
  }

  if (active.kind === "newsletter") {
    if (!newsletter.headline.trim()) return "Newsletter headline is required";
    if (!newsletter.deck.trim()) return "Newsletter deck is required";
  }

  return null;
}
