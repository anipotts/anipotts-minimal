#!/usr/bin/env npx ts-node
/**
 * Supabase CLI utility for Claude Code commands
 *
 * Usage:
 *   npx ts-node scripts/supabase-cli.ts <command> [args]
 *
 * Commands:
 *   list-content [--status <status>] [--series <series>]
 *   get-content <id|slug>
 *   create-content <title> [--series <series>] [--type <type>]
 *   update-content <id> <field> <value>
 *   list-atoms [--content <id>] [--platform <platform>]
 *   create-atom <content_id> <platform> <content>
 *   update-atom <id> <field> <value>
 *   stats
 */

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

async function listContent(filters: { status?: string; series?: string }) {
  let query = supabase
    .from("thoughts")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.series) {
    query = query.eq("series_type", filters.series);
  }

  const { data, error } = await query;
  if (error) throw error;

  console.log(JSON.stringify(data, null, 2));
}

async function getContent(idOrSlug: string) {
  // Try by ID first (UUID format)
  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      idOrSlug,
    );

  let query = supabase.from("thoughts").select("*");

  if (isUUID) {
    query = query.eq("id", idOrSlug);
  } else {
    query = query.eq("slug", idOrSlug);
  }

  const { data, error } = await query.single();
  if (error) throw error;

  console.log(JSON.stringify(data, null, 2));
}

async function createContent(
  title: string,
  options: { series?: string; type?: string },
) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const { data, error } = await supabase
    .from("thoughts")
    .insert([
      {
        title,
        slug,
        body: "",
        summary: "",
        status: "idea",
        content_type: options.type || "article",
        series_type: options.series || null,
        published: false,
      },
    ])
    .select()
    .single();

  if (error) throw error;

  console.log(JSON.stringify(data, null, 2));
}

async function updateContent(id: string, field: string, value: string) {
  // Handle JSON fields
  let parsedValue: string | boolean | string[] = value;
  if (field === "platforms_targeted" || field === "platforms_posted") {
    parsedValue = JSON.parse(value) as string[];
  } else if (field === "published") {
    parsedValue = value === "true";
  }

  const { data, error } = await supabase
    .from("thoughts")
    .update({ [field]: parsedValue })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  console.log(JSON.stringify(data, null, 2));
}

async function listAtoms(filters: {
  content?: string;
  platform?: string;
  status?: string;
}) {
  let query = supabase
    .from("atoms")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters.content) {
    query = query.eq("content_id", filters.content);
  }
  if (filters.platform) {
    query = query.eq("platform", filters.platform);
  }
  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;
  if (error) throw error;

  console.log(JSON.stringify(data, null, 2));
}

async function createAtom(
  contentId: string,
  platform: string,
  atomContent: string,
  voiceMode?: string,
) {
  const { data, error } = await supabase
    .from("atoms")
    .insert([
      {
        content_id: contentId,
        platform,
        atom_content: atomContent,
        voice_mode: voiceMode || "casual",
        status: "draft",
      },
    ])
    .select()
    .single();

  if (error) throw error;

  console.log(JSON.stringify(data, null, 2));
}

async function updateAtom(id: string, field: string, value: string) {
  let parsedValue: string | null = value;
  if (field === "scheduled_for" || field === "posted_at") {
    parsedValue = value === "null" ? null : value;
  }

  const { data, error } = await supabase
    .from("atoms")
    .update({ [field]: parsedValue })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  console.log(JSON.stringify(data, null, 2));
}

async function getStats() {
  // Get content stats
  const { data: content, error: contentError } = await supabase
    .from("thoughts")
    .select("id, status, series_type, views");

  if (contentError) throw contentError;

  // Get atoms stats
  const { data: atoms, error: atomsError } = await supabase
    .from("atoms")
    .select("id, platform, status");

  if (atomsError) throw atomsError;

  const stats = {
    totalContent: content?.length || 0,
    totalAtoms: atoms?.length || 0,
    totalViews: content?.reduce((sum, c) => sum + (c.views || 0), 0) || 0,
    byStatus: {} as Record<string, number>,
    bySeries: {} as Record<string, number>,
    atomsByPlatform: {} as Record<string, number>,
    atomsByStatus: {} as Record<string, number>,
  };

  content?.forEach((c) => {
    const status = c.status || "draft";
    stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

    const series = c.series_type || "unassigned";
    stats.bySeries[series] = (stats.bySeries[series] || 0) + 1;
  });

  atoms?.forEach((a) => {
    stats.atomsByPlatform[a.platform] =
      (stats.atomsByPlatform[a.platform] || 0) + 1;
    stats.atomsByStatus[a.status] = (stats.atomsByStatus[a.status] || 0) + 1;
  });

  console.log(JSON.stringify(stats, null, 2));
}

// Parse command line arguments
const [, , command, ...args] = process.argv;

async function main() {
  try {
    switch (command) {
      case "list-content": {
        const filters: { status?: string; series?: string } = {};
        for (let i = 0; i < args.length; i += 2) {
          if (args[i] === "--status") filters.status = args[i + 1];
          if (args[i] === "--series") filters.series = args[i + 1];
        }
        await listContent(filters);
        break;
      }

      case "get-content":
        await getContent(args[0]);
        break;

      case "create-content": {
        const title = args[0];
        const options: { series?: string; type?: string } = {};
        for (let i = 1; i < args.length; i += 2) {
          if (args[i] === "--series") options.series = args[i + 1];
          if (args[i] === "--type") options.type = args[i + 1];
        }
        await createContent(title, options);
        break;
      }

      case "update-content":
        await updateContent(args[0], args[1], args[2]);
        break;

      case "list-atoms": {
        const filters: {
          content?: string;
          platform?: string;
          status?: string;
        } = {};
        for (let i = 0; i < args.length; i += 2) {
          if (args[i] === "--content") filters.content = args[i + 1];
          if (args[i] === "--platform") filters.platform = args[i + 1];
          if (args[i] === "--status") filters.status = args[i + 1];
        }
        await listAtoms(filters);
        break;
      }

      case "create-atom":
        await createAtom(args[0], args[1], args[2], args[3]);
        break;

      case "update-atom":
        await updateAtom(args[0], args[1], args[2]);
        break;

      case "stats":
        await getStats();
        break;

      default:
        console.log(`
Supabase CLI for Content Hub

Commands:
  list-content [--status <status>] [--series <series>]
  get-content <id|slug>
  create-content <title> [--series <series>] [--type <type>]
  update-content <id> <field> <value>
  list-atoms [--content <id>] [--platform <platform>] [--status <status>]
  create-atom <content_id> <platform> <content> [voice_mode]
  update-atom <id> <field> <value>
  stats
        `);
    }
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
