import type { ServiceManifestInput, PlannedWrite } from "../types";

// Emit a CF Access application + policy JSON. Session 2a is planning-only:
// this returns the payload a future apply step would POST to
// /accounts/:id/access/apps. Actual API call is wired in Session 2b.

interface CfAccessPlan {
  app: {
    name: string;
    domain: string;
    session_duration: string;
    type: "self_hosted";
  };
  policies: Array<{
    name: string;
    decision: "allow";
    include: Array<{ email: { email: string } }>;
  }>;
}

function renderCfAccess(m: ServiceManifestInput): CfAccessPlan | null {
  if (m.visibility !== "public") return null;
  const emails = m.access?.emails ?? [];
  return {
    app: {
      name: m.name,
      domain: m.hostname,
      session_duration: "24h",
      type: "self_hosted",
    },
    policies: [
      {
        name: `${m.name}-default-allow`,
        decision: "allow",
        include: emails.map((email) => ({ email: { email } })),
      },
    ],
  };
}

export async function planCfAccess(
  m: ServiceManifestInput,
): Promise<PlannedWrite> {
  const payload = renderCfAccess(m);
  if (payload === null) {
    return {
      kind: "cf-access",
      changed: false,
      summary: `skip (visibility=internal, no Access policy)`,
    };
  }
  const emailCount = payload.policies[0]?.include.length ?? 0;
  return {
    kind: "cf-access",
    changed: true,
    summary: `would create Access app for ${m.hostname} (emails=${emailCount})`,
    body: JSON.stringify(payload, null, 2),
  };
}
