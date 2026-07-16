export type NavItem = {
  href: string;
  label: string;
  status: string;
  group: "standalone" | "career" | "content" | "life" | "fleet" | "system";
  primary?: boolean;
  parent?: boolean;
  description: string;
};

export type DashboardCard = {
  title: string;
  status: string;
  risk: "low" | "medium" | "high";
  next: string;
  href: string;
  action: string;
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
  {
    href: "/inbox",
    label: "inbox",
    status: "queue",
    group: "standalone",
    primary: true,
    description: "what needs attention and what can move next",
  },
  {
    href: "/career",
    label: "career",
    status: "current",
    group: "career",
    primary: true,
    parent: true,
    description: "job search and career state",
  },
  {
    href: "/career/job-search",
    label: "job search",
    status: "sources",
    group: "career",
    description: "targets, commitments, source freshness, and task lineage",
  },
  {
    href: "/content",
    label: "content",
    status: "D1",
    group: "content",
    primary: true,
    parent: true,
    description: "pieces, drafts, exports",
  },
  {
    href: "/life",
    label: "life",
    status: "status",
    group: "life",
    primary: true,
    parent: true,
    description: "health and personal references",
  },
  {
    href: "/fleet",
    label: "fleet",
    status: "runtime",
    group: "fleet",
    primary: true,
    parent: true,
    description: "machines, repo state, current work",
  },
  {
    href: "/system",
    label: "system",
    status: "read only",
    group: "system",
    primary: true,
    parent: true,
    description: "proof, deploys, repos, handoffs, and gates",
  },
  {
    href: "/system/security",
    label: "security",
    status: "native auth",
    group: "system",
    description: "password, passkeys, sessions, machine tokens, and audit",
  },
  {
    href: "/content/edit/new",
    label: "writing editor",
    status: "editor",
    group: "content",
    description: "write and publish content",
  },
  {
    href: "/content/review",
    label: "review queue",
    status: "content",
    group: "content",
    description: "proposed copy and review state",
  },
  {
    href: "/content/carousels",
    label: "carousels",
    status: "media",
    group: "content",
    description: "carousel sets and export review",
  },
  {
    href: "/content/preview",
    label: "preview",
    status: "content",
    group: "content",
    description: "draft preview surfaces",
  },
  {
    href: "/content/drafts",
    label: "drafts",
    status: "content",
    group: "content",
    description: "saved draft operations and publish state",
  },
  {
    href: "/content/operations",
    label: "operations",
    status: "content",
    group: "content",
    description: "draft operation metadata",
  },
  {
    href: "/newsletter",
    label: "newsletter",
    status: "retained",
    group: "content",
    description: "issue preview without sends",
  },
  {
    href: "/life/health",
    label: "health",
    status: "status only",
    group: "life",
    description: "health status",
  },
  {
    href: "/life/aesthetics",
    label: "aesthetics",
    status: "empty",
    group: "life",
    description: "wardrobe, outfits, looks, references, and personal style",
  },
  {
    href: "/proof",
    label: "proof and auth",
    status: "passkeys",
    group: "system",
    description: "auth, proof, and blocked checks",
  },
  {
    href: "/deploys",
    label: "deploys",
    status: "scoped",
    group: "system",
    description: "target map and deploy proof",
  },
  {
    href: "/repos",
    label: "repos",
    status: "details",
    group: "system",
    description: "dirty state and branch drift",
  },
  {
    href: "/handoffs",
    label: "handoffs",
    status: "details",
    group: "system",
    description: "handoff freshness and absorption",
  },
  {
    href: "/mutations",
    label: "mutations",
    status: "gated",
    group: "system",
    description: "proposed, approved, running, verified",
  },
  {
    href: "/ops/destructive",
    label: "destructive ops",
    status: "gated",
    group: "system",
    description: "delete, dns, auth, deploy, secrets",
  },
];

export const overviewCards: DashboardCard[] = [
  {
    title: "passkey proof",
    status: "two credentials registered, one active session",
    risk: "high",
    next: "record revoked-credential and denied-auth proof before Access removal",
    href: "/system/security",
    action: "open auth proof",
  },
  {
    title: "writing editor",
    status: "D1 draft save and selected-draft publish are live",
    risk: "medium",
    next: "use the Astryx editor for save, preview, publish, and history",
    href: "/content/edit/new",
    action: "open editor",
  },
  {
    title: "content inventory",
    status: "D1 page_content rows are visible with source fallback",
    risk: "low",
    next: "keep public content readable while editor writes are proven separately",
    href: "/content",
    action: "open content",
  },
  {
    title: "fleet status",
    status: "runtime and repo state are readable from the operator dashboard",
    risk: "low",
    next: "make machine drift, stale work, and current owner clearer",
    href: "/fleet",
    action: "open fleet",
  },
  {
    title: "deploy proof",
    status: "admin and public deploy targets are separated",
    risk: "low",
    next: "after each merge, prove only the intended target ran",
    href: "/deploys",
    action: "check deploys",
  },
  {
    title: "advanced ops",
    status: "handoffs, mutations, and destructive ops are demoted",
    risk: "medium",
    next: "keep visible for audit without making them the first screen",
    href: "/mutations",
    action: "open gates",
  },
];

export const contentRows: QueueRow[] = [
  {
    title: "homepage intro",
    owner: "apps/www",
    status: "published D1 page_content with source fallback",
    evidence: "D1 page_content:home and @anipotts/content/public",
  },
  {
    title: "projects",
    owner: "apps/www",
    status: "published D1 detail rows with source fallback",
    evidence: "D1 page_content:project:* and apps/www/src/content/projects",
  },
  {
    title: "writing",
    owner: "apps/www",
    status: "published D1 detail rows with source fallback",
    evidence: "D1 page_content:writing:* and apps/www/src/content/writing",
  },
  {
    title: "newsletter",
    owner: "apps/www",
    status: "D1 page content, subscribe surface, and retained send worker",
    evidence: "D1 page_content:newsletter and workers/newsletter",
  },
];

export const handoffRows: QueueRow[] = [
  {
    title: "passkey registration proof",
    owner: "site/admin",
    status: "needed before Access removal",
    evidence: "D1 admin_passkey_credentials count must be greater than zero",
  },
  {
    title: "Astro admin route parity",
    owner: "site/admin",
    status: "covered by route parity guard",
    evidence: "scripts/ci/admin-route-inventory.mjs",
  },
  {
    title: "legacy worker review",
    owner: "site/platform",
    status: "retained after 2026-06-29 review",
    evidence: "docs/worker-inventory.md",
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
    evidence: "apps/admin and docs/platform-architecture.md",
  },
  {
    title: "apps/admin-solid",
    owner: "legacy-admin-solid.anipotts.com",
    status: "legacy rollback",
    evidence: "manual-only deploy input until passkey proof",
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
    status: "selected-draft publish with proof",
    evidence: "content_publish_events and page_content version history",
  },
];

export function routeTitle(pathname: string): string {
  if (pathname.startsWith("/content/edit/")) return "writing editor";

  const match =
    navItems.find((item) => item.href === pathname) ??
    [...navItems]
      .sort((a, b) => b.href.length - a.href.length)
      .find(
        (item) => item.href !== "/" && pathname.startsWith(`${item.href}/`),
      );
  return match?.label ?? "admin";
}
