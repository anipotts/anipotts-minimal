import { defineMiddleware } from "astro:middleware";
import {
  isDevLoopbackPreviewRequest,
  isPublicAdminPath,
} from "./lib/admin-access-policy";
import {
  adminJson,
  applyAdminSetCookies,
  resolveAdminSession,
  sanitizeAdminReturnPath,
} from "./lib/admin-auth";

export const onRequest = defineMiddleware(async (context, next) => {
  if (
    isDevLoopbackPreviewRequest({
      isDev: import.meta.env.DEV,
      method: context.request.method,
      url: context.url,
    })
  ) {
    return next();
  }

  const resolved = await resolveAdminSession(context);
  context.locals.adminPrincipal = resolved.principal ?? undefined;
  context.locals.adminSetCookies = resolved.setCookies;

  if (isPublicAdminPath(context.url.pathname)) {
    if (
      context.url.pathname === "/auth" &&
      resolved.principal &&
      !resolved.principal.restriction &&
      context.url.searchParams.get("stepup") !== "1"
    ) {
      const destination = sanitizeAdminReturnPath(
        context.url.searchParams.get("next"),
      );
      return applyAdminSetCookies(
        context.redirect(destination, 302),
        resolved.setCookies,
      );
    }
    return applyAdminSetCookies(await next(), resolved.setCookies);
  }

  const isRecoveryRoute =
    context.url.pathname === "/auth/recover/passkey" ||
    context.url.pathname.startsWith("/api/admin/recovery/passkey/");
  if (
    resolved.principal &&
    (resolved.principal.restriction === null ||
      (isRecoveryRoute && resolved.principal.restriction === "recovery"))
  ) {
    return applyAdminSetCookies(await next(), resolved.setCookies);
  }

  if (context.url.pathname.startsWith("/api/")) {
    return applyAdminSetCookies(
      adminJson({ error: "admin_session_required" }, { status: 401 }),
      resolved.setCookies,
    );
  }

  const nextPath = encodeURIComponent(
    `${context.url.pathname}${context.url.search}`,
  );
  return applyAdminSetCookies(
    context.redirect(`/auth?next=${nextPath}`, 302),
    resolved.setCookies,
  );
});
