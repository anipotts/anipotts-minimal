'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';

/**
 * Maps subdomain names to their internal route paths.
 * Used for SPA navigation within the consolidated app.
 */
const SUBDOMAIN_TO_ROUTE: Record<string, string> = {
  www: '/',
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
 * Reverse mapping: route path to subdomain name.
 */
const ROUTE_TO_SUBDOMAIN: Record<string, string> = Object.fromEntries(
  Object.entries(SUBDOMAIN_TO_ROUTE).map(([k, v]) => [v, k])
);

/**
 * Get the subdomain from a route path.
 * @param pathname - The current pathname (e.g., "/thoughts/hello")
 * @returns The subdomain name (e.g., "thoughts") or "www" for root
 */
export function getSubdomainFromPath(pathname: string): string {
  // Check if path starts with any known subdomain route
  for (const [route, subdomain] of Object.entries(ROUTE_TO_SUBDOMAIN)) {
    if (route !== '/' && pathname.startsWith(route)) {
      return subdomain;
    }
  }
  return 'www';
}

/**
 * Get the path within a subdomain from the full pathname.
 * @param pathname - The current pathname (e.g., "/thoughts/hello")
 * @returns The path within the subdomain (e.g., "/hello")
 */
export function getSubdomainPath(pathname: string): string {
  const subdomain = getSubdomainFromPath(pathname);
  const basePath = SUBDOMAIN_TO_ROUTE[subdomain];

  if (basePath === '/') {
    return pathname;
  }

  const subPath = pathname.slice(basePath.length);
  return subPath || '/';
}

type ViewTransitionDocument = Document & {
  startViewTransition: (callback: () => void | Promise<void>) => {
    ready: Promise<void>;
    finished: Promise<void>;
    updateCallbackDone: Promise<void>;
    skipTransition: () => void;
  };
};

/**
 * Check if the browser supports View Transitions API.
 */
function supportsViewTransitions(): boolean {
  return typeof document !== 'undefined' && 'startViewTransition' in document;
}

/**
 * Hook for SPA navigation between subdomain routes.
 *
 * This hook enables true SPA navigation within the consolidated single-app
 * architecture. It uses Next.js router for client-side transitions and
 * optionally wraps navigation in View Transitions for smooth animations.
 *
 * @example
 * ```tsx
 * const { navigateTo, currentSubdomain, currentPath } = useSubdomainNavigation();
 *
 * // Navigate to thoughts subdomain root
 * navigateTo('thoughts');
 *
 * // Navigate to a specific thought
 * navigateTo('thoughts', '/hello-world');
 *
 * // Navigate to main site work page
 * navigateTo('www', '/work');
 * ```
 */
export function useSubdomainNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const currentSubdomain = getSubdomainFromPath(pathname);
  const currentPath = getSubdomainPath(pathname);

  /**
   * Navigate to a subdomain route.
   *
   * @param subdomain - The subdomain to navigate to (e.g., "thoughts", "www")
   * @param path - The path within the subdomain (default: "/")
   * @param options - Navigation options
   */
  const navigateTo = useCallback((
    subdomain: string,
    path: string = '/',
    options?: { scroll?: boolean }
  ) => {
    const basePath = SUBDOMAIN_TO_ROUTE[subdomain];

    if (!basePath) {
      console.warn(`Unknown subdomain: ${subdomain}`);
      return;
    }

    // Construct the full internal path
    const fullPath = basePath === '/'
      ? path
      : path === '/'
        ? basePath
        : `${basePath}${path}`;

    // Use View Transitions if available for smooth animation
    if (supportsViewTransitions()) {
      (document as ViewTransitionDocument).startViewTransition(() => {
        router.push(fullPath, { scroll: options?.scroll ?? true });
      });
    } else {
      router.push(fullPath, { scroll: options?.scroll ?? true });
    }
  }, [router]);

  /**
   * Navigate back in history.
   */
  const goBack = useCallback(() => {
    if (supportsViewTransitions()) {
      (document as ViewTransitionDocument).startViewTransition(() => {
        router.back();
      });
    } else {
      router.back();
    }
  }, [router]);

  /**
   * Check if we're currently on a specific subdomain.
   */
  const isOnSubdomain = useCallback((subdomain: string) => {
    return currentSubdomain === subdomain;
  }, [currentSubdomain]);

  return {
    /** Current subdomain (e.g., "thoughts", "www") */
    currentSubdomain,
    /** Current path within the subdomain (e.g., "/hello") */
    currentPath,
    /** Navigate to a subdomain + path */
    navigateTo,
    /** Navigate back in history */
    goBack,
    /** Check if currently on a subdomain */
    isOnSubdomain,
    /** All available subdomains */
    subdomains: Object.keys(SUBDOMAIN_TO_ROUTE),
    /** Router instance for advanced usage */
    router,
  };
}

/**
 * Get the full internal path for a subdomain + path combination.
 * Useful for generating href values for Link components.
 *
 * @param subdomain - The subdomain (e.g., "thoughts")
 * @param path - The path within the subdomain (default: "/")
 * @returns The full internal path (e.g., "/thoughts/hello")
 */
export function getInternalPath(subdomain: string, path: string = '/'): string {
  const basePath = SUBDOMAIN_TO_ROUTE[subdomain];

  if (!basePath) {
    console.warn(`Unknown subdomain: ${subdomain}`);
    return path;
  }

  if (basePath === '/') {
    return path;
  }

  return path === '/' ? basePath : `${basePath}${path}`;
}
