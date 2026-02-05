import { useCallback } from "react";
import { publicSubdomains } from "@anipotts/lib/data";
import { commandNames } from "./commands";

const subdomainNames = publicSubdomains.map((s) => s.name);

// Commands that accept a subdomain argument
const subdomainArgCommands = new Set(["cd", "open", "ping"]);

export function useTabCompletion() {
  const complete = useCallback((input: string): { completed: string; options: string[] } => {
    const trimmed = input.trimStart();
    const parts = trimmed.split(/\s+/);

    // Completing the command name
    if (parts.length <= 1) {
      const partial = parts[0]?.toLowerCase() ?? "";
      const matches = commandNames.filter((c) => c.startsWith(partial));
      if (matches.length === 1) {
        return { completed: matches[0] + " ", options: [] };
      }
      return { completed: input, options: matches };
    }

    // Completing a subdomain argument
    const cmd = parts[0].toLowerCase();
    if (subdomainArgCommands.has(cmd)) {
      const partial = parts[parts.length - 1].toLowerCase();
      const matches = subdomainNames.filter((s) => s.startsWith(partial));
      if (matches.length === 1) {
        const newParts = [...parts.slice(0, -1), matches[0]];
        return { completed: newParts.join(" "), options: [] };
      }
      return { completed: input, options: matches };
    }

    return { completed: input, options: [] };
  }, []);

  return { complete };
}
