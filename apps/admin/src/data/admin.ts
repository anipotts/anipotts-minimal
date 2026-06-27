export type NavItem = {
  href: string;
  label: string;
  status: "live-source" | "migrating" | "gated";
};

export type DashboardCard = {
  title: string;
  status: string;
  risk: "low" | "medium" | "high";
  next: string;
};

export type QueueRow = {
  title: string;
  owner: string;
  status: string;
  evidence: string;
};

export const navItems: NavItem[] = [
  { href: "/", label: "overview", status: "migrating" },
  { href: "/content", label: "content", status: "live-source" },
  { href: "/content/review", label: "review", status: "live-source" },
  { href: "/content/preview", label: "preview", status: "live-source" },
  { href: "/newsletter", label: "newsletter", status: "live-source" },
  { href: "/needs-ani", label: "needs ani", status: "live-source" },
  { href: "/proof", label: "proof", status: "live-source" },
  { href: "/repos", label: "repos", status: "migrating" },
  { href: "/handoffs", label: "handoffs", status: "migrating" },
  { href: "/fleet", label: "fleet", status: "migrating" },
  { href: "/mutations", label: "mutations", status: "gated" },
  { href: "/ops/destructive", label: "destructive ops", status: "gated" },
];

export const overviewCards: DashboardCard[] = [
  {
    title: "admin Astro cutover",
    status: "canonical route cut over",
    risk: "low",
    next: "prove passkey behavior, then remove the legacy Solid rollback",
  },
  {
    title: "passkey auth",
    status: "edge protected",
    risk: "high",
    next: "register first biometric passkey before Access removal",
  },
  {
    title: "content platform",
    status: "read-only inventory",
    risk: "medium",
    next: "move editable fields into D1-backed draft records",
  },
  {
    title: "proof log",
    status: "static route proof",
    risk: "low",
    next: "move deploy and passkey proof into durable records",
  },
  {
    title: "newsletter drafts",
    status: "static preview model",
    risk: "medium",
    next: "review issue structure in admin before any D1 write or send path",
  },
  {
    title: "legacy cleanup",
    status: "started",
    risk: "low",
    next: "archive or remove admin-solid after passkey proof",
  },
];

export const contentRows: QueueRow[] = [
  {
    title: "homepage intro",
    owner: "apps/www",
    status: "structured source candidate",
    evidence: "apps/www/src/data/site.ts",
  },
  {
    title: "projects",
    owner: "apps/www",
    status: "content collection",
    evidence: "apps/www/src/content/projects",
  },
  {
    title: "writing",
    owner: "apps/www",
    status: "content collection",
    evidence: "apps/www/src/content/writing",
  },
  {
    title: "newsletter",
    owner: "apps/www",
    status: "D1 and queue backed",
    evidence: "drizzle/migrations/0005_newsletter_system.sql",
  },
];

export const needsRows: QueueRow[] = [
  {
    title: "passkey registration proof",
    owner: "site/admin",
    status: "needed before Access removal",
    evidence: "D1 admin_passkey_credentials count must be greater than zero",
  },
  {
    title: "Astro admin route parity",
    owner: "site/admin",
    status: "in progress",
    evidence: "docs/platform-architecture.md",
  },
  {
    title: "legacy worker review",
    owner: "site/platform",
    status: "pending classification",
    evidence: "workers/*",
  },
];

export const repoRows: QueueRow[] = [
  {
    title: "anipotts-com",
    owner: "main",
    status: "production-reflective",
    evidence: "agent PRs merge after checks",
  },
  {
    title: "apps/admin",
    owner: "admin.anipotts.com",
    status: "canonical Astro app",
    evidence: "deploy run 28302990801",
  },
  {
    title: "apps/admin-solid",
    owner: "legacy-admin-solid.anipotts.com",
    status: "legacy rollback",
    evidence: "deploy run 28302990801",
  },
];

export const fleetRows: QueueRow[] = [
  {
    title: "ap-pro",
    owner: "Codex / Claude",
    status: "operator workstation",
    evidence: "repo state and browser proof",
  },
  {
    title: "ap-mini",
    owner: "runtime host",
    status: "state plane candidate",
    evidence: "workers/state and Infra runtime feed",
  },
];

export const mutationRows: QueueRow[] = [
  {
    title: "remove Cloudflare Access",
    owner: "admin auth",
    status: "blocked by proof",
    evidence: "no active passkey credential yet",
  },
  {
    title: "publish content edits",
    owner: "content admin",
    status: "future write path",
    evidence: "must be logged, reversible, and proof-backed",
  },
];

export function routeTitle(pathname: string): string {
  const match = navItems.find((item) => item.href === pathname);
  return match?.label ?? "admin";
}
