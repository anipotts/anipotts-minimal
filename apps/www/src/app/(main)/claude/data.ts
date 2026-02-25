const REPO = "https://github.com/anipotts/claude-code-tips";
const BLOB = `${REPO}/blob/main`;

export { REPO, BLOB };

// --- Plugins ---

export interface PluginFeature {
  name: string;
  desc: string;
  href: string;
}

export interface Plugin {
  name: string;
  slug: string;
  tagline: string;
  install: string;
  href: string;
  features: PluginFeature[];
  flagship?: boolean;
}

export const plugins: Plugin[] = [
  {
    name: "miner",
    slug: "miner",
    tagline: "session analytics, cost tracking, and usage insights for claude code",
    install: "claude plugin add anipotts/claude-code-tips miner",
    href: `${BLOB}/plugins/miner`,
    flagship: true,
    features: [
      { name: "session logger", desc: "logs every session with token counts, duration, cost", href: `${BLOB}/plugins/miner/session-logger.md` },
      { name: "cost dashboard", desc: "daily/weekly/monthly spend breakdowns", href: `${BLOB}/plugins/miner/cost-dashboard.md` },
      { name: "tool call tracker", desc: "tracks which tools get used and how often", href: `${BLOB}/plugins/miner/tool-tracker.md` },
      { name: "conversation stats", desc: "message counts, turn ratios, context usage", href: `${BLOB}/plugins/miner/conversation-stats.md` },
    ],
  },
  {
    name: "handoff",
    slug: "handoff",
    tagline: "seamless context transfer between claude code sessions",
    install: "claude plugin add anipotts/claude-code-tips handoff",
    href: `${BLOB}/plugins/handoff`,
    features: [
      { name: "context snapshot", desc: "save and restore session context", href: `${BLOB}/plugins/handoff/context-snapshot.md` },
      { name: "task continuation", desc: "pick up where you left off across sessions", href: `${BLOB}/plugins/handoff/task-continuation.md` },
    ],
  },
  {
    name: "broadcast",
    slug: "broadcast",
    tagline: "share claude code session highlights and outputs",
    install: "claude plugin add anipotts/claude-code-tips broadcast",
    href: `${BLOB}/plugins/broadcast`,
    features: [
      { name: "session export", desc: "export sessions as markdown or json", href: `${BLOB}/plugins/broadcast/session-export.md` },
      { name: "highlight reel", desc: "auto-extract the best parts of a session", href: `${BLOB}/plugins/broadcast/highlight-reel.md` },
    ],
  },
];

// --- Hooks ---

export interface Hook {
  name: string;
  event: string;
  desc: string;
  href: string;
}

export const hooks: Hook[] = [
  { name: "pre-commit-lint", event: "PreToolCall", desc: "runs linter before any file write commits", href: `${BLOB}/hooks/pre-commit-lint.md` },
  { name: "auto-context", event: "PostToolCall", desc: "injects relevant context after file reads", href: `${BLOB}/hooks/auto-context.md` },
  { name: "cost-guard", event: "PreToolCall", desc: "warns when a session is about to exceed cost threshold", href: `${BLOB}/hooks/cost-guard.md` },
  { name: "output-sanitizer", event: "PostToolCall", desc: "strips sensitive data from tool outputs", href: `${BLOB}/hooks/output-sanitizer.md` },
  { name: "session-bookmarks", event: "Notification", desc: "saves bookmarks at key moments in a session", href: `${BLOB}/hooks/session-bookmarks.md` },
];

// --- Skills & Commands ---

export interface Skill {
  name: string;
  desc: string;
  href: string;
}

export const skills: Skill[] = [
  { name: "/review", desc: "code review with inline comments", href: `${BLOB}/skills/review.md` },
  { name: "/refactor", desc: "safe refactoring with test coverage", href: `${BLOB}/skills/refactor.md` },
  { name: "/explain", desc: "deep explanation of any codebase", href: `${BLOB}/skills/explain.md` },
  { name: "/test", desc: "generate tests for uncovered code", href: `${BLOB}/skills/test.md` },
  { name: "/debug", desc: "systematic debugging workflow", href: `${BLOB}/skills/debug.md` },
  { name: "/deploy", desc: "deployment checklist and execution", href: `${BLOB}/skills/deploy.md` },
  { name: "/migrate", desc: "dependency and framework migrations", href: `${BLOB}/skills/migrate.md` },
  { name: "/perf", desc: "performance profiling and optimization", href: `${BLOB}/skills/perf.md` },
];

// --- Agents ---

export interface Agent {
  name: string;
  desc: string;
  href: string;
}

export const agents: Agent[] = [
  { name: "architect", desc: "system design and project scaffolding", href: `${BLOB}/agents/architect.md` },
  { name: "reviewer", desc: "thorough code review with context", href: `${BLOB}/agents/reviewer.md` },
  { name: "debugger", desc: "root cause analysis and fix suggestion", href: `${BLOB}/agents/debugger.md` },
  { name: "writer", desc: "documentation and readme generation", href: `${BLOB}/agents/writer.md` },
  { name: "tester", desc: "test generation and coverage analysis", href: `${BLOB}/agents/tester.md` },
  { name: "optimizer", desc: "performance and bundle optimization", href: `${BLOB}/agents/optimizer.md` },
  { name: "migrator", desc: "framework and dependency upgrades", href: `${BLOB}/agents/migrator.md` },
  { name: "security", desc: "vulnerability scanning and hardening", href: `${BLOB}/agents/security.md` },
];

// --- Guide ---

export interface GuideTier {
  level: string;
  label: string;
  topics: string[];
  href: string;
}

export const guideTiers: GuideTier[] = [
  {
    level: "beginner",
    label: "getting started",
    topics: ["installation and setup", "your first session", "basic commands", "understanding context windows"],
    href: `${BLOB}/docs/guide.md#beginner`,
  },
  {
    level: "intermediate",
    label: "leveling up",
    topics: ["custom instructions (CLAUDE.md)", "hooks and plugins", "multi-file editing", "cost optimization"],
    href: `${BLOB}/docs/guide.md#intermediate`,
  },
  {
    level: "advanced",
    label: "power user",
    topics: ["custom agents", "MCP server integration", "CI/CD workflows", "enterprise patterns"],
    href: `${BLOB}/docs/guide.md#advanced`,
  },
];

// --- Docs ---

export interface Doc {
  name: string;
  desc: string;
  href: string;
}

export const docs: Doc[] = [
  { name: "guide.md", desc: "comprehensive getting started guide", href: `${BLOB}/docs/guide.md` },
  { name: "plugins.md", desc: "plugin system architecture and API", href: `${BLOB}/docs/plugins.md` },
  { name: "hooks.md", desc: "hook events, lifecycle, and examples", href: `${BLOB}/docs/hooks.md` },
  { name: "agents.md", desc: "agent configuration and custom agents", href: `${BLOB}/docs/agents.md` },
  { name: "cost-tracking.md", desc: "understanding and optimizing costs", href: `${BLOB}/docs/cost-tracking.md` },
  { name: "contributing.md", desc: "how to contribute tips and plugins", href: `${BLOB}/docs/contributing.md` },
];

// --- Stats ---

export const stats = {
  sessions: "4,000+",
  messages: "268K",
  toolCalls: "102K",
} as const;
