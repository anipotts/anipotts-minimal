export const PROMPT_USER = "ani@potts";

export const ANIMATION_CONFIG = {
  stiffness: 400,
  damping: 35,
  mass: 0.8,
} as const;

export const TERMINAL_HEIGHT = "45vh";

export const MAX_HISTORY = 50;

export const CURSOR_BLINK_MS = 530;

export function getPromptPath(subdomain: string): string {
  if (subdomain === "www") return "~/anipotts.com";
  return `~/${subdomain}.anipotts.com`;
}

export function getMotd(): string {
  const now = new Date();
  const dateStr = now.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  return [
    `Last login: ${dateStr} on ttys001`,
    "ani@potts.com \u2014 9 hosts available",
    "Type 'help' for commands or 'ls' to list sites.",
    "",
  ].join("\n");
}
