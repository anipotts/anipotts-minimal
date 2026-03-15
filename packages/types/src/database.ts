import type { ProjectCategory, ProjectStatus } from "./project";
import type {
  ContentType,
  SeriesType,
  ContentStatus,
  VoiceMode,
  ArtifactType,
  Platform,
  AtomStatus,
  Section,
} from "./thought";

// ---------------------------------------------------------------------------
// Helpers: make nullable + auto-generated columns optional for Insert
// ---------------------------------------------------------------------------

type NullableKeys<T> = {
  [K in keyof T]: null extends T[K] ? K : never;
}[keyof T];

type InsertType<Row, AutoKeys extends keyof Row = never> = Omit<
  Row,
  AutoKeys | NullableKeys<Row>
> &
  Partial<Pick<Row, AutoKeys | NullableKeys<Row>>>;

// ---------------------------------------------------------------------------
// Supabase Database type (generic parameter for createClient<Database>())
// ---------------------------------------------------------------------------

export interface Database {
  public: {
    Tables: {
      thoughts: {
        Row: {
          id: string;
          slug: string;
          title: string;
          summary: string;
          content: string;
          tags: string[];
          created_at: string;
          updated_at: string;
          views: number;
          published: boolean;
          content_type: ContentType | null;
          series_type: SeriesType | null;
          status: ContentStatus | null;
          artifact_url: string | null;
          artifact_type: ArtifactType | null;
          platforms_targeted: Platform[] | null;
          platforms_posted: Platform[] | null;
          voice_mode: VoiceMode | null;
          project: string | null;
          published_at: string | null;
          scheduled_at: string | null;
          section: Section | null;
        };
        Insert: InsertType<
          Database["public"]["Tables"]["thoughts"]["Row"],
          "id" | "created_at" | "updated_at" | "views"
        >;
        Update: Partial<Database["public"]["Tables"]["thoughts"]["Row"]>;
        Relationships: [];
      };
      atoms: {
        Row: {
          id: string;
          content_id: string;
          platform: Platform;
          atom_content: string;
          voice_mode: VoiceMode | null;
          hashtags: string[] | null;
          status: AtomStatus;
          typefully_draft_id: string | null;
          scheduled_at: string | null;
          posted_at: string | null;
          external_url: string | null;
          created_at: string;
          updated_at: string;
          section: Section | null;
        };
        Insert: InsertType<
          Database["public"]["Tables"]["atoms"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["atoms"]["Row"]>;
        Relationships: [];
      };
      projects: {
        Row: {
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
          image_url: string | null;
          thumbnail_url: string | null;
          link_live: string | null;
          link_repo: string | null;
          link_page: string | null;
          sort_order: number;
          visible: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: InsertType<
          Database["public"]["Tables"]["projects"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["projects"]["Row"]>;
        Relationships: [];
      };
      social_links: {
        Row: {
          id: string;
          name: string;
          url: string;
          icon: string;
          description: string | null;
          sort_order: number;
          visible: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: InsertType<
          Database["public"]["Tables"]["social_links"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["social_links"]["Row"]>;
        Relationships: [];
      };
      page_content: {
        Row: {
          id: string;
          page_key: string;
          content: unknown;
          version: number;
          published: boolean;
          updated_at: string;
          updated_by: string | null;
          created_at: string;
        };
        Insert: InsertType<
          Database["public"]["Tables"]["page_content"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["page_content"]["Row"]>;
        Relationships: [];
      };
      site_settings: {
        Row: {
          id: string;
          key: string;
          value: string;
          created_at: string;
          updated_at: string;
        };
        Insert: InsertType<
          Database["public"]["Tables"]["site_settings"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["site_settings"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      search_content: {
        Args: { query: string; lim: number };
        Returns: {
          type: string;
          id: string;
          slug: string;
          title: string;
          summary: string;
          rank: number;
        }[];
      };
    };
    Enums: Record<string, never>;
  };
}
