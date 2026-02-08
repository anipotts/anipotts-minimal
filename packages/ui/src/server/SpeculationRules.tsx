interface SpeculationRulesProps {
  /** Current subdomain (e.g., "www", "thoughts", "dev") */
  current: string;
}

/**
 * Priority subdomains to prerender - most commonly visited first.
 * Limited to 2-3 to avoid excessive resource usage.
 */
const PRIORITY_SUBDOMAINS = ["www", "thoughts", "dev", "lab"];

/**
 * Server component that adds speculation rules for prerendering likely navigation targets.
 * Modern browsers (Chrome 109+) will prerender these pages in a hidden tab,
 * making navigation feel nearly instant.
 *
 * Eagerness levels:
 * - "immediate": Prerender as soon as the rule is parsed
 * - "eager": Prerender when there's high confidence user will navigate
 * - "moderate": Prerender on hover (default, balanced)
 * - "conservative": Prerender only on pointer down
 *
 * @example
 * // In layout.tsx <head>
 * <SpeculationRules current="www" />
 */
export function SpeculationRules({ current }: SpeculationRulesProps) {
  // Get top 2 priority subdomains that aren't the current one
  const targetsToPrerender = PRIORITY_SUBDOMAINS.filter((s) => s !== current).slice(0, 2);

  // Build URLs for the targets
  const prerenderUrls = targetsToPrerender.map((subdomain) =>
    subdomain === "www" ? "https://anipotts.com" : `https://${subdomain}.anipotts.com`
  );

  // Speculation rules spec requires a specific JSON format
  const rules = {
    prerender: [
      {
        source: "list",
        urls: prerenderUrls,
        eagerness: "moderate", // Prerender on hover - good balance of performance vs resources
      },
    ],
    prefetch: [
      {
        source: "document",
        where: {
          and: [
            { href_matches: "https://*.anipotts.com/*" },
            { not: { href_matches: current === "www" ? "https://anipotts.com/*" : `https://${current}.anipotts.com/*` } },
          ],
        },
        eagerness: "moderate",
      },
    ],
  };

  return (
    <script
      type="speculationrules"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(rules) }}
    />
  );
}
