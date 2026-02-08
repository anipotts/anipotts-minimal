import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Subdomain → final destination mapping.
 * Public users get 301 redirected; admin users get rewritten.
 */
const SUBDOMAIN_ROUTES: Record<string, string> = {
  thoughts: '/thoughts',
  dev: '/dev',
  // Consolidated subdomains redirect to their new homes
  links: '/connect',
  updates: '/dev?section=activity',
  metrics: '/dev?section=metrics',
  status: '/dev?section=status',
  lab: '/work',
  docs: '/',
};

/**
 * Admin-scoped subdomain names (subdomains that support admin rewrite).
 * Only these get rewrite behavior; others always redirect.
 */
const ADMIN_SUBDOMAINS = new Set(['thoughts', 'dev']);

/**
 * Extract subdomain from the request.
 * - Production: thoughts.anipotts.com → "thoughts"
 * - Development: localhost:3000?_subdomain=thoughts → "thoughts"
 */
function getSubdomain(request: NextRequest): string | null {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl;

  if (hostname.includes('.anipotts.com')) {
    const parts = hostname.split('.');
    if (parts.length === 3 && parts[0] !== 'www') {
      return parts[0];
    }
    return null;
  }

  if (hostname.includes('.vercel.app') || hostname.includes('.vercel.sh')) {
    return url.searchParams.get('_subdomain');
  }

  if (process.env.NODE_ENV === 'development' || hostname.includes('localhost')) {
    return url.searchParams.get('_subdomain');
  }

  return null;
}

export function proxy(request: NextRequest) {
  const subdomain = getSubdomain(request);

  if (!subdomain || !SUBDOMAIN_ROUTES[subdomain]) {
    return NextResponse.next();
  }

  const targetPath = SUBDOMAIN_ROUTES[subdomain];
  const adminCookie = request.cookies.get('admin_session');

  // Admin rewrite only for subdomains that still have dedicated pages
  if (adminCookie && ADMIN_SUBDOMAINS.has(subdomain)) {
    const url = request.nextUrl.clone();
    if (!url.pathname.startsWith(targetPath)) {
      url.pathname = url.pathname === '/'
        ? targetPath
        : `${targetPath}${url.pathname}`;
    }
    url.searchParams.delete('_subdomain');

    const response = NextResponse.rewrite(url);
    response.headers.set('x-admin-scope', subdomain);
    response.headers.set('x-admin-autoopen', 'true');
    return response;
  }

  // Public user (or admin on consolidated subdomain) → 301 redirect
  const baseUrl = request.nextUrl.origin.includes('localhost')
    ? request.nextUrl.origin
    : 'https://anipotts.com';

  const redirectPath = request.nextUrl.pathname === '/'
    ? targetPath
    : `${targetPath}${request.nextUrl.pathname}`;

  const redirectUrl = new URL(redirectPath, baseUrl);
  // Preserve existing search params (targetPath may include ?section=)
  if (targetPath.includes('?')) {
    const targetUrl = new URL(targetPath, baseUrl);
    targetUrl.searchParams.forEach((value, key) => {
      redirectUrl.searchParams.set(key, value);
    });
  }
  // Copy original search params (except _subdomain)
  request.nextUrl.searchParams.forEach((value, key) => {
    if (key !== '_subdomain') {
      redirectUrl.searchParams.set(key, value);
    }
  });
  redirectUrl.searchParams.delete('_subdomain');
  return NextResponse.redirect(redirectUrl, 301);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|xml|txt|json|webmanifest)$).*)',
  ],
};
