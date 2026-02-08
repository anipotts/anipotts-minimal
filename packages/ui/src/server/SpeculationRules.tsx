interface SpeculationRulesProps {
  /** Current section (e.g., "www", "thoughts", "dev") */
  current: string;
}

/**
 * Priority sections to prerender - most commonly visited first.
 * Limited to 2-3 to avoid excessive resource usage.
 */
const PRIORITY_SECTIONS = ["www", "thoughts", "dev", "lab"];

/**
 * Server component that adds speculation rules for prerendering likely navigation targets.
 * Modern browsers (Chrome 109+) will prerender these pages in a hidden tab,
 * making navigation feel nearly instant.
 *
 * All URLs are now same-origin paths (e.g., "/thoughts" instead of "https://thoughts.anipotts.com").
 *
 * @example
 * // In layout.tsx <head>
 * <SpeculationRules current="www" />
 */
export function SpeculationRules({ current }: SpeculationRulesProps) {
  // Get top 2 priority sections that aren't the current one
  const targetsToPrerender = PRIORITY_SECTIONS.filter((s) => s !== current).slice(0, 2);

  // Build same-origin paths for the targets
  const prerenderUrls = targetsToPrerender.map((section) =>
    section === "www" ? "/" : `/${section}`
  );

  const rules = {
    prerender: [
      {
        source: "list",
        urls: prerenderUrls,
        eagerness: "moderate",
      },
    ],
    prefetch: [
      {
        source: "document",
        where: {
          and: [
            { href_matches: "/*" },
            { not: { href_matches: current === "www" ? "/" : `/${current}/*` } },
            // Exclude non-page paths
            { not: { href_matches: "/ingest/*" } },
            { not: { href_matches: "/_next/*" } },
            { not: { href_matches: "/api/*" } },
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
