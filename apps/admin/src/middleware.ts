import { defineMiddleware } from "astro:middleware";
import {
  decideAdminAccess,
  isDevLoopbackPreviewRequest,
  isPublicAdminPath,
} from "./lib/admin-access-policy";
import { hasActivePasskeySession } from "./lib/passkey-auth";

export const onRequest = defineMiddleware(async (context, next) => {
  if (isPublicAdminPath(context.url.pathname)) return next();
  if (
    isDevLoopbackPreviewRequest({
      isDev: import.meta.env.DEV,
      method: context.request.method,
      url: context.url,
    })
  ) {
    return next();
  }

  const hasSession = await hasActivePasskeySession(context);
  const decision = decideAdminAccess({
    isDev: import.meta.env.DEV,
    method: context.request.method,
    url: context.url,
    hasSession,
  });
  if (decision !== "passkey-required") return next();

  const nextPath = encodeURIComponent(
    `${context.url.pathname}${context.url.search}`,
  );
  return context.redirect(`/auth/passkey?next=${nextPath}`, 302);
});
