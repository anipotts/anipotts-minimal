/**
 * Canonical language → color mapping used by both GitHub and WakaTime metrics.
 * Colors match GitHub Linguist where available.
 */
export const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Go: "#00ADD8",
  Rust: "#dea584",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  HTML: "#e34c26",
  CSS: "#563d7c",
  SCSS: "#c6538c",
  Shell: "#89e051",
  Bash: "#89e051",
  SQL: "#e38c00",
  Markdown: "#083fa1",
  JSON: "#292929",
  YAML: "#cb171e",
  Lua: "#000080",
  Docker: "#384d54",
  Dockerfile: "#384d54",
  Nix: "#7e7eff",
  HCL: "#844fba",
  Zig: "#ec915c",
  MDX: "#fcb32c",
  Other: "#6b7280",
};

/** Get the color for a language name, falling back to "Other". */
export function getLanguageColor(name: string): string {
  return LANGUAGE_COLORS[name] ?? LANGUAGE_COLORS["Other"] ?? "#6b7280";
}
