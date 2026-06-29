import { getCollection, type CollectionEntry } from "astro:content";
import {
  type CmsWritingContent,
  cmsProjectPageKey,
  cmsWritingPageKey,
  normalizeCmsProject,
  normalizeCmsWriting,
} from "@anipotts/content/public";
import {
  fetchPageContent,
  fetchPublishedPageContentByPrefix,
} from "@anipotts/lib/cms";

type ProjectEntry = CollectionEntry<"projects">;
type WritingEntry = CollectionEntry<"writing">;

export interface Project {
  id: string;
  slug: string;
  body: string;
  source: "markdown" | "cms";
  entry?: ProjectEntry;
  data: ProjectEntry["data"];
}

export interface Writing {
  id: string;
  slug: string;
  body: string;
  source: "markdown" | "cms";
  entry?: WritingEntry;
  data: WritingEntry["data"];
}

export const writingSlug = (t: Writing): string => t.slug;
export const projectSlug = (p: Project): string => p.slug;

const HIDDEN_PUBLIC_PROJECTS = new Set(["habittracker-obh"]);

function cmsLink(
  links: { label: string; url: string }[],
  labels: string[],
): string | undefined {
  const normalized = labels.map((label) => label.toLowerCase());
  return links.find((link) => normalized.includes(link.label.toLowerCase()))
    ?.url;
}

async function projectFromEntry(entry: ProjectEntry): Promise<Project> {
  const slug = entry.data.slug ?? entry.id;
  const page = await fetchPageContent(cmsProjectPageKey(slug));
  if (!page) {
    return {
      id: entry.id,
      slug,
      body: entry.body ?? "",
      source: "markdown",
      entry,
      data: entry.data,
    };
  }

  const cms = normalizeCmsProject(page.content, {
    slug,
    title: entry.data.title,
    status: entry.data.status,
    year: entry.data.year,
    range: entry.data.duration,
    tags: entry.data.tags,
    summary: entry.data.subtitle ?? entry.data.description,
    body: entry.body || entry.data.description,
    featured: entry.data.featured,
    order: entry.data.sort_order,
    visible: entry.data.visible,
  });
  const live = cmsLink(cms.links, ["live", "live site", "site"]);
  const repo = cmsLink(cms.links, ["source", "repo", "github"]);

  return {
    id: entry.id,
    slug: cms.slug,
    body: cms.body,
    source: "cms",
    entry,
    data: {
      ...entry.data,
      title: cms.title,
      slug: cms.slug,
      subtitle: cms.summary,
      description: cms.body,
      year: cms.year,
      duration: cms.range,
      status: cms.status,
      featured: cms.featured,
      visible: cms.visible,
      sort_order: cms.order,
      tags: cms.tags,
      link_live: live,
      link_repo: repo,
    },
  };
}

async function writingFromEntry(entry: WritingEntry): Promise<Writing> {
  const slug = entry.data.slug ?? entry.id;
  const page = await fetchPageContent(cmsWritingPageKey(slug));
  if (!page) {
    return {
      id: entry.id,
      slug,
      body: entry.body ?? "",
      source: "markdown",
      entry,
      data: entry.data,
    };
  }

  const cms = normalizeCmsWriting(page.content, {
    slug,
    title: entry.data.title,
    date: entry.data.published_at?.toISOString().slice(0, 10) ?? "",
    tags: entry.data.tags,
    preview: entry.data.summary,
    body: entry.body ?? "",
    visible: entry.data.status === "published",
  });
  const source = cms.sourceLinks[0];

  return {
    id: entry.id,
    slug: cms.slug,
    body: cms.body,
    source: "cms",
    entry,
    data: {
      ...entry.data,
      title: cms.title,
      slug: cms.slug,
      summary: cms.preview,
      tags: cms.tags,
      status: cms.visible ? "published" : "draft",
      published_at: cms.visible
        ? new Date(`${cms.date}T00:00:00.000Z`)
        : undefined,
      artifact_url: source?.url,
      artifact_type:
        source?.label === "repo" ||
        source?.label === "gist" ||
        source?.label === "demo" ||
        source?.label === "screenshot" ||
        source?.label === "recording"
          ? source.label
          : entry.data.artifact_type,
    },
  };
}

