export type NavItem = {
  href: string;
  label: string;
  status: string;
  group: "home" | "work" | "content" | "life" | "knowledge" | "system";
  description: string;
  icon:
    | "inbox"
    | "work"
    | "content"
    | "life"
    | "knowledge"
    | "locations"
    | "search"
    | "system"
    | "fleet"
    | "deploy"
    | "repo"
    | "proof"
    | "handoff"
    | "edit"
    | "review"
    | "draft"
    | "media"
    | "newsletter"
    | "health"
    | "aesthetics";
  parent?: string;
  mobile?: boolean;
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
    href: "/",
    label: "inbox",
    status: "queue",
    group: "home",
    description: "what needs attention and what can move next",
    icon: "inbox",
    mobile: true,
  },
  {
    href: "/work?view=now",
    label: "work",
    status: "now",
    group: "work",
    description: "current execution, waiting, proof, and lineage",
    icon: "work",
    mobile: true,
  },
  {
    href: "/work?view=projects",
    label: "projects",
    status: "view",
    group: "work",
    description: "work grouped by project",
    icon: "repo",
    parent: "work",
  },
  {
    href: "/work?view=history",
    label: "history",
    status: "view",
    group: "work",
    description: "recently completed and preserved work",
    icon: "handoff",
    parent: "work",
  },
  {
    href: "/content",
    label: "content",
    status: "D1",
    group: "content",
    description: "pieces, drafts, exports",
    icon: "content",
    mobile: true,
  },
  {
    href: "/content/edit/new",
    label: "new",
    status: "editor",
    group: "content",
    description: "write and publish content",
    icon: "edit",
    parent: "content",
  },
  {
    href: "/content/review",
    label: "review",
    status: "content",
    group: "content",
    description: "proposed copy and review state",
    icon: "review",
    parent: "content",
  },
  {
    href: "/content/carousels",
    label: "carousels",
    status: "media",
    group: "content",
    description: "carousel sets and export review",
    icon: "media",
    parent: "content",
  },
  {
    href: "/content/preview",
    label: "preview",
    status: "content",
    group: "content",
    description: "draft preview surfaces",
    icon: "review",
    parent: "content",
  },
  {
    href: "/content/drafts",
    label: "drafts",
    status: "content",
    group: "content",
    description: "saved draft operations and publish state",
    icon: "draft",
    parent: "content",
  },
  {
    href: "/content/operations",
    label: "history",
    status: "content",
    group: "content",
    description: "draft operation metadata",
    icon: "handoff",
    parent: "content",
  },
  {
    href: "/newsletter",
    label: "newsletter",
    status: "retained",
    group: "content",
    description: "issue preview without sends",
    icon: "newsletter",
    parent: "content",
  },
  {
    href: "/life",
    label: "life",
    status: "status",
    group: "life",
    description: "quiet personal overview",
    icon: "life",
    mobile: true,
  },
  {
    href: "/life/health",
    label: "health",
    status: "status",
    group: "life",
    description: "status-only health visibility",
    icon: "health",
    parent: "life",
  },
  {
    href: "/life/aesthetics",
    label: "aesthetics",
    status: "shell",
    group: "life",
    description: "wardrobe, outfits, looks, and references",
    icon: "aesthetics",
    parent: "life",
  },
  {
    href: "/knowledge",
    label: "knowledge",
    status: "index",
    group: "knowledge",
    description: "current context and source proof",
    icon: "knowledge",
  },
  {
    href: "/knowledge?kind=people",
    label: "people",
    status: "index",
    group: "knowledge",
    description: "people and current relationships",
    icon: "search",
    parent: "knowledge",
  },
  {
    href: "/knowledge/locations",
    label: "locations",
    status: "map",
    group: "knowledge",
    description: "fleet topology and known places",
    icon: "locations",
    parent: "knowledge",
  },
  {
    href: "/system",
    label: "system",
    status: "status",
    group: "system",
    description: "machines, deploys, proof, and governance",
    icon: "system",
  },
  {
    href: "/fleet",
    label: "fleet",
    status: "runtime",
    group: "system",
    description: "machines, repo state, current work",
    icon: "fleet",
    parent: "system",
  },
  {
    href: "/proof",
    label: "proof",
    status: "passkeys",
    group: "system",
    description: "auth, proof, and blocked checks",
    icon: "proof",
    parent: "system",
  },
  {
    href: "/deploys",
    label: "deploys",
    status: "scoped",
    group: "system",
    description: "target map and deploy proof",
    icon: "deploy",
    parent: "system",
  },
  {
    href: "/repos",
    label: "repositories",
    status: "details",
    group: "system",
    description: "dirty state and branch drift",
    icon: "repo",
    parent: "system",
  },
  {
    href: "/handoffs",
    label: "handoffs",
    status: "details",
    group: "system",
    description: "handoff freshness and absorption",
    icon: "handoff",
    parent: "system",
  },
  {
    href: "/mutations",
    label: "mutations",
    status: "gated",
    group: "system",
    description: "proposed, approved, running, verified",
    icon: "review",
    parent: "system",
  },
  {
    href: "/ops/destructive",
    label: "gates",
    status: "gated",
    group: "system",
    description: "delete, dns, auth, deploy, secrets",
    icon: "proof",
    parent: "system",
  },
];

export const overviewCards: DashboardCard[] = [
  {
    title: "passkey proof",
    status: "two credentials registered, one active session",
    risk: "high",
    next: "record revoked-credential and denied-auth proof before Access removal",
    href: "/auth/passkey",
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
    status: "runtime host",
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
