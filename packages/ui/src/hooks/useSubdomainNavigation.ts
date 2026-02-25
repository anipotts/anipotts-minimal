'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';

/**
 * Maps section names to their internal route paths.
 * Used for SPA navigation within the consolidated app.
 */
const SECTION_TO_ROUTE: Record<string, string> = {
  www: '/',
  work: '/work',
  thoughts: '/thoughts',
  connect: '/connect',
  dev: '/dev',
  claude: '/claude',
};

/**
 * Reverse mapping: route path to section name.
 */
const ROUTE_TO_SECTION: Record<string, string> = Object.fromEntries(
  Object.entries(SECTION_TO_ROUTE).map(([k, v]) => [v, k])
);

/**
 * Get the section name from a route path.
 * @param pathname - The current pathname (e.g., "/thoughts/hello")
 * @returns The section name (e.g., "thoughts") or "www" for root
 */
export function getSectionFromPath(pathname: string): string {
  // Check if path starts with any known section route
  for (const [route, section] of Object.entries(ROUTE_TO_SECTION)) {
    if (route !== '/' && pathname.startsWith(route)) {
      return section;
    }
  }
  return 'www';
}

/**
 * Get the path within a section from the full pathname.
 * @param pathname - The current pathname (e.g., "/thoughts/hello")
 * @returns The path within the section (e.g., "/hello")
 */
export function getSectionPath(pathname: string): string {
  const section = getSectionFromPath(pathname);
  const basePath = SECTION_TO_ROUTE[section];

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
 * Hook for SPA navigation between site sections.
 *
 * Enables true SPA navigation within the single-app architecture.
 * Uses Next.js router for client-side transitions and optionally
 * wraps navigation in View Transitions for smooth animations.
 *
 * @example
 * ```tsx
 * const { navigateTo, currentSection, currentPath } = useSectionNavigation();
 *
 * // Navigate to thoughts section root
 * navigateTo('thoughts');
 *
 * // Navigate to a specific thought
 * navigateTo('thoughts', '/hello-world');
 *
 * // Navigate to main site work page
 * navigateTo('www', '/work');
 * ```
 */
export function useSectionNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const currentSection = getSectionFromPath(pathname);
  const currentPath = getSectionPath(pathname);

  /**
   * Navigate to a section route.
   *
   * @param section - The section to navigate to (e.g., "thoughts", "www")
   * @param path - The path within the section (default: "/")
   * @param options - Navigation options
   */
  const navigateTo = useCallback((
    section: string,
    path: string = '/',
    options?: { scroll?: boolean }
  ) => {
    const basePath = SECTION_TO_ROUTE[section];

    if (!basePath) {
      console.warn(`Unknown section: ${section}`);
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
   * Check if we're currently on a specific section.
   */
  const isOnSection = useCallback((section: string) => {
    return currentSection === section;
  }, [currentSection]);

  return {
    /** Current section (e.g., "thoughts", "www") */
    currentSection,
    /** Current path within the section (e.g., "/hello") */
    currentPath,
    /** Navigate to a section + path */
    navigateTo,
    /** Navigate back in history */
    goBack,
    /** Check if currently on a section */
    isOnSection,
    /** All available sections */
    sections: Object.keys(SECTION_TO_ROUTE),
    /** Router instance for advanced usage */
    router,
  };
}

/**
 * Get the full internal path for a section + path combination.
 * Useful for generating href values for Link components.
 *
 * @param section - The section (e.g., "thoughts")
 * @param path - The path within the section (default: "/")
 * @returns The full internal path (e.g., "/thoughts/hello")
 */
export function getInternalPath(section: string, path: string = '/'): string {
  const basePath = SECTION_TO_ROUTE[section];

  if (!basePath) {
    console.warn(`Unknown section: ${section}`);
    return path;
  }

  if (basePath === '/') {
    return path;
  }

  return path === '/' ? basePath : `${basePath}${path}`;
}
