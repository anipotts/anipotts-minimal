import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Subdomain → internal route mapping.
 * thoughts.anipotts.com serves content from /thoughts internally.
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
  // Could be project-name-git-branch-username.vercel.app
  // Check for _subdomain query param in these cases
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
  const url = request.nextUrl.clone();
  const subdomain = getSubdomain(request);

  // If no subdomain or subdomain not recognized, continue normally
  if (!subdomain || !SUBDOMAIN_ROUTES[subdomain]) {
    return NextResponse.next();
  }

  const targetPath = SUBDOMAIN_ROUTES[subdomain];

  // Prevent double-rewriting if path already starts with target
  // (e.g., internal navigation to /thoughts/hello shouldn't rewrite again)
  if (url.pathname.startsWith(targetPath)) {
    return NextResponse.next();
  }

  // Rewrite: / → /thoughts, /hello → /thoughts/hello
  url.pathname = url.pathname === '/'
    ? targetPath
    : `${targetPath}${url.pathname}`;

  // Remove the _subdomain param from the URL (for dev mode cleanliness)
  url.searchParams.delete('_subdomain');

  return NextResponse.rewrite(url);
}

export const config = {
  // Match all paths except static files and Next.js internals
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|xml|txt|json|webmanifest)$).*)',
  ],
};
