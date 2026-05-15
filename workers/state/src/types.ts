/**
 * Shared types for the state worker. Mirrored on the client so admin-solid
 * can deserialize WebSocket payloads with type safety.
 */

export type Link = {
  id: string;
  url: string;
  title?: string;
  tag?: string;
  note?: string;
  source?: "rudy" | "shortcut" | "admin" | "manual";
  savedAt: string;
};

export type LinkVaultEvent =
  | { type: "snapshot"; links: Link[] }
  | { type: "link.added"; link: Link }
  | { type: "link.removed"; id: string };

export type Commit = {
  sha: string;
  repo: string;
  subject: string;
  author: string;
  ts: string;
  branch?: string;
  parentCount?: number;
};

export type CodeStatsEvent =
  | { type: "snapshot"; commits: Commit[] }
  | { type: "commit.added"; commit: Commit };

export type Bindings = {
  LINK_VAULT: DurableObjectNamespace;
  CODE_STATS: DurableObjectNamespace;
  ALLOWED_ORIGINS: string;
  STATE_PUBLISH_KEY?: string;
};
