#!/usr/bin/env node

import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

const inventory = [
  { route: "/", file: "apps/www/src/pages/index.astro" },
  { route: "/newsletter", file: "apps/www/src/pages/newsletter.astro" },
  {
    route: "/newsletter/archive",
    file: "apps/www/src/pages/newsletter/archive.astro",
  },
  { route: "/making", file: "apps/www/src/pages/making.astro" },
  { route: "/orchestrating", file: "apps/www/src/pages/orchestrating.astro" },
  { route: "/projects", file: "apps/www/src/pages/projects/index.astro" },
  {
    route: "/projects/chainedchat",
    file: "apps/www/src/pages/projects/[slug].astro",
  },
  {
    route: "/projects/claude-code-tips",
    file: "apps/www/src/pages/projects/[slug].astro",
  },
  {
    route: "/projects/imessage-mcp",
    file: "apps/www/src/pages/projects/[slug].astro",
  },
  {
    route: "/projects/nyu-purity-test",
    file: "apps/www/src/pages/projects/[slug].astro",
  },
  {
    route: "/projects/options-pricing-sensitivity",
    file: "apps/www/src/pages/projects/[slug].astro",
  },
  {
    route: "/projects/pgi-research-platform",
    file: "apps/www/src/pages/projects/[slug].astro",
  },
  {
    route: "/projects/quantercise",
    file: "apps/www/src/pages/projects/[slug].astro",
  },
  {
    route: "/projects/quantercise-extension",
    file: "apps/www/src/pages/projects/[slug].astro",
  },
  {
    route: "/projects/saeshify",
    file: "apps/www/src/pages/projects/[slug].astro",
  },
  { route: "/writing", file: "apps/www/src/pages/writing/index.astro" },
  {
    route: "/writing/i-built-a-monitor-for-my-claude-code-sessions",
    file: "apps/www/src/pages/writing/[slug].astro",
  },
  {
    route: "/writing/saturdays-are-for-claude-code",
    file: "apps/www/src/pages/writing/[slug].astro",
  },
  {
    route: "/writing/search-will-be-dead-by-2030",
    file: "apps/www/src/pages/writing/[slug].astro",
  },
  {
    route: "/writing/stop-ending-your-day-with-fix-the-bug",
    file: "apps/www/src/pages/writing/[slug].astro",
  },
];

const SAFE_ROUTE_SEGMENT = /^[A-Za-z0-9._-]+$/;
const SAFE_FILE_SEGMENT = /^[A-Za-z0-9._[\]-]+$/;

export function validatePublicRouteInventory(records) {
  if (!Array.isArray(records)) {
    throw new TypeError("public route inventory must be an array");
  }
  if (records.length === 0) {
    throw new TypeError("public route inventory must not be empty");
  }

  const routes = new Set();
  for (const [index, record] of records.entries()) {
    if (!record || typeof record !== "object" || Array.isArray(record)) {
      throw new TypeError(`public route record ${index} must be an object`);
    }
    if (
      Object.keys(record).length !== 2 ||
      !Object.hasOwn(record, "route") ||
      !Object.hasOwn(record, "file")
    ) {
      throw new TypeError(`public route record ${index} has an invalid shape`);
    }
    if (!isCanonicalRoute(record.route)) {
      throw new TypeError(`public route record ${index} has an unsafe route`);
    }
    if (!isSafePageFile(record.file)) {
      throw new TypeError(`public route record ${index} has an invalid file`);
    }
    if (routes.has(record.route)) {
      throw new TypeError(`duplicate public route ${record.route}`);
    }
    routes.add(record.route);
  }
}

function isCanonicalRoute(route) {
  if (route === "/") return true;
  if (typeof route !== "string" || !route.startsWith("/")) return false;
  if (route.startsWith("//") || route.endsWith("/")) return false;
  return route
    .slice(1)
    .split("/")
    .every(
      (segment) =>
        segment !== "" &&
        segment !== "." &&
        segment !== ".." &&
        SAFE_ROUTE_SEGMENT.test(segment),
    );
}

function isSafePageFile(file) {
  if (
    typeof file !== "string" ||
    !file.startsWith("apps/www/src/pages/") ||
    !file.endsWith(".astro") ||
    file.endsWith("/")
  ) {
    return false;
  }
  return file
    .split("/")
    .every(
      (segment) =>
        segment !== "" &&
        segment !== "." &&
        segment !== ".." &&
        SAFE_FILE_SEGMENT.test(segment),
    );
}

validatePublicRouteInventory(inventory);

export const PUBLIC_ROUTE_INVENTORY = Object.freeze(
  inventory.map((record) => Object.freeze(record)),
);
export const PUBLIC_SMOKE_ROUTES = Object.freeze(
  PUBLIC_ROUTE_INVENTORY.map((record) => record.route),
);

if (isDirectExecution()) {
  process.stdout.write(`${PUBLIC_SMOKE_ROUTES.join("\n")}\n`);
}

function isDirectExecution() {
  if (!process.argv[1]) return false;
  try {
    return (
      realpathSync(process.argv[1]) ===
      realpathSync(fileURLToPath(import.meta.url))
    );
  } catch {
    return false;
  }
}
