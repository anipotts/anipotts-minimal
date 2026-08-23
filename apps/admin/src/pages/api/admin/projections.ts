import { loadAdminControlSnapshot } from "@anipotts/lib/admin-control";

export async function GET({ locals }: { locals: App.Locals }) {
  const snapshot = import.meta.env.DEV
    ? await loadDevelopmentSnapshot()
    : await loadAdminControlSnapshot(locals.runtime?.env.DB);

  return Response.json(snapshot, {
    headers: {
      "cache-control": "no-store",
    },
  });
}

async function loadDevelopmentSnapshot() {
  const { adminControlFixtureData } =
    await import("@anipotts/lib/admin-control/dev-fixtures");
  return loadAdminControlSnapshot(null, adminControlFixtureData);
}
