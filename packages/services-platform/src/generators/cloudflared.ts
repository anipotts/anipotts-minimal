import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import yaml from "js-yaml";
import type { ServiceManifestInput, PlannedWrite } from "../types";

// Emit (or plan) a single ingress entry for this service. The real
// ~/.cloudflared/config.yml lives on the Mini; this generator renders the
// ingress rule and reports whether the local reference copy matches.
//
// Local reference copy: ~/.cloudflared/config.yml on MacBook (may not exist;
// that's fine for Session 2a — diff still prints the intended rule).

function cloudflaredPath(): string {
  return join(homedir(), ".cloudflared", "config.yml");
}

interface IngressRule {
  hostname: string;
  service: string;
}

function renderIngressRule(m: ServiceManifestInput): IngressRule {
  return {
    hostname: m.hostname,
    service: `http://localhost:${m.mini.port}`,
  };
}

export async function planCloudflared(
  m: ServiceManifestInput,
): Promise<PlannedWrite> {
  const rule = renderIngressRule(m);
  const body = yaml.dump({ ingress: [rule] });
  const path = cloudflaredPath();
  let existing: string | null = null;
  try {
    existing = await readFile(path, "utf8");
  } catch {
    existing = null;
  }
  // Heuristic: look for the hostname line in the existing config. We don't
  // rewrite the whole file from MacBook — Session 2b handles Mini-side merge.
  const hasHost =
    existing !== null && existing.includes(`hostname: ${rule.hostname}`);
  const changed = !hasHost;
  const summary = hasHost
    ? `unchanged ingress for ${rule.hostname} (already in local ref)`
    : existing === null
      ? `would add ingress for ${rule.hostname} (no local ref at ${path})`
      : `would add ingress for ${rule.hostname} to ${path}`;
  return { kind: "cloudflared", path, changed, summary, body };
}
