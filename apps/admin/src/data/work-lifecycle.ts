import {
  fixtureWorkLifecycle,
  loadWorkLifecycleSnapshot,
  type WorkLifecycleAdapter,
} from "@anipotts/lib/admin-control";

export async function readAdminWorkLifecycle(
  adapter?: WorkLifecycleAdapter | null,
) {
  return loadWorkLifecycleSnapshot(adapter, fixtureWorkLifecycle);
}
