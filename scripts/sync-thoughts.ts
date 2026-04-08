#!/usr/bin/env npx tsx
/**
 * Syncs markdown thoughts from content/thoughts/ into Supabase.
 * Uses slug as the unique key for upserting.
 *
 * Usage: pnpm sync-thoughts
 */

import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function parseValue(raw: string): string | string[] | boolean {
  const value = raw.trim();
  if (value === "true") return true;
  if (value === "false") return false;
  if (value.startsWith("[") && value.endsWith("]")) {
    return value
      .slice(1, -1)
      .split(",")
      .map((part) => part.trim().replace(/^['"]|['"]$/g, ""))
      .filter(Boolean);
  }
  return value.replace(/^['"]|['"]$/g, "");
}

function parseFrontmatter(raw: string) {
  if (!raw.startsWith("---\n")) {
    return { frontmatter: {} as Record<string, string | string[] | boolean>, content: raw.trim() };
  }
  const endIndex = raw.indexOf("\n---\n", 4);
  if (endIndex === -1) {
    return { frontmatter: {} as Record<string, string | string[] | boolean>, content: raw.trim() };
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

async function syncThoughts() {
  const thoughtsDir = path.resolve(__dirname, "..", "content", "thoughts");

  let files: string[];
  try {
    files = (await fs.readdir(thoughtsDir)).filter((f) =>
      f.endsWith(".md") || f.endsWith(".mdx"),
    );
  } catch {
    console.error(`No thoughts directory found at ${thoughtsDir}`);
    process.exit(1);
  }

  console.log(`Found ${files.length} markdown files`);

  let synced = 0;
  let errors = 0;

  for (const file of files) {
    const raw = await fs.readFile(path.join(thoughtsDir, file), "utf8");
    const { frontmatter, content } = parseFrontmatter(raw);

    const slug = String(frontmatter.slug ?? file.replace(/\.mdx?$/, "")).trim();
    const title = String(frontmatter.title ?? slug.replace(/-/g, " ")).trim();
    const summary = String(frontmatter.summary ?? "").trim();
    const date = String(frontmatter.date ?? "").trim();
    const published = frontmatter.published === true;
    const tagsRaw = frontmatter.tags;
    const tags = Array.isArray(tagsRaw)
      ? tagsRaw.map((t) => String(t))
      : typeof tagsRaw === "string"
        ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
        : [];

    const record: Record<string, unknown> = {
      slug,
      title,
      summary,
      content,
      tags,
      published,
      status: published ? "published" : "draft",
      updated_at: new Date().toISOString(),
    };

    if (published && date) {
      record.published_at = new Date(date).toISOString();
    }

    // Check if exists
    const { data: existing } = await supabase
      .from("thoughts")
      .select("id")
      .eq("slug", slug)
      .single();

    let error;
    if (existing) {
      ({ error } = await supabase
        .from("thoughts")
        .update(record)
        .eq("id", existing.id));
    } else {
      record.created_at = date
        ? new Date(date).toISOString()
        : new Date().toISOString();
      record.views = 0;
      ({ error } = await supabase.from("thoughts").insert(record));
    }

    if (error) {
      console.error(`  Error syncing ${slug}: ${error.message}`);
      errors++;
    } else {
      console.log(`  Synced: ${slug} (${existing ? "updated" : "created"})`);
      synced++;
    }
  }

  console.log(`\nDone. Synced: ${synced}, Errors: ${errors}`);
}

syncThoughts().catch((err) => {
  console.error(err);
  process.exit(1);
});
