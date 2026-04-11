// Typefully API types

export interface TypefullyDraft {
  id: number;
  status: "draft" | "scheduled" | "published" | "error" | "publishing";
  draft_title?: string;
  share_url?: string;
  created_at: string;
  updated_at: string;
  scheduled_date?: string;
  published_at?: string;
  platforms: Record<
    string,
    {
      enabled: boolean;
      posts: { text: string; media_ids?: string[] }[];
      settings?: Record<string, unknown>;
    }
  >;
  tags?: string[];
  scratchpad_text?: string;
}

export interface TypefullyQueueSummary {
  connected: boolean;
  drafts: TypefullyDraft[];
  scheduledCount: number;
  publishedThisMonth: number;
  postsRemaining: number;
  monthlyLimit: number;
}
