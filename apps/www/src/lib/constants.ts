import type { SeriesType, ContentStatus } from "@anipotts/types";

export const SERIES_COLORS: Record<SeriesType, string> = {
  tip: "bg-blue-500/20 text-blue-400",
  news: "bg-amber-500/20 text-amber-400",
  tutorial: "bg-green-500/20 text-green-400",
  essay: "bg-purple-500/20 text-purple-400",
  "behind-the-scenes": "bg-pink-500/20 text-pink-400",
};

export const SERIES_OPTIONS: { value: SeriesType; label: string }[] = [
  { value: "tip", label: "Tip" },
  { value: "news", label: "News" },
  { value: "tutorial", label: "Tutorial" },
  { value: "essay", label: "Essay" },
  { value: "behind-the-scenes", label: "Behind the Scenes" },
];

export const STATUS_COLORS: Record<ContentStatus | string, string> = {
  idea: "bg-zinc-700 text-zinc-300",
  draft: "bg-yellow-500/20 text-yellow-400",
  ready: "bg-blue-500/20 text-blue-400",
  atomized: "bg-purple-500/20 text-purple-400",
  published: "bg-green-500/20 text-green-400",
};

export const PLATFORM_ABBREV: Record<string, string> = {
  twitter: "X",
  linkedin: "Li",
  tiktok: "Tk",
  instagram: "Ig",
  threads: "Th",
  bluesky: "Bs",
  mastodon: "Ma",
  youtube: "Yt",
};

export const PLATFORM_COLORS: Record<string, string> = {
  twitter: "bg-sky-500/20 text-sky-400",
  linkedin: "bg-blue-500/20 text-blue-400",
  tiktok: "bg-pink-500/20 text-pink-400",
  instagram: "bg-orange-500/20 text-orange-400",
  threads: "bg-zinc-500/20 text-zinc-300",
  bluesky: "bg-blue-400/20 text-blue-300",
  mastodon: "bg-purple-500/20 text-purple-400",
  youtube: "bg-red-500/20 text-red-400",
};

export const ATOM_STATUS_COLORS: Record<string, string> = {
  draft: "bg-yellow-500/20 text-yellow-400",
  scheduled: "bg-blue-500/20 text-blue-400",
  posted: "bg-green-500/20 text-green-400",
};

export const BUTTONDOWN_STATUS_COLORS: Record<string, string> = {
  draft: "bg-yellow-500/20 text-yellow-400",
  scheduled: "bg-blue-500/20 text-blue-400",
  sent: "bg-green-500/20 text-green-400",
  about_to_send: "bg-orange-500/20 text-orange-400",
  in_flight: "bg-purple-500/20 text-purple-400",
};
