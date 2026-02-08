/**
 * Track which URLs have been prefetched to avoid duplicate work.
 */
const prefetched = new Set<string>();

/**
 * Prefetch a URL by adding a link[rel=prefetch] element to the document.
 * This tells the browser to fetch the resource in the background with low priority.
 *
 * @param url - The URL to prefetch
 */
export function prefetchUrl(url: string): void {
  // Skip if already prefetched
  if (prefetched.has(url)) return;

  // Skip if running on server
  if (typeof document === "undefined") return;

  // Create prefetch link
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = url;
  link.as = "document";
  document.head.appendChild(link);

  prefetched.add(url);
}

/**
 * Create event handlers for hover/focus prefetching.
 * When a user hovers over a link, we start prefetching after a short delay.
 * This reduces false positives from cursors passing over links.
 *
 * @param url - The URL to prefetch on hover
 * @param delay - Milliseconds to wait before prefetching (default: 65ms)
 * @returns Object with onMouseEnter, onMouseLeave, and onFocus handlers
 *
 * @example
 * const handlers = createHoverPrefetch("https://thoughts.anipotts.com");
 * <a href={url} {...handlers}>Link</a>
 */
export function createHoverPrefetch(url: string, delay = 65) {
  let timeout: ReturnType<typeof setTimeout>;

  return {
    onMouseEnter: () => {
      timeout = setTimeout(() => prefetchUrl(url), delay);
    },
    onMouseLeave: () => {
      clearTimeout(timeout);
    },
    onFocus: () => {
      // Prefetch immediately on focus (keyboard navigation)
      prefetchUrl(url);
    },
  };
}

/**
 * Check if a URL has already been prefetched.
 *
 * @param url - The URL to check
 * @returns true if the URL has been prefetched
 */
export function isPrefetched(url: string): boolean {
  return prefetched.has(url);
}

/**
 * Clear the prefetch cache. Useful for testing or memory management.
 */
export function clearPrefetchCache(): void {
  prefetched.clear();
}
