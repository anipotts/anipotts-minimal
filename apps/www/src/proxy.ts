import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware proxy. Path-based redirects are handled in next.config.ts.
 * PostHog rewrites are handled in the base next config.
 */
export function proxy(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|xml|txt|json|webmanifest)$).*)',
  ],
};
