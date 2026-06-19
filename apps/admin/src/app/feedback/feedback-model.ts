export type TypeFilter = "all" | "bug" | "feature" | "general";
export type StatusFilter = "open" | "closed" | "reopened" | "all";

export const TYPE_FILTERS: TypeFilter[] = ["all", "bug", "feature", "general"];
export const STATUS_FILTERS: StatusFilter[] = [
  "all",
  "open",
  "closed",
  "reopened",
];
