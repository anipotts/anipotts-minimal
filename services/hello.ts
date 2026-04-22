// services/hello.ts
//
// Smoke-test manifest for Session 2b end-to-end validation.
// Purpose: exercise the cf-access planner path (visibility: public) without
// provisioning anything real yet. A true end-to-end smoke (CF Access prompt
// → 200 response) requires CF_API_TOKEN, which is gated in Session 2b.
//
// When the token gate opens:
//   1. Ship a minimal HTTP responder on Mini port 8788 that returns "hi".
//   2. `bun run services/hello.ts apply` — registers plist, cloudflared
//      ingress, CF Access policy (email allowlist), and D1 registry row.
//   3. Confirm hello.anipotts.com prompts for Access email, then returns "hi".
//   4. Retire via `bun run services/hello.ts retire` (keeps history).

import { defineService } from "@anipotts/services-platform";

const svc = defineService({
  name: "hello",
  hostname: "hello.anipotts.com",
  visibility: "public",
  mini: {
    port: 8788,
    workingDir: "~/Code/active/services/hello",
    command: ["python3", "-m", "http.server", "8788"],
    healthPath: "/",
  },
  access: { emails: ["hello@anipotts.com"] },
  owner: "ani",
  description: "Trivial static responder. Smoke-test for the platform.",
});

if ((import.meta as { main?: boolean }).main) await svc.runFromArgv();

export default svc;
