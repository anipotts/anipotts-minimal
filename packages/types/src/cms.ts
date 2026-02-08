import type { Project, ProjectCategory, ProjectStatus } from "./project";

// ---------------------------------------------------------------------------
// Generic page content wrapper
// ---------------------------------------------------------------------------

export interface PageContent<T = unknown> {
  id: string;
  page_key: string;
  content: T;
  version: number;
  published: boolean;
  updated_at: string;
  updated_by: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Homepage content schema
// ---------------------------------------------------------------------------

export interface HomepageSection {
  visible: boolean;
  label: string;
  heading: string;
  subheading?: string;
  paragraphs?: string[];
  links?: { label: string; href: string }[];
  limit?: number;
  view_all?: string;
}

export interface HomepageContent {
  sections: {
    intro: HomepageSection;
    about: HomepageSection;
    past_work: HomepageSection;
    latest_thoughts: HomepageSection;
  };
  section_order: ("intro" | "about" | "past_work" | "latest_thoughts")[];
}

// ---------------------------------------------------------------------------
// Footer content schema
// ---------------------------------------------------------------------------

export interface FooterContent {
  tagline: string;
  copyright: string;
  links: { label: string; href: string }[];
}

// ---------------------------------------------------------------------------
// Projects table row (Supabase)
// ---------------------------------------------------------------------------

export interface ProjectRow {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  year: string;
  category: ProjectCategory;
  role: string;
  duration: string;
  tags: string[];
  status: ProjectStatus;
  featured: boolean;
  icon: string | null;
  link_live: string | null;
  link_repo: string | null;
  link_page: string | null;
  sort_order: number;
  visible: boolean;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Social links table row (Supabase)
// ---------------------------------------------------------------------------

export interface SocialLinkRow {
  id: string;
  name: string;
  url: string;
  icon: string;
  description: string | null;
  sort_order: number;
  visible: boolean;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Site settings (key-value store)
// ---------------------------------------------------------------------------

export type SiteSettingsMap = Record<string, string>;

// ---------------------------------------------------------------------------
// Mapper: ProjectRow -> Project (existing interface)
// ---------------------------------------------------------------------------

export function projectRowToProject(row: ProjectRow): Project {
  const links: Project["links"] = {};
  if (row.link_live) links.live = row.link_live;
  if (row.link_repo) links.repo = row.link_repo;
  if (row.link_page) links.page = row.link_page;

  return {
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    year: row.year,
    category: row.category,
    role: row.role,
    duration: row.duration,
    tags: row.tags,
    status: row.status,
    featured: row.featured || undefined,
    icon: (row.icon as Project["icon"]) || undefined,
    links: Object.keys(links).length > 0 ? links : undefined,
  };
}
