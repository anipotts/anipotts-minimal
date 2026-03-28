const TIPS_REPO = "https://github.com/anipotts/claude-code-tips";
const TIPS_BLOB = `${TIPS_REPO}/blob/main`;
const MINE_REPO = "https://github.com/anipotts/mine";
const MINE_BLOB = `${MINE_REPO}/blob/main`;

export { TIPS_REPO, TIPS_BLOB, MINE_REPO, MINE_BLOB };

// --- Plugin (mine) ---

export interface MineFeature {
  name: string;
  desc: string;
}

export const minePlugin = {
  name: "mine",
  tagline:
    "mines every claude code session into a local sqlite database. total recall for your dev work.",
  install: "claude plugin add anipotts/mine",
  href: MINE_REPO,
  features: [
    { name: "/mine", desc: "7-day dashboard with projects, tools, models" },
    {
      name: "/mine search",
      desc: "full-text search across all conversations",
    },
    { name: "/mine mistakes", desc: "error patterns claude keeps repeating" },
    { name: "/mine hotspots", desc: "most-edited files across sessions" },
    { name: "/mine loops", desc: "where you got stuck" },
    {
      name: "/mine cost",
      desc: "cost breakdown by project, model, daily trend",
    },
  ] satisfies MineFeature[],
};

// --- Hooks ---

export interface Hook {
  name: string;
  event: string;
  desc: string;
  href: string;
}

export const hooks: Hook[] = [
  {
    name: "safety-guard",
    event: "PreToolUse",
    desc: "blocks force pushes, rm -rf, DROP TABLE, curl|bash",
    href: `${TIPS_BLOB}/hooks/safety-guard.sh`,
  },
  {
    name: "panopticon",
    event: "PostToolUse",
    desc: "logs every tool action to a local sqlite audit trail",
    href: `${TIPS_BLOB}/hooks/panopticon.sh`,
  },
  {
    name: "context-save",
    event: "PreCompact",
    desc: "writes a handoff summary before context compaction",
    href: `${TIPS_BLOB}/hooks/context-save.sh`,
  },
  {
    name: "no-squash",
    event: "PreToolUse",
    desc: "blocks squash merges. regular merges only.",
    href: `${TIPS_BLOB}/hooks/no-squash.sh`,
  },
  {
    name: "notify",
    event: "Notification",
    desc: "routes claude code notifications to macOS alerts",
    href: `${TIPS_BLOB}/hooks/notify.sh`,
  },
  {
    name: "commit-nudge",
    event: "PostToolUse",
    desc: "reminds you to commit after many file edits",
    href: `${TIPS_BLOB}/hooks/commit-nudge.sh`,
  },
  {
    name: "replay-capture",
    event: "Stop",
    desc: "captures session summary for replay and handoffs",
    href: `${TIPS_BLOB}/hooks/replay-capture.sh`,
  },
  {
    name: "stats-refresh",
    event: "SessionStart",
    desc: "refreshes repo stats from mine.db once per day",
    href: `${TIPS_BLOB}/hooks/stats-refresh.sh`,
  },
];

// --- Docs ---

export interface Doc {
  name: string;
  desc: string;
  href: string;
}

export const docs: Doc[] = [
  {
    name: "hooks",
    desc: "the enforcement layer behind automation",
    href: `${TIPS_BLOB}/docs/hooks.md`,
  },
  {
    name: "agents",
    desc: "agent configuration and custom agents",
    href: `${TIPS_BLOB}/docs/agents.md`,
  },
  {
    name: "cost",
    desc: "what claude code actually costs, with real numbers",
    href: `${TIPS_BLOB}/docs/cost.md`,
  },
  {
    name: "automation",
    desc: "daemons, cron, github actions patterns",
    href: `${TIPS_BLOB}/docs/automation.md`,
  },
  {
    name: "mistakes",
    desc: "mistakes i keep making and the fixes",
    href: `${TIPS_BLOB}/docs/mistakes.md`,
  },
  {
    name: "my stack",
    desc: "the 12 CI pipelines that maintain this repo",
    href: `${TIPS_BLOB}/docs/my-stack.md`,
  },
  {
    name: "session workflow",
    desc: "how i start a session",
    href: `${TIPS_BLOB}/docs/session-workflow.md`,
  },
  {
    name: "worktrees",
    desc: "parallel branches without context switching",
    href: `${TIPS_BLOB}/docs/worktrees.md`,
  },
];
