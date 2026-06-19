import type {
  MiniRepoStatus,
  MiniRepos,
  MiniSessions,
} from "@anipotts/lib/mini";

export type SortKey = "name" | "dirty" | "unpushed";

export interface InitialCodeData {
  repos: MiniRepos | null;
  sessions: MiniSessions | null;
}

export function sortRepos(
  repos: MiniRepoStatus[],
  sortBy: SortKey,
): MiniRepoStatus[] {
  return [...repos].sort((a, b) => {
    switch (sortBy) {
      case "dirty":
        if (a.dirty !== b.dirty) return a.dirty ? -1 : 1;
        return a.name.localeCompare(b.name);
      case "unpushed":
        if (a.unpushed_count !== b.unpushed_count)
          return b.unpushed_count - a.unpushed_count;
        return a.name.localeCompare(b.name);
      case "name":
      default:
        return a.name.localeCompare(b.name);
    }
  });
}
