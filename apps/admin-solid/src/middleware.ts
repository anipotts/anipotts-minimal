import type { HTTPEvent } from "vinxi/http";
import { getRequestURL, sendRedirect } from "vinxi/http";
import { hasActivePasskeySession } from "./lib/passkey-auth";

async function onRequest(event: HTTPEvent): Promise<void> {
  const url = getRequestURL(event, {
    xForwardedHost: true,
    xForwardedProto: true,
  });

  if (isPublicPath(url.pathname)) return;

  const hasSession = await hasActivePasskeySession(event);
  if (hasSession) return;

  const next = encodeURIComponent(`${url.pathname}${url.search}`);
  await sendRedirect(event, `/auth/passkey?next=${next}`, 302);
}

export default { onRequest };

function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/auth/passkey" ||
    pathname.startsWith("/api/admin/passkey/") ||
    pathname.startsWith("/_build/") ||
    pathname.startsWith("/assets/") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/.well-known/")
  );
}
