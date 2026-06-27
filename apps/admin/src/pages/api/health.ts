import type { APIRoute } from "astro";

export const GET: APIRoute = () =>
  Response.json({
    ok: true,
    app: "admin-astro",
    target: "admin.anipotts.com",
  });
