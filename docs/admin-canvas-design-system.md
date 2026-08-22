# Admin canvas design system

Status: approved by Ani on 2026-08-05

Scope: the authenticated main canvas at `/` and its identical `/inbox`
compatibility route. The sidebar information architecture and density remain in
place.

## Accepted concepts

- desktop root:
  `/Users/anipotts/.codex/generated_images/019fb8cd-35fc-7253-b14b-5131b734c894/exec-3e347879-576e-46b0-8807-79b60c6a9025.png`
- mobile root:
  `/Users/anipotts/.codex/generated_images/019fb8cd-35fc-7253-b14b-5131b734c894/exec-7d93e4c9-ce62-44f4-959c-8f5c5e24be71.png`
- mobile semantic inspector:
  `/Users/anipotts/.codex/generated_images/019fb8cd-35fc-7253-b14b-5131b734c894/exec-2ffbd36d-4129-488d-9695-a01ecb9b8417.png`

Raster text is not authoritative. Labels and values come from the typed read
models, including the canonical repository value `anipotts/anipotts.com`.

## Color lock

| Role                            | Value                                             |
| ------------------------------- | ------------------------------------------------- |
| canvas and raised surface       | `#ffffff`                                         |
| primary ink and primary control | `#11111b`                                         |
| interactive accent              | `#61abea`                                         |
| quiet surface                   | existing cool-gray mix of `#11111b` and `#ffffff` |
| success, warning, error         | existing admin semantic tokens                    |
| focus                           | `#11111b` outer ring with white separation        |

No cream, warm-gray reinterpretation, gradients, glows, or decorative color is
introduced. Blue identifies interaction. Semantic colors identify source-backed
state and never provider identity.

## Typography

| Role                                        | Family          | Weight     | Behavior                        |
| ------------------------------------------- | --------------- | ---------- | ------------------------------- |
| brand and page title                        | Urbanist        | 900        | compact tracking, sentence case |
| UI heading                                  | Instrument Sans | 680 to 740 | compact but not condensed       |
| body and controls                           | Instrument Sans | 450 to 650 | deliberate control sizing       |
| source, repo, commit, task, and time values | JetBrains Mono  | 450 to 600 | tabular numerals where useful   |

The root title is 40px desktop and 34px mobile. The foreground title is 28px
desktop and 23px mobile. Section labels are 12px, uppercase, and tracked. Body
copy stays between 13px and 15px with at least 1.4 line height.

## Container and spacing rules

- Keep the existing shell width and sidebar. The canvas uses one common left and
  right edge.
- Use a 12px spacing rhythm with 20px desktop panel padding and 16px mobile
  panel padding.
- Major regions use a 16px radius. Inner references and state cells use a 12px
  radius.
- Use tonal surfaces and whitespace for separation. Borders outline a complete
  region only when needed and never divide every field.
- Desktop controls are at least 40px. Mobile controls and icon-only targets are
  at least 44px.
- Shadows are limited to the modal inspector. The page hierarchy is established
  by tone, spacing, and type.

## Component families

| Family                 | Variants                                                                       |
| ---------------------- | ------------------------------------------------------------------------------ |
| page summary           | open count, urgent count, checked time, explicit source state                  |
| filters                | default, hover, selected, focus, disabled                                      |
| foreground             | current suggestion, no suggestion, inspect action                              |
| operational projection | ready, running, waiting, blocked, needs Ani, recently completed                |
| source state           | verified, stale, unchecked, absent, unknown                                    |
| graph node             | world, obligation, execution, trajectory                                       |
| attention item         | high, medium, low, selected, source-limited                                    |
| semantic reference     | provider link, safe internal route, inspector, refresh or inspect, unavailable |
| inspector              | desktop right sheet, mobile bottom sheet                                       |
| handled item           | task, proof receipt, unavailable source                                        |

The root order is page summary, filters, foreground, six operational
projections, source state, four-layer graph, needs-you attention, control-plane
receipt, being handled, and remaining attention.

## Icon inventory

All generic icons come from `@phosphor-icons/react`, regular weight, with rounded
stroke geometry. Main-canvas icons are 20px by default, 22px in prominent state
cells, and 18px in compact references.

| Meaning                        | Phosphor icon                           |
| ------------------------------ | --------------------------------------- |
| foreground inspection          | `EyeIcon`                               |
| ready and completed            | `CheckCircleIcon`                       |
| running and refresh            | `ArrowsClockwiseIcon`                   |
| waiting and source time        | `ClockIcon`                             |
| blocked                        | `StopIcon`                              |
| needs Ani and unknown          | `QuestionIcon`                          |
| local source                   | `DesktopTowerIcon`                      |
| provider or remote source      | `CloudIcon`                             |
| world                          | `GlobeHemisphereWestIcon`               |
| obligation and task            | `ClipboardTextIcon`                     |
| execution                      | `PlayCircleIcon`                        |
| trajectory                     | `TrendUpIcon`                           |
| person                         | `UserIcon`                              |
| organization                   | `BuildingsIcon`                         |
| location                       | `MapPinIcon`                            |
| source and proof               | `DatabaseIcon`, `ShieldCheckIcon`       |
| repository and commit          | `GithubLogoIcon`, `GitCommitIcon`       |
| calendar and deadline          | `CalendarBlankIcon`, `CalendarDotsIcon` |
| route and external destination | `LinkSimpleIcon`, `ArrowSquareOutIcon`  |

Selected sidebar rows keep their existing selected surface. Their icons remain
regular weight so selection does not change the icon metaphor or optical size.

## Semantic interaction grammar

Every meaningful value is represented by a typed semantic reference before it
is rendered. Text matching and visual guessing cannot create links.

| Source state | Meaning                                                               | Default affordance                                                      |
| ------------ | --------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `verified`   | the named source returned this value and its validity has not expired | provider-authoritative link when one exists, otherwise a safe inspector |
| `stale`      | the value was verified but its validity window has expired            | inspector with checked and valid times                                  |
| `unchecked`  | the provider or source has not been queried for this value            | refresh or inspect, with no claimed value                               |
| `absent`     | the source was checked and returned no value                          | non-link statement plus inspector evidence                              |
| `unknown`    | the system cannot determine whether a value exists                    | inspector explaining the missing provenance                             |

Provider links are explicit allowlisted destinations carried by the reference.
Internal references open the shallow inspector or a declared safe route. The
inspector states destination authority, provenance, confidence, sensitivity,
valid time, checked time, retrieval policy, and source state.

Verified Google Calendar events open their canonical event URL. Verified
deadlines may open an exact Calendar view. Inferred or unverified dates always
open the internal inspector. A missing timestamp never renders as a date.

## Data and lifecycle boundaries

- Fixture-backed work remains visibly stale and cannot produce a live activity
  claim.
- Waiting, blocked, and needs Ani remain derived overlapping projections.
- World, obligation, execution, and trajectory remain distinct connected
  layers.
- Trajectory, evidence, outcome, proof, and progress are never collapsed into
  one status.
- Raw transcripts, provider payloads, credentials, health values, and private
  message bodies stay outside the browser projection.
- The control-plane receipt stays after needs-you attention and outside graph and
  operational counts.

## Responsive continuation

At tablet width, the six projections form a strict two-row grid. At mobile
width, they form a two-column grid, source state becomes a compact vertical
summary, the graph becomes a horizontal snap rail, and attention rows become
stacked review cards. The universal inspector becomes an opaque bottom sheet
with scroll containment, focus trapping, Escape support, and a visible close
control.
