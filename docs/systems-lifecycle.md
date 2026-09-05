# Systems lifecycle

The public `/systems` page describes intended behavior. It does not operate an
agent, read a vault, book appointments, change a calendar, or create automations.

## Content contract

`content/public/pages/systems.md` owns the `lifecycle` record: ordered stages,
life-area labels, workers, supporting nodes, sources, devices, relationships,
completion rules, presentation copy, and walkthrough references.

`SystemMap.astro` renders the HTML reading order and a decorative SVG layer.
`lifecycle-controller.ts` measures the rendered endpoints after resize, font
loading, and source expansion. Its only interactive state is the manually
advanced example. CSS owns responsive layout, theme treatment, and motion.

The previous `map_*` content and legacy validator are retained for experimental
routes. They no longer constrain the public page or supply any production
lifecycle nodes. Existing experimental components remain independent.

Run `pnpm content:generate` after canonical content changes. Generated public,
admin, TypeScript, and seed projections must agree; `pnpm content:check` checks
that agreement. Explicit malformed lifecycle content fails validation instead
of silently manufacturing replacement endpoints.

## Completion and exception semantics

- Verification can return to action or context gathering while work remains.
- Missing information reaches the personal-context helper before Ani.
- Ani's answer resumes the requesting stage. Changed goals return to
  understanding. Resolved persistence failures return to recording.
- Completion requires verified scope satisfaction and successful persistence.
  A paused task remains open; external waits resume on relevant events.
- Follow-up is a separate task. Its outcome becomes context for future work.
- Credentials provide access; Ani supplies direction and decisions. Tailnet
  connects devices. Execution receipts stay on the Mac mini.

## Verification coverage

The content-platform tests cover endpoint integrity, duplicate identities,
walkthrough references, required paths, normal completion, missing-context
escalation, changed objectives, verification retries, persistence recovery,
and separate feedback. These are diagram-contract tests, not proof that the
depicted real-world automations operate.

Browser review covered 320, 390, 430, 768, 1024, and 1440 CSS pixels in light
and dark themes. Four life labels remain in one row. The mobile layout retains
the lifecycle and AP branch while moving supporting groups below it. Expanded
sources push infrastructure down. Page overflow and node/label clipping were
checked, along with the measured routes after reflow.

The manual example was advanced through all nine states, moved backward, and
reset with keyboard-accessible controls. The accessibility tree includes the
sequence, every relationship, completion conditions, and the separate feedback
loop. JavaScript-disabled rendering includes static route descriptions and
flow-layout sources. Reduced-motion rendering uses zero-duration transitions.

Local raster assets have ample resolution for their rendered size; NYU uses
the 1024px PNG. Apple Books and Health use 512px official artwork. Source
provenance is recorded alongside the assets. A fresh preview console was clean.

The website remains marked `intended system`. The separately commissioned
personal-context capability must be verified on its own merits before this
descriptor changes.
