// Content types
export type ContentType = "video" | "article" | "thread" | "tip";
export type SeriesType =
  | "tip"
  | "news"
  | "tutorial"
  | "essay"
  | "behind-the-scenes";
export type ContentStatus =
  | "idea"
  | "draft"
  | "ready"
  | "atomized"
  | "published";
export type VoiceMode = "spicy" | "casual" | "professional";
export type ArtifactType =
  | "gist"
  | "repo"
  | "screenshot"
  | "screen-recording"
  | "diff"
  | "live-demo";
export type Platform =
  | "twitter"
  | "linkedin"
  | "tiktok"
  | "instagram"
  | "threads"
  | "bluesky"
  | "mastodon"
  | "youtube"
  | "medium"
  | "devto"
  | "substack"
  | "reddit";

// Valid sections for content scoping.
// D1 may still contain legacy section names from earlier route eras.
export type ContentSection =
  | "www"
  | "writing"
  | "making"
  | "orchestrating"
  | "connect"
  | "thoughts"
  | "dev"
  | "lab"
  | "work"
  | "claude";

export interface Thought {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  views: number;

  // Legacy field (kept for backward compatibility)
  published: boolean;

  // New content hub fields
  content_type?: ContentType;
  series_type?: SeriesType;
  status?: ContentStatus;
  artifact_url?: string;
  artifact_type?: ArtifactType;
  platforms_targeted?: Platform[];
  platforms_posted?: Platform[];
  voice_mode?: VoiceMode;
  project?: string;
  published_at?: string;
  scheduled_at?: string;

  // Distribution IDs (migration 003)
  buttondown_email_id?: string;
  typefully_x_draft_id?: string;
  typefully_linkedin_draft_id?: string;

  // Section scoping
  section?: ContentSection;
}

export interface ThoughtStats {
  totalViews: number;
  totalThoughts: number;
  publishedCount: number;
  draftCount: number;
  topThoughts: Pick<
    Thought,
    "id" | "title" | "slug" | "views" | "published" | "created_at"
  >[];

  // New stats
  byStatus?: Record<ContentStatus, number>;
  bySeries?: Record<SeriesType, number>;
}

// Atom types
export type AtomStatus = "draft" | "scheduled" | "posted";

export interface Atom {
  id: string;
  content_id: string;
  platform: Platform;
  atom_content: string;
  voice_mode?: VoiceMode;
  hashtags?: string[];
  status: AtomStatus;
  typefully_draft_id?: string;
  scheduled_at?: string;
  posted_at?: string;
  external_url?: string;
  created_at: string;
  updated_at: string;

  // Section scoping
  section?: ContentSection;
}

export interface AtomWithContent extends Atom {
  thought?: Thought;
}

export interface ThoughtSummary {
  slug: string;
  title: string;
  summary: string;
  created_at: string;
  published_at?: string;
  views?: number;
  id?: string;
  series_type?: SeriesType | null;
  tags?: string | string[] | null;
}

export type WritingSummary = ThoughtSummary;
