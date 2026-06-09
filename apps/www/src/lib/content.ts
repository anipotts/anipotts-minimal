import { getCollection, type CollectionEntry } from "astro:content";

export type Writing = CollectionEntry<"writing">;
export type Project = CollectionEntry<"projects">;
export type Weekly = CollectionEntry<"weekly">;
export type Experiment = CollectionEntry<"experiments">;

export const writingSlug = (t: Writing): string => t.data.slug ?? t.id;
export const projectSlug = (p: Project): string => p.data.slug ?? p.id;
export const experimentSlug = (e: Experiment): string => e.data.slug ?? e.id;

export async function publishedWriting(): Promise<Writing[]> {
  const all = await getCollection(
    "writing",
    (t) => t.data.status === "published",
  );
  return all.sort(
    (a, b) =>
      (b.data.published_at?.getTime() ?? 0) -
      (a.data.published_at?.getTime() ?? 0),
  );
}

export async function visibleProjects(): Promise<Project[]> {
  const all = await getCollection("projects", (p) => p.data.visible);
  return all.sort((a, b) => b.data.sort_order - a.data.sort_order);
}

export async function featuredProjects(limit = 4): Promise<Project[]> {
  const all = await visibleProjects();
  const featured = all.filter((p) => p.data.featured);
  const rest = all.filter((p) => !p.data.featured);
  return [...featured, ...rest].slice(0, limit);
}

export async function publishedExperiments(): Promise<Experiment[]> {
  const all = await getCollection(
    "experiments",
    (e) => e.data.status === "published",
  );
  return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export async function weeklyDigests(): Promise<Weekly[]> {
  const all = await getCollection("weekly");
  return all.sort((a, b) => b.data.week.localeCompare(a.data.week));
}

export function readingTime(body: string): number {
  const words = body.trim().split(/\s+/).length;
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

export function getPeriod(p: Project): string {
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

export interface QuarterGroup {
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
