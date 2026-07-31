import type { APIRoute } from "astro";
import { sanitizeAdminReturnPath } from "../../lib/admin-auth";

export const GET: APIRoute = (context) => {
  const nextPath = sanitizeAdminReturnPath(
    context.url.searchParams.get("next"),
  );
  return context.redirect(`/auth?next=${encodeURIComponent(nextPath)}`, 308);
};
