import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { ServiceManifestInput, PlannedWrite } from "../types";

// Expand leading ~ in a path to the user's home dir.
function expandHome(p: string): string {
  if (p === "~") return homedir();
  if (p.startsWith("~/")) return join(homedir(), p.slice(2));
  return p;
}

export function plistLabel(name: string): string {
  return `com.anipotts.services.${name}`;
}

export function plistPath(name: string): string {
  return join(
    homedir(),
    "Library",
    "LaunchAgents",
    `${plistLabel(name)}.plist`,
  );
}

function xmlEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function renderPlist(m: ServiceManifestInput): string {
  const label = plistLabel(m.name);
  const wd = expandHome(m.mini.workingDir);
  const args = m.mini.command
    .map((a) => `    <string>${xmlEscape(a)}</string>`)
    .join("\n");
  const envEntries = m.mini.env ?? {};
  const envBlock = Object.keys(envEntries).length
    ? [
        "  <key>EnvironmentVariables</key>",
        "  <dict>",
        ...Object.entries(envEntries).flatMap(([k, v]) => [
          `    <key>${xmlEscape(k)}</key>`,
          `    <string>${xmlEscape(v)}</string>`,
        ]),
        "  </dict>",
      ].join("\n")
    : "";
  const stdoutPath = join(homedir(), ".pro", "logs", `${m.name}.out.log`);
  const stderrPath = join(homedir(), ".pro", "logs", `${m.name}.err.log`);

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">`,
    `<plist version="1.0">`,
    `<dict>`,
    `  <key>Label</key>`,
    `  <string>${label}</string>`,
    `  <key>ProgramArguments</key>`,
    `  <array>`,
    args,
    `  </array>`,
    `  <key>WorkingDirectory</key>`,
    `  <string>${xmlEscape(wd)}</string>`,
    `  <key>RunAtLoad</key>`,
    `  <true/>`,
    `  <key>KeepAlive</key>`,
    `  <true/>`,
    envBlock,
    `  <key>StandardOutPath</key>`,
    `  <string>${xmlEscape(stdoutPath)}</string>`,
    `  <key>StandardErrorPath</key>`,
    `  <string>${xmlEscape(stderrPath)}</string>`,
    `</dict>`,
    `</plist>`,
  ]
    .filter((l) => l !== "")
    .join("\n");
}

export async function planPlist(
  m: ServiceManifestInput,
): Promise<PlannedWrite> {
  const path = plistPath(m.name);
  const body = renderPlist(m);
  let existing: string | null = null;
  try {
    existing = await readFile(path, "utf8");
  } catch {
    existing = null;
  }
  const changed = existing === null || existing.trim() !== body.trim();
  let verb: "create" | "update" | "unchanged";
  if (existing === null) verb = "create";
  else if (changed) verb = "update";
  else verb = "unchanged";
  return { kind: "plist", path, changed, summary: `${verb} ${path}`, body };
}
