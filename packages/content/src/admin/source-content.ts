export type SourceSurface = "projects" | "writing";

export type SourceContentField = {
  path: string;
  value: string;
  kind: string;
};

export type SourceContentRecord = {
  id: string;
  surface: SourceSurface;
  slug: string;
  title: string;
  route: string;
  status: string;
  source_ref: string;
  summary: string;
  body_words: number;
  body_state: string;
  body_section_count: number;
  body_preview: string;
  fields: SourceContentField[];
  next_safe_action: string;
};

export type SourceContentSummary = {
  projects: number;
  writing: number;
  published_writing: number;
  visible_projects: number;
};

export function recordsFromSourceModules(
  surface: SourceSurface,
  modules: Record<string, string>,
): SourceContentRecord[] {
  return Object.entries(modules)
    .map(([path, raw]) => recordFromRaw(surface, path, raw))
    .sort(compareSourceRecords);
}

export function summarizeSourceContentRecords(
  records: SourceContentRecord[],
): SourceContentSummary {
  return {
    projects: records.filter((record) => record.surface === "projects").length,
    writing: records.filter((record) => record.surface === "writing").length,
    published_writing: records.filter(
      (record) => record.surface === "writing" && record.status === "published",
    ).length,
    visible_projects: records.filter(
      (record) => record.surface === "projects" && record.status !== "hidden",
    ).length,
  };
}

function recordFromRaw(
  surface: SourceSurface,
  path: string,
  raw: string,
): SourceContentRecord {
  const file = fileSlug(path);
  const source = splitMarkdown(raw);
  const frontmatter = parseFrontmatter(source.frontmatter);
  const slug = asString(frontmatter.slug) || file;
  const title = asString(frontmatter.title) || slug;
  const status = sourceStatus(surface, frontmatter);
  const route =
    surface === "projects" ? `/projects/${slug}` : `/writing/${slug}`;
  const fields = Object.entries(frontmatter).map(([key, value]) => ({
    path: key,
    value: formatFieldValue(value),
    kind: fieldKind(value),
  }));

  return {
    id: `${surface}.${slug}`,
    surface,
    slug,
    title,
    route,
    status,
    source_ref: `content/public/${surface}/${file}.md`,
    summary:
      asString(frontmatter.summary) ||
      asString(frontmatter.subtitle) ||
      asString(frontmatter.description) ||
      "no summary field",
    body_words: countWords(source.body),
    body_state: bodyState(surface, source.body),
    body_section_count: countMarkdownSections(source.body),
    body_preview: markdownPreview(source.body),
    fields,
    next_safe_action:
      surface === "projects"
        ? "review project frontmatter, detail body, and structured sections before modeling a draft operation"
        : "review title, summary, tags, and body before newsletter backfill",
  };
}

function splitMarkdown(raw: string): { frontmatter: string; body: string } {
  if (!raw.startsWith("---\n")) {
    return { frontmatter: "", body: raw };
  }

  const end = raw.indexOf("\n---", 4);
  if (end === -1) {
    return { frontmatter: "", body: raw };
  }

  return {
    frontmatter: raw.slice(4, end),
    body: raw.slice(end + 4).trim(),
  };
}

function parseFrontmatter(raw: string): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  const lines = raw.split("\n");
  for (const line of lines) {
    if (!line.trim() || line.startsWith(" ") || line.startsWith("-")) {
      continue;
    }

    const match = line.match(/^([A-Za-z0-9_-]+):(?:\s*(.*))?$/);
    if (!match) continue;

    const key = match[1];
    if (!key) continue;

    const rawValue = match[2] ?? "";
    fields[key] = parseScalar(rawValue);
  }
  return fields;
}

function parseScalar(raw: string): unknown {
  const value = raw.trim();
  if (!value) return "[structured list]";
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^-?\d+(?:\.\d+)?$/.test(value)) return Number(value);
  if (value.startsWith("[") && value.endsWith("]")) {
    return value
      .slice(1, -1)
      .split(",")
      .map((part) => stripQuotes(part.trim()))
      .filter(Boolean);
  }
  return stripQuotes(value);
}

function stripQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function fileSlug(path: string): string {
  return path.split("/").pop()?.replace(/\.md$/, "") ?? path;
}

function sourceStatus(
  surface: SourceSurface,
  frontmatter: Record<string, unknown>,
): string {
  if (surface === "writing") return asString(frontmatter.status) || "draft";
  if (frontmatter.visible === false) return "hidden";
  return asString(frontmatter.status) || "unknown";
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function countWords(body: string): number {
  return body.trim().split(/\s+/).filter(Boolean).length;
}

function countMarkdownSections(body: string): number {
  return body.split("\n").filter((line) => /^#{2,6}\s+\S/.test(line.trim()))
    .length;
}

function bodyState(surface: SourceSurface, body: string): string {
  const words = countWords(body);
  if (words === 0 && surface === "projects") return "frontmatter only";
  if (words === 0) return "empty body";
  if (words < 80) return "short body";
  return "body ready for preview";
}

function markdownPreview(body: string): string {
  const normalized = body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ");
  if (!normalized) return "no markdown body yet";
  return normalized.length > 220
    ? `${normalized.slice(0, 217).trimEnd()}...`
    : normalized;
}

function formatFieldValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") {
    return value.length > 96 ? `${value.slice(0, 93)}...` : value;
  }
  return JSON.stringify(value) ?? String(value);
}

function fieldKind(value: unknown): string {
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function compareSourceRecords(
  a: SourceContentRecord,
  b: SourceContentRecord,
): number {
  if (a.surface !== b.surface) return a.surface.localeCompare(b.surface);
  if (a.surface === "projects") {
    const aOrder = numericField(a, "sort_order");
    const bOrder = numericField(b, "sort_order");
    return bOrder - aOrder || a.title.localeCompare(b.title);
  }
  return b.source_ref.localeCompare(a.source_ref);
}

function numericField(record: SourceContentRecord, path: string): number {
  const field = record.fields.find((item) => item.path === path);
  return Number(field?.value ?? 0);
}
