import { Fragment } from "react";

/**
 * All subdomain origins for DNS prefetch and preconnect hints.
 * These help browsers establish connections before the user clicks.
 */
const SUBDOMAIN_ORIGINS = [
  "https://anipotts.com",
  "https://thoughts.anipotts.com",
  "https://dev.anipotts.com",
  "https://links.anipotts.com",
  "https://updates.anipotts.com",
  "https://metrics.anipotts.com",
  "https://status.anipotts.com",
  "https://lab.anipotts.com",
  "https://docs.anipotts.com",
] as const;

interface SubdomainHintsProps {
  /** Current subdomain (e.g., "www", "thoughts", "dev") */
  current: string;
}

/**
 * Server component that adds DNS prefetch and preconnect hints for other subdomains.
 * This warms up the connection to other subdomains, reducing navigation latency.
 *
 * DNS prefetch: Resolves the domain name ahead of time (~5-20ms saved)
 * Preconnect: Establishes TCP/TLS connection (~50-200ms saved)
 *
 * @example
 * // In layout.tsx <head>
 * <SubdomainHints current="www" />
 */
export function SubdomainHints({ current }: SubdomainHintsProps) {
  // Filter out the current subdomain - no need to prefetch what we're already on
  const otherOrigins = SUBDOMAIN_ORIGINS.filter((origin) => {
    if (current === "www") {
      // For www, filter out the root domain
      return origin !== "https://anipotts.com";
    }
    // For subdomains, filter out their specific origin
    return !origin.includes(`${current}.anipotts.com`);
  });

  return (
    <>
      {otherOrigins.map((origin) => (
        <Fragment key={origin}>
          {/* DNS prefetch - resolve domain name early */}
          <link rel="dns-prefetch" href={origin} />
          {/* Preconnect - establish full connection (TCP + TLS handshake) */}
          <link rel="preconnect" href={origin} crossOrigin="anonymous" />
        </Fragment>
      ))}
    </>
  );
}
