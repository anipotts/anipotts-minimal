import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Bindings } from "./types";

export { LinkVault } from "./do/link-vault";

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", async (c, next) => {
  const allowedOrigins = (c.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim());
  return cors({
    origin: (origin) => (allowedOrigins.includes(origin) ? origin : null),
    allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })(c, next);
});

app.get("/", (c) =>
  c.json({
    service: "anipotts-state",
    durableObjects: ["LinkVault"],
    endpoints: {
      list: "GET /api/links",
      add: "POST /api/links",
      remove: "DELETE /api/links/:id",
      subscribe: "GET /api/links/ws (websocket upgrade)",
    },
  }),
);

app.get("/health", (c) => c.json({ ok: true, ts: new Date().toISOString() }));

function linkVaultStub(env: Bindings): DurableObjectStub {
  const id = env.LINK_VAULT.idFromName("default");
  return env.LINK_VAULT.get(id);
}

app.get("/api/links", async (c) => {
  const stub = linkVaultStub(c.env);
  const res = await stub.fetch("https://internal/links");
  return new Response(res.body, res);
});

app.post("/api/links", async (c) => {
  const body = await c.req.json();
  const stub = linkVaultStub(c.env);
  const res = await stub.fetch("https://internal/links", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return new Response(res.body, res);
});

app.delete("/api/links/:id", async (c) => {
  const id = c.req.param("id");
  const stub = linkVaultStub(c.env);
  const res = await stub.fetch(
    `https://internal/links/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    },
  );
  return new Response(res.body, res);
});

app.get("/api/links/ws", async (c) => {
  if (c.req.header("upgrade")?.toLowerCase() !== "websocket") {
    return c.text("expected websocket upgrade", 426);
  }
  const stub = linkVaultStub(c.env);
  return stub.fetch(c.req.raw);
});

export default app;
