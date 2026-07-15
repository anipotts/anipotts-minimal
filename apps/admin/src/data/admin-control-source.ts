import type { AdminControlDatabase } from "@anipotts/lib/admin-control";

export function selectAdminControlSource(
  db: AdminControlDatabase,
  url: URL,
): { database: AdminControlDatabase; fixtureMode: boolean } {
  const fixtureMode =
    import.meta.env.DEV && url.searchParams.get("source") === "fixture";

  return {
    database: fixtureMode ? undefined : db,
    fixtureMode,
  };
}

export function adminControlHref(path: string, fixtureMode: boolean): string {
  return fixtureMode ? `${path}?source=fixture` : path;
}
