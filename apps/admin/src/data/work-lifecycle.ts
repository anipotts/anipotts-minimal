import {
  loadWorkLifecycleSnapshot,
  type WorkLifecycleAdapter,
} from "@anipotts/lib/admin-control";

export async function readAdminWorkLifecycle(
  adapter?: WorkLifecycleAdapter | null,
) {
  if (import.meta.env.DEV) {
    const { fixtureWorkLifecycle } =
      await import("@anipotts/lib/admin-control/dev-work-lifecycle-fixtures");
    return loadWorkLifecycleSnapshot(adapter, fixtureWorkLifecycle);
  }
  return loadWorkLifecycleSnapshot(adapter);
}
