import fs from "fs";
import path from "path";
import os from "os";
import readline from "readline";
import { execSync } from "child_process";

const projectRoot = process.cwd();
const timeZone = process.env.CLAUDE_STATS_TIMEZONE || "America/New_York";
const projectsDir =
  process.env.CLAUDE_PROJECTS_DIR ||
  path.join(os.homedir(), ".claude", "projects");
const outPath =
  process.env.CLAUDE_STATS_OUT ||
  path.join(
    projectRoot,
    "apps",
    "www",
    "src",
    "app",
    "(main)",
    "claude",
    "claude-stats.json",
  );
const maxDepth = Number(process.env.CLAUDE_STATS_MAX_DEPTH || 6);
const gitSinceDays = Number(process.env.CLAUDE_STATS_GIT_SINCE_DAYS || 180);
const now = new Date();

const TOOL_MINUTES = new Map([
  ["Write", 5],
  ["Edit", 5],
  ["MultiEdit", 5],
  ["Bash", 2],
  ["Agent", 15],
  ["Read", 0.5],
  ["Grep", 1],
  ["Glob", 1],
  ["ToolSearch", 1],
]);

const FILE_MUTATION_TOOLS = new Set(["Write", "Edit", "MultiEdit"]);

function toDateKey(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatDateTime(date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function isDirectoryEntry(entry) {
  return entry.isDirectory && entry.isDirectory();
}

function isFileEntry(entry) {
  return entry.isFile && entry.isFile();
}

function shouldSkipDir(name) {
  return name.startsWith(".") || name === "node_modules" || name === "dist";
}

async function findJsonlFiles(rootDir, depth = 0, acc = []) {
  if (depth > maxDepth) return acc;
  let entries;
  try {
    entries = await fs.promises.readdir(rootDir, { withFileTypes: true });
  } catch (error) {
    return acc;
  }

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (isDirectoryEntry(entry)) {
      if (!shouldSkipDir(entry.name)) {
        await findJsonlFiles(fullPath, depth + 1, acc);
      }
      continue;
    }
    if (isFileEntry(entry) && entry.name.endsWith(".jsonl")) {
      const isSubagent = fullPath.includes("/subagents/");
      acc.push({ path: fullPath, isSubagent });
    }
  }

  return acc;
}

async function parseSession(filePath) {
  const sessionId = path.basename(filePath, ".jsonl");
  const stream = fs.createReadStream(filePath, "utf8");
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let startTime = null;
  let endTime = null;
  let project = null;
  let toolCalls = 0;
  let toolCounts = {};
  let fileSet = new Set();

  for await (const line of rl) {
    if (!line.trim()) continue;
    let record;
    try {
      record = JSON.parse(line);
    } catch (error) {
      continue;
    }

    if (!project && typeof record.cwd === "string") {
      const base = path.basename(record.cwd);
      project = base || record.cwd || "unknown";
    }

    if (record.timestamp) {
      const ts = new Date(record.timestamp);
      if (!Number.isNaN(ts.getTime())) {
        if (!startTime || ts < startTime) startTime = ts;
        if (!endTime || ts > endTime) endTime = ts;
      }
    }

    const msg = record.message;
    if (!msg || typeof msg !== "object") continue;

    const content = Array.isArray(msg.content) ? msg.content : [];
    for (const block of content) {
      if (!block || block.type !== "tool_use") continue;
      const name = block.name || "unknown";
      toolCalls += 1;
      toolCounts[name] = (toolCounts[name] || 0) + 1;

      if (FILE_MUTATION_TOOLS.has(name)) {
        const input = block.input || {};
        const filePathValue =
          input.file_path || input.path || input.filename || null;
        if (typeof filePathValue === "string") {
          fileSet.add(filePathValue);
        }
      }
    }
  }

  if (!startTime || !endTime) {
    return null;
  }

  const durationMinutes = Math.max(
    0,
    (endTime.getTime() - startTime.getTime()) / 60000,
  );

  return {
    id: sessionId,
    project: project || "unknown",
    startTime,
    endTime,
    durationMinutes,
    toolCalls,
    toolCounts,
    filesMutated: fileSet,
  };
}

function getRecentDays(count) {
  const days = [];
  const start = new Date(now);
  start.setDate(start.getDate() - (count - 1));
  for (let i = 0; i < count; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    days.push(toDateKey(date));
  }
  return days;
}

function calculateStreak(dates) {
  const daySet = new Set(dates);
  let streak = 0;
  let cursor = new Date(now);
  while (true) {
    const key = toDateKey(cursor);
    if (!daySet.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function findGitRepos(rootDir, depth = 0, acc = []) {
  if (depth > maxDepth) return acc;
  let entries;
  try {
    entries = fs.readdirSync(rootDir, { withFileTypes: true });
  } catch (error) {
    return acc;
  }

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (isDirectoryEntry(entry)) {
      if (entry.name === ".git") {
        acc.push(path.dirname(fullPath));
        continue;
      }
      if (!shouldSkipDir(entry.name)) {
        findGitRepos(fullPath, depth + 1, acc);
      }
    }
  }

  return acc;
}

function calculateFastestCommitCadence(repos) {
  let best = { commitsPerHour: 0, repo: null, windowStart: null };
  const sinceArg = `--since=${gitSinceDays}.days`;

  for (const repo of repos) {
    let output;
    try {
      output = execSync(
        `git -C "${repo}" log ${sinceArg} --pretty=%ct`,
        { stdio: ["ignore", "pipe", "ignore"] },
      )
        .toString()
        .trim();
    } catch (error) {
      continue;
    }

    if (!output) continue;
    const timestamps = output
      .split("\n")
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value));

    const buckets = new Map();
    for (const ts of timestamps) {
      const hour = Math.floor(ts / 3600);
      buckets.set(hour, (buckets.get(hour) || 0) + 1);
    }

    for (const [hour, count] of buckets) {
      if (count > best.commitsPerHour) {
        best = {
          commitsPerHour: count,
          repo: path.basename(repo),
          windowStart: new Date(hour * 3600 * 1000).toISOString(),
        };
      }
    }
  }

  return best;
}

// Cap per-session duration to filter stale/overnight sessions (6 hours)
const MAX_SESSION_MINUTES = 360;

async function main() {
  const jsonlFiles = await findJsonlFiles(projectsDir);
  const mainSessions = [];
  const toolTotals = {};
  const dailyMap = new Map();
  const allFiles = new Set();
  const sessionDates = [];

  let mainToolCalls = 0;
  let subagentToolCalls = 0;
  let subagentCount = 0;
  let totalHoursUsed = 0;
  let mostFilesChanged = { files: 0, session: null };
  let longestSession = { duration: 0, session: null };
  let mostToolCalls = { toolCalls: 0, session: null };

  let latestMtime = null;

  for (const file of jsonlFiles) {
    let stat;
    try {
      stat = fs.statSync(file.path);
    } catch (error) {
      continue;
    }

    if (!latestMtime || stat.mtime > latestMtime) {
      latestMtime = stat.mtime;
    }

    const session = await parseSession(file.path);
    if (!session) continue;

    // Track subagent stats separately
    if (file.isSubagent) {
      subagentToolCalls += session.toolCalls;
      subagentCount += 1;
      // Subagent file mutations still count toward total impact
      for (const f of session.filesMutated) allFiles.add(f);
      // Subagent tool counts still count toward tool diversity
      for (const [toolName, count] of Object.entries(session.toolCounts)) {
        toolTotals[toolName] = (toolTotals[toolName] || 0) + count;
      }
      continue;
    }

    // Main session processing
    const dayKey = toDateKey(session.startTime);
    sessionDates.push(dayKey);

    mainToolCalls += session.toolCalls;

    for (const [toolName, count] of Object.entries(session.toolCounts)) {
      toolTotals[toolName] = (toolTotals[toolName] || 0) + count;
    }

    const filesCount = session.filesMutated.size;
    for (const f of session.filesMutated) allFiles.add(f);

    // Accumulate hours (capped per session to exclude stale/overnight)
    const cappedMinutes = Math.min(session.durationMinutes, MAX_SESSION_MINUTES);
    totalHoursUsed += cappedMinutes / 60;

    const dailyEntry = dailyMap.get(dayKey) || { toolCalls: 0, files: 0 };
    dailyEntry.toolCalls += session.toolCalls;
    dailyEntry.files += filesCount;
    dailyMap.set(dayKey, dailyEntry);

    if (filesCount > mostFilesChanged.files) {
      mostFilesChanged = { files: filesCount, session };
    }

    // Use capped duration for records to avoid stale session outliers
    if (cappedMinutes > longestSession.duration) {
      longestSession = { duration: cappedMinutes, session };
    }

    if (session.toolCalls > mostToolCalls.toolCalls) {
      mostToolCalls = { toolCalls: session.toolCalls, session };
    }

    mainSessions.push(session);
  }

  mainSessions.sort((a, b) => b.startTime - a.startTime);

  const totalMainSessions = mainSessions.length;
  const streakDays = calculateStreak(sessionDates);
  const recentDays = getRecentDays(90);
  const daily = recentDays.map((date) => ({
    date,
    toolCalls: dailyMap.get(date)?.toolCalls || 0,
    filesMutated: dailyMap.get(date)?.files || 0,
  }));

  const liveWindow = 60 * 1000;
  const isCodingNow =
    latestMtime && now.getTime() - latestMtime.getTime() <= liveWindow;

  const repos = [
    path.join(os.homedir(), "Code", "active"),
    path.join(os.homedir(), "Code", "organizations"),
  ];
  const repoDirs = new Set();
  for (const root of repos) {
    const found = findGitRepos(root);
    for (const repo of found) repoDirs.add(repo);
  }

  const fastestCommitCadence = calculateFastestCommitCadence(
    Array.from(repoDirs),
  );

  const stats = {
    generatedAt: now.toISOString(),
    timezone: timeZone,
    totals: {
      sessions: totalMainSessions,
      hoursUsed: Math.round(totalHoursUsed),
      toolCalls: mainToolCalls,
      filesMutated: allFiles.size,
      streakDays,
    },
    subagents: {
      sessions: subagentCount,
      toolCalls: subagentToolCalls,
    },
    combined: {
      totalToolCalls: mainToolCalls + subagentToolCalls,
      totalSessions: totalMainSessions + subagentCount,
    },
    tools: toolTotals,
    daily,
    sessions: mainSessions.slice(0, 20).map((session) => ({
      id: session.id,
      project: session.project,
      start: session.startTime.toISOString(),
      end: session.endTime.toISOString(),
      durationMinutes: Math.round(
        Math.min(session.durationMinutes, MAX_SESSION_MINUTES) * 10,
      ) / 10,
      toolCalls: session.toolCalls,
      filesMutated: session.filesMutated.size,
    })),
    records: {
      fastestCommitCadence: {
        commitsPerHour: fastestCommitCadence.commitsPerHour,
        repo: fastestCommitCadence.repo,
        windowStart: fastestCommitCadence.windowStart,
      },
      mostFilesChanged: {
        files: mostFilesChanged.files,
        sessionId: mostFilesChanged.session?.id || null,
        startedAt: mostFilesChanged.session
          ? mostFilesChanged.session.startTime.toISOString()
          : null,
        project: mostFilesChanged.session?.project || null,
      },
      longestSession: {
        durationMinutes: Math.round(longestSession.duration * 10) / 10,
        sessionId: longestSession.session?.id || null,
        startedAt: longestSession.session
          ? longestSession.session.startTime.toISOString()
          : null,
        project: longestSession.session?.project || null,
      },
      mostToolCalls: {
        toolCalls: mostToolCalls.toolCalls,
        sessionId: mostToolCalls.session?.id || null,
        startedAt: mostToolCalls.session
          ? mostToolCalls.session.startTime.toISOString()
          : null,
        project: mostToolCalls.session?.project || null,
      },
    },
    live: {
      isCodingNow: Boolean(isCodingNow),
      lastModifiedAt: latestMtime ? latestMtime.toISOString() : null,
    },
    meta: {
      projectCount: repoDirs.size,
      sinceDays: gitSinceDays,
      mainSessionFiles: jsonlFiles.filter((f) => !f.isSubagent).length,
      subagentSessionFiles: jsonlFiles.filter((f) => f.isSubagent).length,
      maxSessionMinutesCap: MAX_SESSION_MINUTES,
    },
    labels: {
      generatedAtLocal: formatDateTime(now),
    },
  };

  await fs.promises.mkdir(path.dirname(outPath), { recursive: true });
  await fs.promises.writeFile(outPath, JSON.stringify(stats, null, 2));

  console.log(`Wrote ${outPath}`);
  console.log(
    `Main sessions: ${totalMainSessions} | Hours: ${Math.round(totalHoursUsed)} | Tool calls: ${mainToolCalls} | Subagents: ${subagentCount}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
