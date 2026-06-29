export const ADMIN_ROUTES = [
  { route: "/", file: "apps/admin/src/pages/index.astro", nav: true },
  {
    route: "/auth/passkey",
    file: "apps/admin/src/pages/auth/passkey.astro",
    nav: false,
  },
  {
    route: "/content",
    file: "apps/admin/src/pages/content/index.astro",
    nav: true,
  },
  {
    route: "/content/review",
    file: "apps/admin/src/pages/content/review.astro",
    nav: true,
  },
  {
    route: "/content/drafts",
    file: "apps/admin/src/pages/content/drafts.astro",
    nav: true,
  },
  {
    route: "/content/edit/home",
    file: "apps/admin/src/pages/content/edit/[pageKey].astro",
    nav: false,
  },
  {
    route: "/content/preview",
    file: "apps/admin/src/pages/content/preview.astro",
    nav: true,
  },
  {
    route: "/content/operations",
    file: "apps/admin/src/pages/content/operations.astro",
    nav: true,
  },
  {
    route: "/newsletter",
    file: "apps/admin/src/pages/newsletter.astro",
    nav: true,
  },
  {
    route: "/newsletter/first-thing-agents-need-control-plane",
    file: "apps/admin/src/pages/newsletter/[slug].astro",
    nav: false,
  },
  {
    route: "/needs-ani",
    file: "apps/admin/src/pages/needs-ani.astro",
    nav: true,
  },
  { route: "/proof", file: "apps/admin/src/pages/proof.astro", nav: true },
  { route: "/deploys", file: "apps/admin/src/pages/deploys.astro", nav: true },
  { route: "/repos", file: "apps/admin/src/pages/repos.astro", nav: true },
  {
    route: "/handoffs",
    file: "apps/admin/src/pages/handoffs.astro",
    nav: true,
  },
  { route: "/fleet", file: "apps/admin/src/pages/fleet.astro", nav: true },
  {
    route: "/mutations",
    file: "apps/admin/src/pages/mutations.astro",
    nav: true,
  },
  {
    route: "/ops/destructive",
    file: "apps/admin/src/pages/ops/destructive.astro",
    nav: true,
  },
  {
    route: "/api/admin/runtime-feed",
    file: "apps/admin/src/pages/api/admin/runtime-feed.ts",
    nav: false,
    smoke: false,
  },
  {
    route: "/api/admin/content/draft-operation",
    file: "apps/admin/src/pages/api/admin/content/draft-operation.ts",
    nav: false,
  },
];

export const PUBLIC_UNSMOKED_ROUTE_FILES = [
  "apps/admin/src/pages/api/health.ts",
  "apps/admin/src/pages/api/admin/passkey/login-options.ts",
  "apps/admin/src/pages/api/admin/passkey/login-verify.ts",
  "apps/admin/src/pages/api/admin/passkey/logout.ts",
  "apps/admin/src/pages/api/admin/passkey/register-options.ts",
  "apps/admin/src/pages/api/admin/passkey/register-verify.ts",
  "apps/admin/src/pages/api/admin/passkey/revoke-current.ts",
  "apps/admin/src/pages/api/admin/passkey/status.ts",
];

export const ADMIN_PROTECTED_SMOKE_ROUTES = ADMIN_ROUTES.filter(
  (route) => route.smoke !== false,
).map((route) => route.route);
