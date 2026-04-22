import type { ServiceManifestInput } from "../types";

export async function retire(m: ServiceManifestInput): Promise<void> {
  // Deferred to Session 2b: requires a bound D1 handle to set retired_at.
  // Intentionally a no-op at the CLI level for Session 2a.
  void m;
}
