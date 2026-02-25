"use client";

/**
 * Navigate to a section path using the View Transitions API if available.
 * All sections are now same-origin, so this uses client-side navigation.
 *
 * @param path - The path to navigate to (e.g., "/thoughts")
 *
 * @example
 * navigateToSection("/thoughts");
 */
export function navigateToSection(path: string): void {
  if (typeof document !== "undefined" && "startViewTransition" in document) {
    (document as Document & { startViewTransition: (callback: () => void) => void }).startViewTransition(() => {
      window.location.href = path;
    });
  } else {
    window.location.href = path;
  }
}

/**
 * Navigate to a URL within the same origin using History API.
 * Uses View Transitions if available for smooth animations.
 *
 * @param url - The URL to navigate to (must be same origin)
 */
export function navigateSameOrigin(url: string): void {
  if (typeof document !== "undefined" && "startViewTransition" in document) {
    (document as Document & { startViewTransition: (callback: () => void) => void }).startViewTransition(() => {
      window.history.pushState({}, "", url);
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
  } else {
    window.history.pushState({}, "", url);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
}

/**
 * Check if the View Transitions API is supported.
 */
export function supportsViewTransitions(): boolean {
  return typeof document !== "undefined" && "startViewTransition" in document;
}
