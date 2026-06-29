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

export type DeployRow = {
  target: string;
  input: string;
  scope: string;
  status: "automatic safe lane" | "manual rollback" | "retained worker";
  proof: string;
  next: string;
};

export const navItems: NavItem[] = [
  { href: "/", label: "overview", status: "migrating" },
  { href: "/content", label: "content", status: "live-source" },
  { href: "/content/review", label: "review", status: "live-source" },
  { href: "/content/drafts", label: "drafts", status: "live-source" },
  { href: "/content/preview", label: "preview", status: "live-source" },
  { href: "/content/operations", label: "operations", status: "live-source" },
  { href: "/newsletter", label: "newsletter", status: "live-source" },
  { href: "/needs-ani", label: "needs ani", status: "live-source" },
  { href: "/proof", label: "proof", status: "live-source" },
  { href: "/deploys", label: "deploys", status: "live-source" },
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
    status: "draft save staged",
    risk: "medium",
    next: "enroll passkey and prove draft operation saves before publish design",
  },
  {
    title: "proof log",
    status: "durable D1 proof",
    risk: "low",
    next: "keep deploy target proof current after each admin or public deploy",
  },
  {
    title: "deploy scopes",
    status: "read-only target map",
    risk: "low",
    next: "use /deploys to confirm skipped targets after each scoped deploy",
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

export const deployRows: DeployRow[] = [
  {
    target: "public site",
    input: "www=true",
    scope: "apps/www and proven public consumers",
    status: "automatic safe lane",
    proof: "public routes return 200 after scoped deploy",
    next: "keep public content/layout changes isolated from admin code",
  },
  {
    target: "Astro admin",
    input: "admin=true",
    scope: "apps/admin and proven admin consumers",
    status: "automatic safe lane",
    proof: "admin routes return Cloudflare Access 302 until passkey removal",
    next: "enroll passkey, then prove app-native blocking before Access removal",
  },
  {
    target: "admin-solid rollback",
    input: "admin_solid=true",
    scope: "apps/admin-solid only",
    status: "manual rollback",
    proof: "Deploy admin-solid is skipped unless explicitly requested",
    next: "archive or remove after passkey proof and Astro admin rollback window closes",
  },
  {
    target: "state worker",
    input: "state=true",
    scope: "workers/state only",
    status: "retained worker",
    proof: "state deploy job is skipped unless the target is selected",
    next: "keep write routes behind STATE_PUBLISH_KEY and route-level proof",
  },
  {
    target: "ingest worker",
    input: "ingest=true",
    scope: "workers/ingest only",
    status: "retained worker",
    proof: "ingest deploy job is skipped unless the target is selected",
    next: "do not expand receivers without source-specific proof",
  },
  {
    target: "newsletter worker",
    input: "newsletter=true",
    scope: "workers/newsletter only",
    status: "retained worker",
    proof: "newsletter deploy job is skipped unless the target is selected",
    next: "keep sends gated until newsletter publishing proof exists",
  },
  {
    target: "weekly email worker",
    input: "weekly_email=true",
    scope: "workers/weekly-email only",
    status: "retained worker",
    proof: "weekly email deploy job is skipped unless the target is selected",
    next: "fold or retire after newsletter/content system owns the summary path",
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
