/**
 * Navigate to a URL using the View Transitions API if available.
 * Falls back to regular navigation in browsers that don't support it.
 *
 * The View Transitions API enables smooth animated transitions between
 * DOM states, making subdomain switches feel seamless.
 *
 * @param url - The URL to navigate to
 *
 * @example
 * navigateToSubdomain("https://thoughts.anipotts.com");
 */
export function navigateToSubdomain(url: string): void {
  // Check if View Transitions API is available
  if (typeof document !== "undefined" && "startViewTransition" in document) {
    // Use View Transitions for smooth animation
    (document as Document & { startViewTransition: (callback: () => void) => void }).startViewTransition(() => {
      window.location.href = url;
    });
  } else {
    // Fallback for browsers without View Transitions support
    window.location.href = url;
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
      // Dispatch a popstate event to trigger any listeners
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
  } else {
    window.history.pushState({}, "", url);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
}

/**
 * Check if the View Transitions API is supported.
 *
 * @returns true if View Transitions are supported
 */
export function supportsViewTransitions(): boolean {
  return typeof document !== "undefined" && "startViewTransition" in document;
}
