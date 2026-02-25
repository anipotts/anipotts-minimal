import fs from "node:fs/promises";
import path from "node:path";
import { cache } from "react";

export interface ThoughtEntry {
  slug: string;
  title: string;
  summary: string;
  date: string;
  tags: string[];
  published: boolean;
  content: string;
}

const THOUGHTS_DIR_CANDIDATES = Array.from(
  new Set([
    path.resolve(process.cwd(), "content", "thoughts"),
    path.resolve(process.cwd(), "..", "..", "content", "thoughts"),
  ]),
);

async function resolveThoughtsDir(): Promise<string | null> {
  for (const candidate of THOUGHTS_DIR_CANDIDATES) {
    try {
      const files = await fs.readdir(candidate);
      const hasContent = files.some((file) => file.endsWith(".md") || file.endsWith(".mdx"));
      if (hasContent) {
        return candidate;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function parseValue(raw: string): string | string[] | boolean {
  const value = raw.trim();

  if (value === "true") return true;
  if (value === "false") return false;

  if (value.startsWith("[") && value.endsWith("]")) {
    return value
      .slice(1, -1)
      .split(",")
      .map((part) => part.trim().replace(/^['\"]|['\"]$/g, ""))
      .filter(Boolean);
  }

  return value.replace(/^['\"]|['\"]$/g, "");
}

function parseFrontmatter(raw: string) {
  if (!raw.startsWith("---\n")) {
    return { frontmatter: {}, content: raw.trim() };
  }

  const endIndex = raw.indexOf("\n---\n", 4);
  if (endIndex === -1) {
    return { frontmatter: {}, content: raw.trim() };
  }

  const frontmatterBlock = raw.slice(4, endIndex);
  const content = raw.slice(endIndex + 5).trim();
  const frontmatter: Record<string, string | string[] | boolean> = {};

  for (const line of frontmatterBlock.split("\n")) {
    const separator = line.indexOf(":");
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1);
    frontmatter[key] = parseValue(value);
  }

  return { frontmatter, content };
}

function normalizeThought(file: string, raw: string): ThoughtEntry {
  const { frontmatter, content } = parseFrontmatter(raw);
  const filenameSlug = file.replace(/\.mdx?$/, "");
  const slug = String(frontmatter.slug ?? filenameSlug).trim();
  const title = String(frontmatter.title ?? filenameSlug.replace(/-/g, " ")).trim();
  const summary = String(frontmatter.summary ?? "").trim();
  const date = String(frontmatter.date ?? "").trim();
  const tagsRaw = frontmatter.tags;
  const tags = Array.isArray(tagsRaw)
    ? tagsRaw.map((tag) => String(tag))
    : typeof tagsRaw === "string"
      ? tagsRaw.split(",").map((tag) => tag.trim()).filter(Boolean)
      : [];
  const published = frontmatter.published !== false;

  if (!slug) {
    throw new Error(`[thoughts] Missing slug in ${file}`);
  }
  if (!title) {
    throw new Error(`[thoughts] Missing title in ${file}`);
  }
  if (!summary) {
    throw new Error(`[thoughts] Missing summary in ${file}`);
  }
  if (!date || Number.isNaN(Date.parse(date))) {
    throw new Error(`[thoughts] Invalid date in ${file}. Expected ISO-like date.`);
  }

  return {
    slug,
    title,
    summary,
    date,
    tags,
    published,
    content,
  };
}

export const getThoughtEntries = cache(async (): Promise<ThoughtEntry[]> => {
  const thoughtsDir = await resolveThoughtsDir();
  if (!thoughtsDir) return [];

  let files: string[] = [];

  try {
    files = await fs.readdir(thoughtsDir);
  } catch {
    return [];
  }

  const entries = await Promise.all(
    files
      .filter((file) => file.endsWith(".md") || file.endsWith(".mdx"))
      .map(async (file) => {
        const absolutePath = path.join(thoughtsDir, file);
        const raw = await fs.readFile(absolutePath, "utf8");
        return normalizeThought(file, raw);
      }),
  );

  const seen = new Set<string>();
  for (const entry of entries) {
    if (seen.has(entry.slug)) {
      throw new Error(`[thoughts] Duplicate slug detected: ${entry.slug}`);
    }
    seen.add(entry.slug);
  }

  return entries.sort((a, b) => +new Date(b.date) - +new Date(a.date));
});

export async function getPublishedThoughts(): Promise<ThoughtEntry[]> {
  const thoughts = await getThoughtEntries();
  return thoughts.filter((thought) => thought.published);
}

export async function getThoughtBySlug(slug: string): Promise<ThoughtEntry | undefined> {
  const thoughts = await getPublishedThoughts();
  return thoughts.find((thought) => thought.slug === slug);
}

export async function searchThoughtEntries(query: string): Promise<ThoughtEntry[]> {
  const thoughts = await getPublishedThoughts();
  const q = query.trim().toLowerCase();
  if (!q) return thoughts;

  return thoughts.filter((thought) => {
    return (
      thought.title.toLowerCase().includes(q) ||
      thought.summary.toLowerCase().includes(q) ||
      thought.tags.join(" ").toLowerCase().includes(q) ||
      thought.content.toLowerCase().includes(q)
    );
  });
}
