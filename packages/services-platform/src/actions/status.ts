import type { ServiceManifestInput } from "../types";

export async function status(m: ServiceManifestInput): Promise<{
  name: string;
  hostname: string;
  message: string;
}> {
  // Deferred to Session 2b: reads latest status_checks row for this service_id
  // once a D1 handle is bound. Session 2a returns a stub.
  return {
    name: m.name,
    hostname: m.hostname,
    message: "status query deferred to Session 2b (needs D1 binding)",
  };
}
