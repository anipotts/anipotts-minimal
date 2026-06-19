import { defaultDropAnimationSideEffects } from "@dnd-kit/core";
import type { ContentStatus } from "@anipotts/types";

export interface BoardItem {
  id: string;
  title: string;
  status: string;
  series_type: string | null;
  atom_count: number;
  platforms_posted: string[];
  updated_at: string;
}

export interface PipelineBoardProps {
  items: BoardItem[];
}

export const COLUMNS: ContentStatus[] = [
  "idea",
  "draft",
  "ready",
  "atomized",
  "published",
];

export const COLUMN_HEADER_COLORS: Record<string, string> = {
  idea: "bg-zinc-700",
  draft: "bg-yellow-500/20",
  ready: "bg-blue-500/20",
  atomized: "bg-purple-500/20",
  published: "bg-green-500/20",
};

export const dropAnimation = {
  duration: 150,
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: "0.4" } },
  }),
};
