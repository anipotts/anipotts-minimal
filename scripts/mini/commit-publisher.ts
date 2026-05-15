#!/usr/bin/env bun
/**
 * Mini commit publisher. Walks ~/Code/projects/** , finds git repos,
 * extracts commits newer than the per-repo cursor, POSTs them to the
 * state worker. Runs every 5 minutes via launchd on ap-mini.
 *
 * Env:
 *   STATE_API           default https://api.anipotts.com
 *   STATE_PUBLISH_KEY   required, bearer token for /api/commits
 *   COMMIT_ROOTS        colon-separated dirs to scan, default ~/Code/projects
 *   CURSOR_FILE         default ~/.anipotts/commit-publisher.cursor.json
 *   MAX_PER_REPO        default 50 (cap on commits sent per repo per run)
 *   AUTHOR_FILTER       optional substring; only publish commits whose author
 *                       email contains this string. Default: no filter.
 */

import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { homedir } from "node:os";

const STATE_API = process.env.STATE_API ?? "https://api.anipotts.com";
const PUBLISH_KEY = process.env.STATE_PUBLISH_KEY;
const ROOTS = (process.env.COMMIT_ROOTS ?? join(homedir(), "Code/projects")).split(":");
const CURSOR_FILE =
  process.env.CURSOR_FILE ?? join(homedir(), ".anipotts/commit-publisher.cursor.json");
const MAX_PER_REPO = Number(process.env.MAX_PER_REPO ?? "50");
const AUTHOR_FILTER = process.env.AUTHOR_FILTER;

if (!PUBLISH_KEY) {
  console.error("STATE_PUBLISH_KEY env var required");
  process.exit(1);
}

type Cursor = Record<string, string>;
type Commit = {
  sha: string;
  repo: string;
  subject: string;
  author: string;
  ts: string;
  branch?: string;
  parentCount?: number;
};

function loadCursor(): Cursor {
  if (!existsSync(CURSOR_FILE)) return {};
  try {
    return JSON.parse(readFileSync(CURSOR_FILE, "utf8")) as Cursor;
  } catch {
    return {};
  }
}

function saveCursor(cursor: Cursor): void {
  mkdirSync(dirname(CURSOR_FILE), { recursive: true });
  writeFileSync(CURSOR_FILE, JSON.stringify(cursor, null, 2));
}

function findGitRepos(roots: string[], maxDepth = 4): string[] {
  const repos: string[] = [];
  for (const root of roots) {
    if (!existsSync(root)) continue;
    walk(root, 0, maxDepth, repos);
  }
  return repos;
}

function walk(dir: string, depth: number, maxDepth: number, out: string[]): void {
  if (depth > maxDepth) return;
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  if (entries.includes(".git")) {
    out.push(dir);
    return;
  }
  for (const entry of entries) {
    if (entry.startsWith(".") || entry === "node_modules") continue;
    const child = join(dir, entry);
    let st;
    try {
      st = statSync(child);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(child, depth + 1, maxDepth, out);
  }
}

function git(repo: string, args: string[]): string {
  const result = spawnSync("git", ["-C", repo, ...args], {
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")} in ${repo} failed: ${result.stderr.trim()}`);
  }
  return result.stdout;
}

function readCommits(repo: string, sinceSha: string | undefined): Commit[] {
  const repoName = basename(repo);
  let branch = "";
  try {
    branch = git(repo, ["rev-parse", "--abbrev-ref", "HEAD"]).trim();
  } catch {
    branch = "";
  }
  if (branch === "HEAD") branch = "";

  const range = sinceSha ? `${sinceSha}..HEAD` : `-n ${MAX_PER_REPO}`;
  const fmt = "%H%x1f%s%x1f%aN%x1f%aE%x1f%aI%x1f%P%x1e";
  let raw: string;
  try {
    raw = git(repo, ["log", `--pretty=format:${fmt}`, "--no-merges", range]);
  } catch (err) {
    console.warn(`skip ${repoName}: ${(err as Error).message.split("\n")[0]}`);
    return [];
  }
  const records = raw.split("\x1e").filter((r) => r.trim().length > 0);
  const commits: Commit[] = [];
  for (const rec of records.slice(0, MAX_PER_REPO)) {
    const [sha, subject, author, email, ts, parents] = rec.split("\x1f");
    if (!sha || !ts) continue;
    if (AUTHOR_FILTER && !(email ?? "").includes(AUTHOR_FILTER)) continue;
    commits.push({
      sha,
      repo: repoName,
      subject: (subject ?? "").trim(),
      author: (author ?? "").trim(),
      ts: ts.trim(),
      branch: branch || undefined,
      parentCount: parents ? parents.trim().split(/\s+/).filter(Boolean).length : 0,
    });
  }
  return commits.reverse();
}

async function publish(commits: Commit[]): Promise<number> {
  if (commits.length === 0) return 0;
  const res = await fetch(`${STATE_API}/api/commits`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${PUBLISH_KEY}`,
    },
    body: JSON.stringify({ commits }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`publish failed: ${res.status} ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as { accepted?: number };
  return data.accepted ?? 0;
}

async function main(): Promise<void> {
  const cursor = loadCursor();
  const repos = findGitRepos(ROOTS);
  let totalSeen = 0;
  let totalAccepted = 0;

  for (const repo of repos) {
    const commits = readCommits(repo, cursor[repo]);
    if (commits.length === 0) continue;
    totalSeen += commits.length;
    try {
      const accepted = await publish(commits);
      totalAccepted += accepted;
      const newest = commits[commits.length - 1];
      if (newest) cursor[repo] = newest.sha;
    } catch (err) {
      console.error(`publish ${basename(repo)}: ${(err as Error).message}`);
    }
  }

  saveCursor(cursor);
  console.log(
    `[commit-publisher] repos=${repos.length} seen=${totalSeen} accepted=${totalAccepted}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
