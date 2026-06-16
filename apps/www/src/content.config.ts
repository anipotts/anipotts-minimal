import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const status = z.enum(["draft", "scheduled", "published"]);
const phosphor = z
  .string()
  .regex(/^[a-z-]+$/, "phosphor icon name only")
  .optional();

const writing = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/writing" }),
  schema: z
    .object({
      title: z.string(),
      slug: z.string().optional(),
      summary: z.string().min(1),
      status: status.default("draft"),
      published_at: z.coerce.date().optional(),
      scheduled_at: z.coerce.date().optional(),
      tags: z.array(z.string()).default([]),
      content_type: z.enum(["article", "note", "playbook"]).default("article"),
      series_type: z.string().optional(),
      project: z.string().optional(),
      artifact_url: z.string().url().optional(),
      artifact_type: z
        .enum(["repo", "gist", "demo", "screenshot", "recording"])
        .optional(),
    })
    .refine((d) => d.status !== "published" || Boolean(d.published_at), {
      message: "published writing needs published_at",
    })
    .refine((d) => d.status !== "scheduled" || Boolean(d.scheduled_at), {
      message: "scheduled writing needs scheduled_at",
    }),
});

const projects = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    slug: z.string().optional(),
    subtitle: z.string().optional(),
    description: z.string(),
    year: z.string(),
    category: z.enum(["ai", "product", "quant", "music", "other"]),
    role: z.string(),
    duration: z.string(),
    status: z.enum(["live", "wip", "archived"]),
    featured: z.boolean().default(false),
    visible: z.boolean().default(true),
    sort_order: z.number().default(0),
    icon: phosphor,
    link_live: z.string().url().optional(),
    link_repo: z.string().url().optional(),
    tags: z.array(z.string()).default([]),
    technical: z
      .array(z.object({ title: z.string(), content: z.string() }))
      .optional(),
    roadmap: z
      .array(
        z.object({
          text: z.string(),
          status: z.enum(["done", "in-progress", "planned"]),
        }),
      )
      .optional(),
  }),
});

const weekly = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/running/weekly" }),
  schema: z.object({
    week: z.string().regex(/^\d{4}-W\d{2}$/),
    window_start: z.coerce.date(),
    window_end: z.coerce.date(),
    events: z.number(),
    events_total: z.number().optional(),
    agents: z.number(),
    highlights: z.array(z.string()).default([]),
    generated_by: z.string().optional(),
    generated_at: z.coerce.date().optional(),
  }),
});

const experiments = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/running/experiments" }),
  schema: z.object({
    title: z.string(),
    slug: z.string().optional(),
    date: z.coerce.date(),
    summary: z.string().optional(),
    tags: z.array(z.string()).default([]),
    status: status.default("published"),
  }),
});

export const collections = { writing, projects, weekly, experiments };
