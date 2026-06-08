import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";

const ROOT = process.cwd();
const BOT_DIR = join(ROOT, "content", "_labs-bot", "weekly");
const EXPERIMENT_DIR = join(ROOT, "content", "experiments");

export type WeeklyMeta = {
  slug: string;
  week: string;
  windowStart?: string;
  windowEnd?: string;
  events?: number;
  agents?: number;
  highlights: string[];
};

export type ExperimentMeta = {
  slug: string;
  title: string;
  date: string;
  summary?: string;
  tags?: string[];
};

function safeReadDir(dir: string): string[] {
  return existsSync(dir) ? readdirSync(dir) : [];
}

export function listWeekly(): WeeklyMeta[] {
  const files = safeReadDir(BOT_DIR).filter((f) => f.endsWith(".md"));
  return files
    .map((file) => {
      const slug = file.replace(/\.md$/, "");
      const raw = readFileSync(join(BOT_DIR, file), "utf8");
      return parseWeekly(slug, raw);
    })
    .sort((a, b) => b.week.localeCompare(a.week));
}

export function getWeekly(slug: string): { meta: WeeklyMeta; body: string } | null {
  const path = join(BOT_DIR, `${slug}.md`);
  if (!existsSync(path)) return null;
  const raw = readFileSync(path, "utf8");
  return { meta: parseWeekly(slug, raw), body: raw };
}

export function listExperiments(): ExperimentMeta[] {
  const files = safeReadDir(EXPERIMENT_DIR).filter((f) => f.endsWith(".md"));
  return files
    .map((file) => {
      const slug = file.replace(/\.md$/, "");
      const raw = readFileSync(join(EXPERIMENT_DIR, file), "utf8");
      const { data } = matter(raw);
      return {
        slug,
        title: typeof data.title === "string" ? data.title : slug,
        date: typeof data.date === "string" ? data.date : "",
        summary: typeof data.summary === "string" ? data.summary : undefined,
        tags: Array.isArray(data.tags) ? (data.tags as string[]) : undefined,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getExperiment(
  slug: string,
): { meta: ExperimentMeta; body: string } | null {
  const path = join(EXPERIMENT_DIR, `${slug}.md`);
  if (!existsSync(path)) return null;
  const raw = readFileSync(path, "utf8");
  const { data, content } = matter(raw);
  return {
    meta: {
      slug,
      title: typeof data.title === "string" ? data.title : slug,
      date: typeof data.date === "string" ? data.date : "",
      summary: typeof data.summary === "string" ? data.summary : undefined,
      tags: Array.isArray(data.tags) ? (data.tags as string[]) : undefined,
    },
    body: content,
  };
}

function parseWeekly(slug: string, raw: string): WeeklyMeta {
  const week = slug;
  const windowMatch = raw.match(
    /Window:\s*(\d{4}-\d{2}-\d{2})\s*through\s*(\d{4}-\d{2}-\d{2})/,
  );
  const eventsMatch = raw.match(/Events in window:\s*(\d+)/);
  const agentsMatch = raw.match(/Active agents:\s*(\d+)/);

  const highlights: string[] = [];
  const highlightSection = raw.split(/##\s*Highlights/i)[1];
  if (highlightSection) {
    for (const line of highlightSection.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("- ")) highlights.push(trimmed.slice(2));
      if (trimmed.startsWith("---")) break;
    }
  }

  return {
    slug,
    week,
    windowStart: windowMatch?.[1],
    windowEnd: windowMatch?.[2],
    events: eventsMatch ? Number(eventsMatch[1]) : undefined,
    agents: agentsMatch ? Number(agentsMatch[1]) : undefined,
    highlights,
  };
}
