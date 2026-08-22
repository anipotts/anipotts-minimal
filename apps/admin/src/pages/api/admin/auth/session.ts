import type { APIRoute } from "astro";
import { adminJson, sessionCsrfToken } from "../../../../lib/admin-auth";

export const GET: APIRoute = async (context) => {
  const principal = context.locals.adminPrincipal;
  if (!principal) {
    return adminJson({ authenticated: false }, { status: 401 });
  }
  return adminJson({
    authenticated: true,
    principal,
    csrf_token: await sessionCsrfToken(context),
  });
};
