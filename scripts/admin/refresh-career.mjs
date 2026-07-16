#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const args = new Set(process.argv.slice(2));
const domain = valueAfter("--domain") ?? "career";
if (domain !== "career") throw new Error("only --domain career is supported");

const baseUrl = process.env.ADMIN_BASE_URL;
const projectionBearer = process.env.ADMIN_PROJECTION_TOKEN;
if (!baseUrl || !projectionBearer)
  throw new Error("ADMIN_BASE_URL and ADMIN_PROJECTION_TOKEN are required");

const jobsRoot = process.env.JOBS_ROOT ?? "/Users/anipotts/Personal/jobs";
const focusPath = resolve(jobsRoot, "docs/briefs/current-focus-2026-07-15.md");
const focus = readFileSync(focusPath, "utf8");
const gitSha = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: jobsRoot,
  encoding: "utf8",
}).trim();
const generatedAt = new Date().toISOString();

const sourceStatus = [
  source(
    "chief/jobs",
    "fresh",
    generatedAt,
    "current task and operating brief observed",
  ),
  source(jobsRoot, "fresh", generatedAt, `main at ${gitSha.slice(0, 7)}`),
];

if (args.has("--include-google")) {
  const account = valueAfter("--account");
  if (!account) throw new Error("--account is required with --include-google");
  probeGog(
    [
      "gmail",
      "search",
      "newer_than:90d (job OR interview OR recruiter OR application)",
      "--account",
      account,
      "--json",
    ],
    "gmail",
    sourceStatus,
    generatedAt,
  );
  probeGog(
    ["calendar", "events", "primary", "--account", account, "--json"],
    "calendar",
    sourceStatus,
    generatedAt,
  );
} else {
  sourceStatus.push(
    source("gmail", "unavailable", null, "manual Google refresh not requested"),
  );
  sourceStatus.push(
    source(
      "calendar",
      "unavailable",
      null,
      "manual Google refresh not requested",
    ),
  );
  sourceStatus.push(
    source(
      "tracker",
      "unavailable",
      null,
      "manual tracker refresh not requested",
    ),
  );
}

const targets = [
  target(
    "kalshi-product",
    "Kalshi",
    "Product",
    "verify the current role and choose whether to apply",
  ),
  target(
    "kalshi-frontend",
    "Kalshi",
    "Frontend",
    "verify the current role and choose whether to apply",
  ),
  target(
    "polymarket-us",
    "Polymarket US",
    "Product engineering",
    "confirm role fit and current opening",
  ),
];

const projection = {
  domain: "career",
  snapshot: {
    snapshot_id: `career-${generatedAt.replaceAll(/[^0-9]/g, "")}`,
    generated_at: generatedAt,
    source_status: sourceStatus,
    current_focus: focus.includes("product")
      ? "funded NYC product, frontend, and full-stack roles"
      : "current job search",
    readiness: "not assessed",
    next_action: "choose the next serious application or follow-up",
    contradictions: [],
    commitments: ["Kalshi Product", "Kalshi Frontend", "Polymarket US"],
    proof_refs: [`git:anipotts/jobs@${gitSha}`],
  },
  targets,
};

const response = await fetch(
  new URL("/api/admin/projections/refresh", baseUrl),
  {
    method: "POST",
    headers: {
      authorization: `Bearer ${projectionBearer}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(projection),
  },
);
if (!response.ok)
  throw new Error(`career refresh rejected with ${response.status}`);
const result = await response.json();
process.stdout.write(
  JSON.stringify({
    ok: true,
    snapshot_id: result.snapshot_id,
    stale: result.stale,
    targets: result.targets,
  }) + "\n",
);

function valueAfter(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}
function source(name, status, observedAt, summary) {
  return { source: name, status, observed_at: observedAt, summary };
}
function target(id, company, role, nextAction) {
  return {
    target_id: `career-target-${id}`,
    company,
    role,
    stage: "research",
    status: "active",
    next_action: nextAction,
    source_refs: ["jobs:recommended-apps"],
    source_links: [],
  };
}
function probeGog(command, name, statuses, observedAt) {
  try {
    execFileSync("gog", command, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 8 * 1024 * 1024,
    });
    statuses.push(
      source(name, "fresh", observedAt, "job-related source inspected locally"),
    );
  } catch {
    statuses.push(source(name, "stale", null, "source refresh failed"));
  }
}