function writingFromCmsPage(
  page: Awaited<
    ReturnType<typeof fetchPublishedPageContentByPrefix<CmsWritingContent>>
  >[number],
): Writing | null {
  const cms = normalizeCmsWriting(page.content);
  if (!cms.visible) return null;
  const source = cms.sourceLinks[0];

  return {
    id: page.page_key,
    slug: cms.slug,
    body: cms.body,
    source: "cms",
    data: {
      title: cms.title,
      slug: cms.slug,
      summary: cms.preview,
      tags: cms.tags,
      status: "published",
      published_at: new Date(`${cms.date}T00:00:00.000Z`),
      content_type: "article",
      artifact_url: source?.url,
      artifact_type:
        source?.label === "repo" ||
        source?.label === "gist" ||
        source?.label === "demo" ||
        source?.label === "screenshot" ||
        source?.label === "recording"
          ? source.label
          : undefined,
    },
  };
}

export async function publishedWriting(): Promise<Writing[]> {
  const entries = await getCollection(
    "writing",
    (t) => t.data.status === "published",
  );
  const all = await Promise.all(entries.map(writingFromEntry));
  const markdownSlugs = new Set(all.map((item) => item.slug));
  const cmsRows =
    await fetchPublishedPageContentByPrefix<CmsWritingContent>("writing:");
  const cmsOnly = cmsRows
    .map(writingFromCmsPage)
    .filter((item): item is Writing => Boolean(item))
    .filter((item) => !markdownSlugs.has(item.slug));

  return [...all, ...cmsOnly]
    .filter((item) => item.data.status === "published")
    .sort(
      (a, b) =>
        (b.data.published_at?.getTime() ?? 0) -
        (a.data.published_at?.getTime() ?? 0),
    );
}

export async function visibleProjects(): Promise<Project[]> {
  const entries = await getCollection("projects", (p) => p.data.visible);
  const all = await Promise.all(entries.map(projectFromEntry));
  return all
    .filter(
      (project) =>
        project.data.visible && !HIDDEN_PUBLIC_PROJECTS.has(project.slug),
    )
    .sort((a, b) => b.data.sort_order - a.data.sort_order);
}

export function readingTime(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    timeZone: "UTC",
  });
}

const SEASON_TO_QUARTER: Record<string, string> = {
  winter: "Q1",
  spring: "Q2",
  summer: "Q3",
  fall: "Q4",
};

function getPeriod(p: Project): string {
  const d = p.data.duration.toLowerCase();
  if (d === "ongoing") return "ongoing";
  for (const [season, quarter] of Object.entries(SEASON_TO_QUARTER)) {
    if (d.includes(season)) {
      const ym = d.match(/\d{4}/);
      if (ym) return `${quarter} ${ym[0]}`;
      return "ongoing";
    }
  }
  const ym = d.match(/^\d{4}/);
  if (ym) return ym[0];
  return "ongoing";
}

interface QuarterGroup {
  quarter: string | null;
  projects: Project[];
}

export interface YearGroup {
  year: string;
  quarters: QuarterGroup[];
}

export function groupByYearAndQuarter(projects: Project[]): YearGroup[] {
  const yearMap = new Map<string, Map<string, Project[]>>();
  for (const project of projects) {
    const period = getPeriod(project);
    let year: string;
    let quarter: string | null = null;
    if (period === "ongoing") {
      year = "ongoing";
    } else if (period.startsWith("Q")) {
      const spaceIdx = period.indexOf(" ");
      quarter = period.slice(0, spaceIdx);
      year = period.slice(spaceIdx + 1);
    } else {
      year = period;
    }
    if (!yearMap.has(year)) yearMap.set(year, new Map());
    const qMap = yearMap.get(year)!;
    const key = quarter ?? "_none";
    if (!qMap.has(key)) qMap.set(key, []);
    qMap.get(key)!.push(project);
  }
  return Array.from(yearMap.entries())
    .sort(([a], [b]) => {
      if (a === "ongoing") return -1;
      if (b === "ongoing") return 1;
      return parseInt(b, 10) - parseInt(a, 10);
    })
    .map(([year, qMap]) => ({
      year,
      quarters: Array.from(qMap.entries())
        .sort(([a], [b]) => {
          if (a === "_none") return -1;
          if (b === "_none") return 1;
          return b.localeCompare(a);
        })
        .map(([key, items]) => ({
          quarter: key === "_none" ? null : key,
          projects: items,
        })),
    }));
}
