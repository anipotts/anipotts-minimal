// Content types
export type ContentType = 'video' | 'article' | 'thread' | 'tip';
export type SeriesType = '60s-fix' | 'i-tried-it' | 'quick-tip' | 'stack-update' | 'viral-reel';
export type ContentStatus = 'idea' | 'draft' | 'ready' | 'atomized' | 'published';
export type VoiceMode = 'spicy' | 'casual' | 'professional';
export type ArtifactType = 'gist' | 'repo' | 'screenshot' | 'screen-recording' | 'diff' | 'live-demo';
export type Platform =
  | 'twitter'
  | 'linkedin'
  | 'tiktok'
  | 'instagram'
  | 'threads'
  | 'bluesky'
  | 'mastodon'
  | 'youtube'
  | 'medium'
  | 'devto'
  | 'substack'
  | 'reddit';

// Valid subdomains for content scoping
export type Subdomain = 'www' | 'thoughts' | 'dev' | 'links' | 'updates' | 'metrics' | 'status' | 'lab' | 'docs';

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

  // Subdomain scoping
  subdomain?: Subdomain;
}

export interface ThoughtStats {
  totalViews: number;
  totalThoughts: number;
  publishedCount: number;
  draftCount: number;
  topThoughts: Pick<Thought, 'id' | 'title' | 'slug' | 'views' | 'published' | 'created_at'>[];

  // New stats
  byStatus?: Record<ContentStatus, number>;
  bySeries?: Record<SeriesType, number>;
}

// Atom types
export type AtomStatus = 'draft' | 'scheduled' | 'posted';

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

  // Subdomain scoping
  subdomain?: Subdomain;
}

export interface AtomWithContent extends Atom {
  thought?: Thought;
}
