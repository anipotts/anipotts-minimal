import type { Project } from "@anipotts/types";
import { projects as sourceProjects } from "@anipotts/lib/data";

export type WorkPublishState =
  | "publish_now"
  | "placeholder"
  | "improve_then_publish"
  | "archive";

export interface DemoAsset {
  webm?: string;
  gif?: string;
  poster?: string;
  durationMs?: number;
  sizeBytes?: number;
}

export interface ProjectEntry extends Project {
  priority: number;
  publishState: WorkPublishState;
  summary: string;
  demo?: DemoAsset;
}

const PRIORITY_BY_SLUG: Record<string, number> = {
  quantercise: 100,
  "pgi-research-platform": 95,
  "claude-code-tips": 92,
  "imessage-mcp": 91,
  "quantercise-extension": 90,
  chainedchat: 89,
  saeshify: 85,
  "nyu-purity-test": 84,
};

const PLACEHOLDERS: ProjectEntry[] = [];

const mappedSource: ProjectEntry[] = sourceProjects.map((project, index) => {
  const publishState: WorkPublishState = project.featured
    ? "publish_now"
    : project.status === "live"
      ? "improve_then_publish"
      : "placeholder";

  return {
    ...project,
    featured: Boolean(project.featured),
    publishState,
    summary: project.subtitle,
    priority:
      PRIORITY_BY_SLUG[project.slug] ??
      Math.max(40, sourceProjects.length - index),
  };
});

function validateProjectEntries(entries: ProjectEntry[]) {
  const seen = new Set<string>();

  for (const project of entries) {
    if (!project.slug.trim()) {
      throw new Error("[projects] Missing slug");
    }
    if (seen.has(project.slug)) {
      throw new Error(`[projects] Duplicate slug detected: ${project.slug}`);
    }
    seen.add(project.slug);

    if (!project.title.trim()) {
      throw new Error(`[projects] Missing title for ${project.slug}`);
    }
    if (!project.summary.trim()) {
      throw new Error(`[projects] Missing summary for ${project.slug}`);
    }
    if (
      project.publishState === "publish_now" &&
      !project.links?.page &&
      !project.links?.live &&
      !project.links?.repo
    ) {
      throw new Error(
        `[projects] publish_now project requires at least one link: ${project.slug}`,
      );
    }
  }
}

const combinedEntries = [...mappedSource, ...PLACEHOLDERS]
  .filter((project) => project.publishState !== "archive")
  .sort((a, b) => b.priority - a.priority);

validateProjectEntries(combinedEntries);

export const projectEntries: ProjectEntry[] = combinedEntries;

export function getWorkProjects(category?: string): ProjectEntry[] {
  return projectEntries.filter((project) => {
    const categoryMatches =
      !category || category === "all" || project.category === category;
    return categoryMatches && project.publishState !== "archive";
  });
}

export function getProjectBySlug(slug: string): ProjectEntry | undefined {
  return projectEntries.find((project) => project.slug === slug);
}

export function getFeaturedProjects(limit = 4): ProjectEntry[] {
  return projectEntries
    .filter(
      (project) => project.publishState === "publish_now" || project.featured,
    )
    .slice(0, limit);
}
