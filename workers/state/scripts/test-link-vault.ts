/**
 * CLI smoke test for the deployed LinkVault DO. Runs against any URL.
 * Usage: bun run scripts/test-link-vault.ts https://anipotts-state.<acct>.workers.dev
 */

import type { Link, LinkVaultEvent } from "../src/types";

const base = process.argv[2] ?? "http://localhost:8787";
const wsBase = base.replace(/^http/, "ws");

const log = (label: string, value: unknown) =>
  console.log(
    `[${label}] ${typeof value === "string" ? value : JSON.stringify(value)}`,
  );

log("base", base);

// 1. Open WebSocket and listen for events.
const ws = new WebSocket(`${wsBase}/api/links/ws`);
ws.addEventListener("message", (event) => {
  const data = JSON.parse(event.data as string) as LinkVaultEvent;
  log(`ws:${data.type}`, data);
});
await new Promise<void>((resolve) =>
  ws.addEventListener("open", () => resolve()),
);
log("ws", "open");

// 2. POST a test link, expect snapshot + link.added on the WS.
const post = await fetch(`${base}/api/links`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    url: `https://example.com/cli-test-${Date.now()}`,
    title: "CLI smoke test",
    source: "manual",
  }),
});
const { link } = (await post.json()) as { link: Link };
log("post", link);

// 3. GET the list, expect to see the new link.
const list = await fetch(`${base}/api/links`);
const { links } = (await list.json()) as { links: Link[] };
log("list", `${links.length} link(s)`);

// 4. DELETE the link.
await fetch(`${base}/api/links/${encodeURIComponent(link.id)}`, {
  method: "DELETE",
});
log("delete", link.id);

// 5. Wait briefly for the broadcast, then exit.
await new Promise((resolve) => setTimeout(resolve, 500));
ws.close();
log("done", "ok");
process.exit(0);
