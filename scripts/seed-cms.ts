#!/usr/bin/env npx ts-node
/**
 * Seed CMS tables with current static data.
 *
 * Usage:
 *   npx ts-node scripts/seed-cms.ts
 *
 * Requires:
 *   NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment.
 *
 * Idempotent: uses upsert so safe to run multiple times.
 *
 * --------------------------------------------------------------------------
 * RUN THIS SQL IN SUPABASE SQL EDITOR FIRST:
 * --------------------------------------------------------------------------
 *
 * -- page_content: stores JSON blobs for each editable page
 * CREATE TABLE IF NOT EXISTS page_content (
 *   id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *   page_key    text UNIQUE NOT NULL,
 *   content     jsonb NOT NULL DEFAULT '{}',
 *   version     integer NOT NULL DEFAULT 1,
 *   published   boolean NOT NULL DEFAULT true,
 *   updated_at  timestamptz NOT NULL DEFAULT now(),
 *   updated_by  text,
 *   created_at  timestamptz NOT NULL DEFAULT now()
 * );
 *
 * -- projects: mirrors packages/lib/src/data/projects.ts
 * CREATE TABLE IF NOT EXISTS projects (
 *   id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *   slug        text UNIQUE NOT NULL,
 *   title       text NOT NULL,
 *   subtitle    text NOT NULL DEFAULT '',
 *   description text NOT NULL DEFAULT '',
 *   year        text NOT NULL DEFAULT '',
 *   category    text NOT NULL DEFAULT 'other',
 *   role        text NOT NULL DEFAULT '',
 *   duration    text NOT NULL DEFAULT '',
 *   tags        text[] NOT NULL DEFAULT '{}',
 *   status      text NOT NULL DEFAULT 'live',
 *   featured    boolean NOT NULL DEFAULT false,
 *   icon        text,
 *   link_live   text,
 *   link_repo   text,
 *   link_page   text,
 *   sort_order  integer NOT NULL DEFAULT 0,
 *   visible     boolean NOT NULL DEFAULT true,
 *   created_at  timestamptz NOT NULL DEFAULT now(),
 *   updated_at  timestamptz NOT NULL DEFAULT now()
 * );
 *
 * -- social_links: mirrors packages/lib/src/data/social.ts
 * CREATE TABLE IF NOT EXISTS social_links (
 *   id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *   name        text NOT NULL,
 *   url         text NOT NULL,
 *   icon        text NOT NULL,
 *   description text,
 *   sort_order  integer NOT NULL DEFAULT 0,
 *   visible     boolean NOT NULL DEFAULT true,
 *   created_at  timestamptz NOT NULL DEFAULT now(),
 *   updated_at  timestamptz NOT NULL DEFAULT now()
 * );
 *
 * -- site_settings: key-value store for misc settings
 * CREATE TABLE IF NOT EXISTS site_settings (
 *   key         text PRIMARY KEY,
 *   value       text NOT NULL,
 *   updated_at  timestamptz NOT NULL DEFAULT now()
 * );
 *
 * -- RLS policies: public read, service-role write
 * ALTER TABLE page_content ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
 *
 * CREATE POLICY "Public read page_content" ON page_content
 *   FOR SELECT USING (published = true);
 * CREATE POLICY "Service write page_content" ON page_content
 *   FOR ALL USING (auth.role() = 'service_role');
 *
 * CREATE POLICY "Public read projects" ON projects
 *   FOR SELECT USING (visible = true);
 * CREATE POLICY "Service write projects" ON projects
 *   FOR ALL USING (auth.role() = 'service_role');
 *
 * CREATE POLICY "Public read social_links" ON social_links
 *   FOR SELECT USING (visible = true);
 * CREATE POLICY "Service write social_links" ON social_links
 *   FOR ALL USING (auth.role() = 'service_role');
 *
 * CREATE POLICY "Public read site_settings" ON site_settings
 *   FOR SELECT USING (true);
 * CREATE POLICY "Service write site_settings" ON site_settings
 *   FOR ALL USING (auth.role() = 'service_role');
 *
 * --------------------------------------------------------------------------
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ---------------------------------------------------------------------------
// Static data imports
// ---------------------------------------------------------------------------

// Inline the data to avoid ESM/CJS issues with ts-node
const projects = [
  {
    slug: "quantercise",
    title: "Quantercise",
    subtitle: "Quant interview prep for Jane Street, Citadel, Two Sigma.",
    description:
      "400+ problems with Python code editor, KaTeX math rendering, instant grading, and gamification. Next.js 15, React 19, Postgres (Aurora to Neon migration), Lambda for sandboxed execution. Actively used by candidates targeting top trading firms.",
    year: "2024-",
    category: "product",
    role: "Founder & Engineer",
    duration: "Ongoing",
    tags: [
      "Next.js 15",
      "TypeScript",
      "Postgres",
      "AWS Lambda",
      "Monaco",
      "Stripe",
    ],
    status: "live",
    featured: true,
    icon: null,
    link_live: "https://quantercise.com",
    link_repo: null,
    link_page: "/projects/quantercise",
  },
  {
    slug: "quantercise-extension",
    title: "Mental Math",
    subtitle: "Practice mental math drills in your browser.",
    description:
      "Practice mental math drills in your browser. Keyboard-driven, sound feedback, progress tracking. Vanilla JS, Manifest V3, zero external dependencies.",
    year: "2026",
    category: "product",
    role: "Creator",
    duration: "Winter 2026",
    tags: ["Chrome Extension", "JavaScript", "Manifest V3"],
    status: "live",
    featured: false,
    icon: "chrome",
    link_live: null,
    link_repo: "https://github.com/anipotts/quantercise-mental-math-extension",
    link_page: null,
  },
  {
    slug: "pgi-research-platform",
    title: "PGI Research Portal",
    subtitle: "Macro research platform for 300+ quants.",
    description:
      "Rebuilt PGI's static site into a TypeScript PWA backed by Postgres, aggregating RSS feeds and cutting manual research overhead. Enables analysts to monitor macro catalysts and event signals directly from mobile.",
    year: "2025",
    category: "quant",
    role: "Chief Tech Officer",
    duration: "2025-",
    tags: ["Next.js", "TypeScript", "Postgres", "TailwindCSS", "RSS"],
    status: "live",
    featured: false,
    icon: null,
    link_live: "https://paragoninvestments.org",
    link_repo: null,
    link_page: null,
  },
  {
    slug: "chainedchat",
    title: "ChainedChat",
    subtitle: "Multi-LLM workflow orchestration platform.",
    description:
      "Built a full-stack platform for interacting with multiple LLMs in a single conversational workflow. Implements shared-context caching, multi-model routing, and intuitive UI for cost-efficient prompt chaining.",
    year: "2025",
    category: "ai",
    role: "Founder",
    duration: "Summer 2025",
    tags: [
      "Next.js",
      "TypeScript",
      "Convex",
      "LangGraph",
      "Stripe",
      "TailwindCSS",
    ],
    status: "live",
    featured: false,
    icon: null,
    link_live: "https://chained.chat",
    link_repo: "https://github.com/anipotts/chained-chat",
    link_page: null,
  },
  {
    slug: "nyu-purity-test",
    title: "NYU Purity Test",
    subtitle: "A campus quiz taken by 3,000+ NYU students (200k+ visits).",
    description:
      "Launched and marketed a TypeScript web app in 4 hours of a purity questionnaire tailored to NYU culture. Reached 1,000+ completions in under 17 hours.",
    year: "2024",
    category: "product",
    role: "Creator",
    duration: "Fall 2024",
    tags: ["TypeScript", "React", "Next.js", "TailwindCSS", "Analytics"],
    status: "live",
    featured: false,
    icon: null,
    link_live: "https://nyupuritytest.com",
    link_repo: "https://github.com/anipotts/nyu-rice-purity",
    link_page: null,
  },
  {
    slug: "habittracker-obh",
    title: "Artist Scouting Dashboard",
    subtitle:
      "Cross-platform artist growth tracking for an Atlantic Records venture.",
    description:
      "Aggregated Chartmetric, YouTube, TikTok, and Instagram signals into a centralized scouting dashboard. Implemented geo-based artist discovery to find emerging talent in targeted campaign markets.",
    year: "2024",
    category: "music",
    role: "Data Engineering Intern",
    duration: "Summer 2024",
    tags: ["Python", "Streamlit", "SQL", "APIs", "Data Pipelines"],
    status: "live",
    featured: false,
    icon: null,
    link_live: null,
    link_repo: null,
    link_page: null,
  },
  {
    slug: "options-pricing-sensitivity",
    title: "Options Pricing + Sensitivity Analysis",
    subtitle: "Black-Scholes and binomial pricing with volatility sweeps.",
    description:
      "Developed a Python tool to price European options using Black-Scholes and binomial models, analyzing how prices move across volatility regimes to illustrate Greeks and model behavior.",
    year: "2023",
    category: "quant",
    role: "Developer",
    duration: "Spring 2023",
    tags: ["Python", "NumPy", "Pandas", "Quantitative Finance"],
    status: "live",
    featured: false,
    icon: null,
    link_live: null,
    link_repo:
      "https://github.com/anirudhp15/Options-Pricing-and-Sensitivity-Analysis-Tool",
    link_page: null,
  },
];

const socialLinks = [
  {
    name: "email",
    url: "mailto:contact@anipotts.com",
    icon: "email",
    description: "contact@anipotts.com",
  },
  {
    name: "github",
    url: "https://github.com/anipotts",
    icon: "github",
    description: "@anipotts",
  },
  {
    name: "linkedin",
    url: "https://www.linkedin.com/in/anipotts",
    icon: "linkedin",
    description: "anipotts",
  },
  {
    name: "x",
    url: "https://x.com/anipottsbuilds",
    icon: "x",
    description: "@anipottsbuilds",
  },
  {
    name: "instagram",
    url: "https://instagram.com/anipottsbuilds",
    icon: "instagram",
    description: "@anipottsbuilds",
  },
  {
    name: "tiktok",
    url: "https://tiktok.com/@anipottsbuilds",
    icon: "tiktok",
    description: "@anipottsbuilds",
  },
  {
    name: "mastodon",
    url: "https://mastodon.social/@anipotts",
    icon: "mastodon",
    description: "@anipotts@mastodon.social",
  },
];

const siteSettings: Record<string, string> = {
  site_name: "Ani Potts",
  site_title: "Software Engineer",
  site_location: "NYC",
  site_bio:
    "Software engineer based in NYC who builds minimal interfaces to orchestrate complex systems.",
  site_short_bio: "builds minimal interfaces to orchestrate complex systems",
  site_domain: "anipotts.com",
  site_url: "https://anipotts.com",
  site_email: "contact@anipotts.com",
  site_handle: "@anipottsbuilds",
  site_github: "anipotts",
};

const homepageContent = {
  sections: {
    intro: {
      visible: true,
      label: "index",
      heading: "hi, i'm ani.",
      subheading:
        "i'm a SWE based in NYC, who builds minimal interfaces to orchestrate complex systems.",
    },
    about: {
      visible: true,
      label: "about me",
      heading: "about me",
      paragraphs: [
        'Right now, I\'m building an investment research platform for <a href="https://www.pgiuchicago.com/">PGI</a>, serving quants at UChicago, NYU, Princeton, Brown, and other top institutions.',
        'Previously, I built internal analytics dashboards for <a href="https://www.atlanticrecords.com/">Atlantic</a>, automated social media scraping for <a href="https://www.rangemp.com/">Range Media Partners</a>, and launched several profitable <a href="#selected-work">PWAs</a> (see below).',
      ],
    },
    past_work: {
      visible: true,
      label: "past work",
      heading: "past work",
      limit: 5,
      view_all: "/work",
    },
    latest_thoughts: {
      visible: true,
      label: "latest thoughts",
      heading: "latest thoughts",
      limit: 5,
      view_all: "/thoughts",
    },
  },
  section_order: ["intro", "about", "past_work", "latest_thoughts"],
};

const footerContent = {
  tagline: "durable execution",
  copyright: "Ani Potts",
  links: [],
};

// ---------------------------------------------------------------------------
// Seed functions
// ---------------------------------------------------------------------------

async function seedProjects() {
  console.log("\n--- Seeding projects ---");
  const rows = projects.map((p, i) => ({
    ...p,
    sort_order: i,
    visible: true,
    updated_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from("projects")
    .upsert(rows, { onConflict: "slug" })
    .select("slug");

  if (error) {
    console.error("  FAILED:", error.message);
    return;
  }
  console.log(`  Upserted ${data?.length ?? 0} projects`);
}

async function seedSocialLinks() {
  console.log("\n--- Seeding social_links ---");
  const rows = socialLinks.map((l, i) => ({
    ...l,
    sort_order: i,
    visible: true,
    updated_at: new Date().toISOString(),
  }));

  // Delete existing and re-insert to handle reordering cleanly
  const { error: delErr } = await supabase
    .from("social_links")
    .delete()
    .gte("created_at", "1970-01-01T00:00:00Z");

  if (delErr) {
    console.error("  Failed to clear social_links:", delErr.message);
  }

  const { data, error } = await supabase
    .from("social_links")
    .insert(rows)
    .select("name");

  if (error) {
    console.error("  FAILED:", error.message);
    return;
  }
  console.log(`  Inserted ${data?.length ?? 0} social links`);
}

async function seedSiteSettings() {
  console.log("\n--- Seeding site_settings ---");
  const rows = Object.entries(siteSettings).map(([key, value]) => ({
    key,
    value,
    updated_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from("site_settings")
    .upsert(rows, { onConflict: "key" })
    .select("key");

  if (error) {
    console.error("  FAILED:", error.message);
    return;
  }
  console.log(`  Upserted ${data?.length ?? 0} settings`);
}

async function seedPageContent() {
  console.log("\n--- Seeding page_content ---");

  const pages = [
    {
      page_key: "homepage",
      content: homepageContent,
      version: 1,
      published: true,
      updated_by: "seed",
      updated_at: new Date().toISOString(),
    },
    {
      page_key: "footer",
      content: footerContent,
      version: 1,
      published: true,
      updated_by: "seed",
      updated_at: new Date().toISOString(),
    },
  ];

  const { data, error } = await supabase
    .from("page_content")
    .upsert(pages, { onConflict: "page_key" })
    .select("page_key");

  if (error) {
    console.error("  FAILED:", error.message);
    return;
  }
  console.log(`  Upserted ${data?.length ?? 0} page content entries`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("Seeding CMS tables...");
  console.log(`Supabase URL: ${supabaseUrl}`);

  await seedProjects();
  await seedSocialLinks();
  await seedSiteSettings();
  await seedPageContent();

  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Seed script failed:", err);
  process.exit(1);
});
