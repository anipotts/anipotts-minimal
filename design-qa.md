# admin operator console QA

date: 2026-07-25

scope: fixture-backed Inbox and Work prototype on the managed local preview

## reviewed

| surface              | desktop                                                             | mobile                                                           | status |
| -------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------- | ------ |
| Inbox                | `docs/design/admin-operator-console/qa/inbox-desktop-1440x1024.png` | `docs/design/admin-operator-console/qa/inbox-mobile-390x844.png` | pass   |
| Work                 | `docs/design/admin-operator-console/qa/work-desktop-1440x1024.png`  | `docs/design/admin-operator-console/qa/work-mobile-390x844.png`  | pass   |
| Work compact desktop | `docs/design/admin-operator-console/qa/work-desktop-1040x939.png`   | n/a                                                              | pass   |

## verified

- `/inbox` and `/work?view=now` render through the dev-only loopback preview.
- production and protected API requests still require passkey authentication.
- Inbox contains one ranked attention projection and one linked being-handled
  strip. All 12 rendered attention ids and entity ids are unique.
- the first four Inbox actions fit in the 1440 x 1024 viewport.
- Work columns align at 1040 and 1440. Mobile task rows switch to a deliberate
  stacked layout with 44px actions.
- both routes have no horizontal overflow at 1440 or 390.
- the Work inspector opens the same task and exposes source, lineage, proof,
  repo, worktree, native reference, and linked attention detail.
- the local display heading computes to `AP Structural` and
  `document.fonts.check('900 32px "AP Structural"')` returns true.
- the AP Structural packet remains `candidate`; Urbanist remains the production
  display face and fallback.

## fixes made during QA

- corrected the Urbanist package import to `@fontsource/urbanist/900.css`
- loaded the immutable AP Structural CSS as dev-only inline CSS with Vite font
  asset URLs
- removed repeated route narration, sidebar status pills, and the Access footer
- restored native table-cell layout and moved internal stacks into wrappers
- removed the inherited 780px table minimum and nested main padding
- added distinct, accessible Codex and Claude source marks with visible labels

## limits

This is local fixture and browser proof. It is not deployed proof, production D1
parity, authenticated ceremony proof, or a full screen-reader audit. Production
fixture replacement, auth changes, writes, provider actions, and deployment
remain closed.
