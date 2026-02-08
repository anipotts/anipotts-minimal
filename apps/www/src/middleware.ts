import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Section → internal route mapping.
 * Used for admin subdomain rewrites only.
 */
const SUBDOMAIN_ROUTES: Record<string, string> = {
  thoughts: '/thoughts',
  dev: '/dev',
  links: '/links',
  updates: '/updates',
  metrics: '/metrics',
  status: '/status',
  lab: '/lab',
  docs: '/docs',
};

/**
 * Extract subdomain from the request.
 * - Production: thoughts.anipotts.com → "thoughts"
 * - Development: localhost:3000?_subdomain=thoughts → "thoughts"
 */
function getSubdomain(request: NextRequest): string | null {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl;

  // Production: Extract from hostname
  // thoughts.anipotts.com → thoughts
  // www.anipotts.com → null (main site)
  // anipotts.com → null (main site)
  if (hostname.includes('.anipotts.com')) {
    const parts = hostname.split('.');
    // Only 3 parts means subdomain.anipotts.com
    if (parts.length === 3 && parts[0] !== 'www') {
      return parts[0];
    }
    return null;
  }

  // Preview deployments on Vercel: *.vercel.app
  if (hostname.includes('.vercel.app') || hostname.includes('.vercel.sh')) {
    return url.searchParams.get('_subdomain');
  }

  // Development: Use query param for testing
  // localhost:3000?_subdomain=thoughts
  if (process.env.NODE_ENV === 'development' || hostname.includes('localhost')) {
    return url.searchParams.get('_subdomain');
  }

  return null;
}

export function middleware(request: NextRequest) {
  const subdomain = getSubdomain(request);

  // No subdomain detected: root domain request, pass through
  if (!subdomain || !SUBDOMAIN_ROUTES[subdomain]) {
    return NextResponse.next();
  }

  const targetPath = SUBDOMAIN_ROUTES[subdomain];
  const adminCookie = request.cookies.get('admin_session');

  if (!adminCookie) {
    // Public user on subdomain → 301 redirect to root domain path
    const redirectPath = request.nextUrl.pathname === '/'
      ? targetPath
      : `${targetPath}${request.nextUrl.pathname}`;

    // Use the request's origin in dev, production domain in prod
    const baseUrl = request.nextUrl.origin.includes('localhost')
      ? request.nextUrl.origin
      : 'https://anipotts.com';
    const redirectUrl = new URL(redirectPath, baseUrl);
    redirectUrl.search = request.nextUrl.search;
    // Remove _subdomain param from redirect
    redirectUrl.searchParams.delete('_subdomain');
    return NextResponse.redirect(redirectUrl, 301);
  }

  // Admin on subdomain → rewrite with scope headers
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

export const config = {
  // Match all paths except static files and Next.js internals
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|xml|txt|json|webmanifest)$).*)',
  ],
};
