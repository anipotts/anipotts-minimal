# Admin canvas fidelity ledger

Status: first implementation slice is reviewable at `/` and `/inbox`.

Review date: 2026-08-05

## Accepted concept references

- desktop root:
  `/Users/anipotts/.codex/generated_images/019fb8cd-35fc-7253-b14b-5131b734c894/exec-3e347879-576e-46b0-8807-79b60c6a9025.png`
- mobile root:
  `/Users/anipotts/.codex/generated_images/019fb8cd-35fc-7253-b14b-5131b734c894/exec-7d93e4c9-ce62-44f4-959c-8f5c5e24be71.png`
- mobile semantic inspector:
  `/Users/anipotts/.codex/generated_images/019fb8cd-35fc-7253-b14b-5131b734c894/exec-2ffbd36d-4129-488d-9695-a01ecb9b8417.png`

Raster copy and counts were directional. The typed read model remains the
authority for rendered facts.

## Browser render evidence

The managed preview at `http://localhost:4311/` was inspected in the Codex
in-app Browser with authenticated local state.

- desktop viewport, 1440 by 1100:
  `/Users/anipotts/.codex/visualizations/2026/07/31/019fb8cd-35fc-7253-b14b-5131b734c894/admin-canvas-desktop-1440x1100.png`
- desktop full page:
  `/Users/anipotts/.codex/visualizations/2026/07/31/019fb8cd-35fc-7253-b14b-5131b734c894/admin-canvas-desktop-full.png`
- mobile viewport, 390 by 844:
  `/Users/anipotts/.codex/visualizations/2026/07/31/019fb8cd-35fc-7253-b14b-5131b734c894/admin-canvas-mobile-390x844.png`
- mobile semantic inspector:
  `/Users/anipotts/.codex/visualizations/2026/07/31/019fb8cd-35fc-7253-b14b-5131b734c894/admin-canvas-mobile-inspector.png`
- mobile graph at rest and after horizontal scroll:
  `/Users/anipotts/.codex/visualizations/2026/07/31/019fb8cd-35fc-7253-b14b-5131b734c894/admin-canvas-mobile-graph.png`
  and
  `/Users/anipotts/.codex/visualizations/2026/07/31/019fb8cd-35fc-7253-b14b-5131b734c894/admin-canvas-mobile-graph-scrolled.png`
- mobile attention and lower sections:
  `/Users/anipotts/.codex/visualizations/2026/07/31/019fb8cd-35fc-7253-b14b-5131b734c894/admin-canvas-mobile-attention.png`
  and
  `/Users/anipotts/.codex/visualizations/2026/07/31/019fb8cd-35fc-7253-b14b-5131b734c894/admin-canvas-mobile-lower.png`
- tablet expanded menu, 864 by 942:
  `/Users/anipotts/.codex/visualizations/2026/07/31/019fb8cd-35fc-7253-b14b-5131b734c894/admin-canvas-tablet-menu-864x942.png`

The Browser viewport was overridden only for the 1440 by 1100, 390 by 844,
and 864 by 942 checks, then reset. A single mobile full-page capture was not
used because the shell scroll container and fixed navigation make that browser
capture mode unrepresentative. Viewport captures plus deliberate vertical and
horizontal scroll captures cover the actual mobile composition.

## Fidelity comparison

| Accepted direction                                     | Rendered result                                                                                               | Status   |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | -------- |
| preserve the sidebar structure and density             | existing sidebar information architecture, labels, spacing, and mobile navigation remain intact               | faithful |
| use white, cool gray, dark ink, and brand blue         | the canvas uses existing white and cool-gray tokens, `#11111b` ink, and `#61abea` only for interaction        | faithful |
| retain Urbanist, Instrument Sans, and JetBrains Mono   | display, interface, and evidence values use the extracted type roles                                          | faithful |
| use soft grouped surfaces with fewer dividers          | 16px regions, 12px inner references, tonal grouping, and complete-region borders replace the ledger treatment | faithful |
| foreground before operational state                    | foreground focus precedes six derived projections and explicit source state                                   | faithful |
| keep the four graph layers separate                    | world, obligation, execution, and trajectory remain distinct connected nodes                                  | faithful |
| make attention reviewable without becoming a table     | desktop rows become aligned soft cards and mobile rows become stacked review cards                            | faithful |
| preserve mobile navigation and make the graph usable   | bottom navigation is unchanged and the graph is a horizontal snap rail                                        | faithful |
| expose authority and provenance in a shallow inspector | desktop uses an opaque right sheet and mobile uses an opaque bottom sheet with contained scrolling            | faithful |
| use one regular-weight Phosphor icon grammar           | all new generic icons use `@phosphor-icons/react`; the selected sidebar icon now stays regular                | faithful |

The accepted concepts and current Browser renders were also compared directly
with `view_image`. The hierarchy, palette, typography, rounding, component
families, graph order, mobile navigation, and inspector behavior match the
approved direction.

## Intentional data differences

The concept showed directional fixture copy such as “content draft saves need
proof,” eight open items, no urgent items, and a July 31 checked time. The
current render shows the real local read model, including the passkey proof
item, nine open items, one urgent item, and explicit `unknown` or `partial
source` states where the source cannot prove more. This is a semantic
correction, not a visual deviation.

The universal inspector uses a reusable fact grid instead of a record-specific
mock sheet. It preserves authority, provenance, confidence, sensitivity,
validity, checked time, retrieval policy, destination, and evidence while
keeping one interaction grammar for calendar, source, proof, repository,
person, task, and route references.

At 390 by 844, the top viewport naturally shows only the first four operational
cards. Separate scroll captures prove the remaining cards, graph, attention,
receipt, and handled sections without compressing the approved density.

## Interaction proof

- authenticated `/` survived a timed refresh and a second reload with no
  Browser error messages
- a semantic inspector restored focus to its exact opener after close
- proof and task references opened the same typed inspector with their own
  authority and source state
- the mobile graph moved from `scrollLeft = 0` to `scrollLeft = 344` inside a
  361px viewport with 1346px of scrollable content
- the tablet menu rendered as one opaque foreground layer with contained
  scrolling, a 45 stacking level, and no work-content interleaving
- no provider mutation was performed during interaction checks

## Remaining acceptance boundary

This ledger covers the canonical `/` dashboard and the shared `/inbox`
compatibility surface only. Route-by-route expansion remains gated on visual
and functional acceptance of this first slice so the app keeps one component
system and one typed interaction grammar.
