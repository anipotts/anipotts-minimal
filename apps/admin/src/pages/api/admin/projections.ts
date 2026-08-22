import {
  loadAdminControlSnapshot,
  type AdminControlDatabase,
} from "@anipotts/lib/admin-control";

export async function GET({ locals }: { locals: App.Locals }) {
  const snapshot = import.meta.env.DEV
    ? await loadDevelopmentSnapshot(locals.runtime?.env.DB)
    : await loadAdminControlSnapshot(locals.runtime?.env.DB);

  return Response.json(snapshot, {
    headers: {
      "cache-control": "no-store",
    },
  });
}

async function loadDevelopmentSnapshot(db: AdminControlDatabase) {
  const { adminControlFixtureData } =
    await import("@anipotts/lib/admin-control/dev-fixtures");
  return loadAdminControlSnapshot(db, adminControlFixtureData);
}
