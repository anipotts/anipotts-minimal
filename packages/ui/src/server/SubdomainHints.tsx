interface SubdomainHintsProps {
  /** Current section (e.g., "www", "thoughts", "dev") */
  current: string;
}

/**
 * Previously added DNS prefetch and preconnect hints for cross-origin subdomains.
 * All navigation is now same-origin (anipotts.com/*), so these hints are no longer needed.
 */
export function SubdomainHints({ current }: SubdomainHintsProps) {
  return null;
}
