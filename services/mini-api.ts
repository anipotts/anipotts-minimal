// services/mini-api.ts
//
// Self-describing manifest for the already-running mini-api service on the
// Mac Mini. This manifest MUST NOT alter the production service — running
// `bun run services/mini-api.ts apply --dry-run` should print planned writes,
// and real apply is deferred to Session 2b after CF Access bootstrap.
//
// Visibility is internal (tailnet + CF Tunnel without Access) because the
// existing mini-api already uses an X-API-Key header at the app layer and
// has a stable hostname in the tunnel UUID 6ad55665-...
//
// preserveExistingPlist=true: the real plist on Mini is
// com.anipotts.cloudflared-mini-api.plist (hand-authored, different label
// than com.anipotts.services.mini-api). This manifest documents the service
// from the platform's POV without claiming to own its LaunchAgent yet.

import { defineService } from "@anipotts/services-platform";

const svc = defineService({
  name: "mini-api",
  hostname: "api.mini.anipotts.com",
  visibility: "internal",
  mini: {
    port: 3456,
    workingDir: "~/Code/active/mini-api",
    command: ["node", "dist/server.js"],
    healthPath: "/health",
    preserveExistingPlist: true,
  },
  owner: "ani",
  description: "Always-on API on Mac Mini. REST + SSE streams for admin UI.",
});

if ((import.meta as { main?: boolean }).main) await svc.runFromArgv();

export default svc;
