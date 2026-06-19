const SECTION_TO_ROUTE: Record<string, string> = {
  www: "/",
  work: "/work",
  thoughts: "/thoughts",
  claude: "/claude",
};

const ROUTE_TO_SECTION: Record<string, string> = Object.fromEntries(
  Object.entries(SECTION_TO_ROUTE).map(([k, v]) => [v, k]),
);

export function getSectionFromPath(pathname: string): string {
  for (const [route, section] of Object.entries(ROUTE_TO_SECTION)) {
    if (route !== "/" && pathname.startsWith(route)) {
      return section;
    }
  }
  return "www";
}

export function getSectionPath(pathname: string): string {
  const section = getSectionFromPath(pathname);
  const basePath = SECTION_TO_ROUTE[section];

  if (basePath === "/") {
    return pathname;
  }

  const subPath = basePath ? pathname.slice(basePath.length) : pathname;
  return subPath || "/";
}

export function getInternalPath(section: string, path: string = "/"): string {
  const basePath: string | undefined = SECTION_TO_ROUTE[section];

  if (!basePath) {
    console.warn(`Unknown section: ${section}`);
    return path;
  }

  if (basePath === "/") {
    return path;
  }

  return path === "/" ? basePath : `${basePath}${path}`;
}
