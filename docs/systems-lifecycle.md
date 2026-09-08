# Systems page

`content/public/pages/systems.md` owns the hero and four-step workflow copy, ordered source IDs, icon assignments, and return caption.
`packages/content/src/public/providers.ts` owns the approved local artwork registry used by validation and rendering.

`SystemMap.astro` renders the complete semantic workflow. Its optional controller animates only the source marquee. Content remains readable without JavaScript; reduced motion uses the static source list. The explicit pause control also respects keyboard focus, document visibility, and offscreen state. Hover does not pause the marquee.

Desktop uses four stationary columns and an interrupted right-angle return connector. Below 880px, titles, icons, and descriptions stack; the return caption follows the long upward arrow. All tiles use the shared treatment.

This is a conceptual personal-system explanation, not telemetry or a claim of live integrations.

The older topology, lifecycle renderer, and controller are removed from executable source and canonical content. Git recovery references and preserved local experiments are recorded in the site release review.
