import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const ADMIN_PROD_HOST = "admin.anipotts.com";
const PROD_HOST = "anipotts.com";

function isAdminHost(hostname: string): boolean {
  // Strip port for comparison
  const host = hostname.split(":")[0] ?? "";
  return host === ADMIN_PROD_HOST || host === "admin.localhost";
}

function isMainHost(hostname: string): boolean {
  const host = hostname.split(":")[0] ?? "";
  return (
    host === PROD_HOST || host === "www.anipotts.com" || host === "localhost"
  );
}

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;

  // Skip static assets, internal paths, and public files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/ingest") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/brand") ||
    pathname === "/favicon.ico" ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".jpeg") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".webmanifest") ||
    pathname.endsWith(".xml") ||
    pathname.endsWith(".txt")
  ) {
    return NextResponse.next();
  }

  // Admin subdomain: rewrite all paths to /admin/* internally
  if (isAdminHost(hostname)) {
    const url = request.nextUrl.clone();
    url.pathname = `/admin${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // Main domain: redirect /admin/* to admin subdomain
  if (
    isMainHost(hostname) &&
    (pathname === "/admin" || pathname.startsWith("/admin/"))
  ) {
    const adminPath = pathname.replace(/^\/admin/, "") || "/";
    const port = hostname.includes("localhost")
      ? `:${hostname.split(":")[1] ?? "3000"}`
      : "";
    const adminHost = hostname.includes("localhost")
      ? `admin.localhost${port}`
      : ADMIN_PROD_HOST;
    const protocol = hostname.includes("localhost") ? "http" : "https";
    const url = new URL(`${protocol}://${adminHost}${adminPath}`);
    url.search = request.nextUrl.search;
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static assets (needed for admin subdomain detection)
    "/((?!_next/static|_next/image|favicon\\.ico).*)",
  ],
};
