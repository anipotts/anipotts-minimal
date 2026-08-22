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

# passkey-first admin auth QA

date: 2026-07-31

scope: selected direction 3, refined into the minimalist passkey-first entry for
`/auth`

## comparison input

| artifact                | dimensions           | path                                                                                                                                       |
| ----------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| selected visual source  | 1487 x 1058          | `/Users/anipotts/.codex/generated_images/019fb8bc-86e9-70a2-9e70-6559a7be60bd/exec-d67d14ae-33b7-44b7-9727-962e5cffd53e.png`               |
| normalized source       | 1440 x 1024          | `/Users/anipotts/.codex/visualizations/2026/07/31/019fb8bc-86e9-70a2-9e70-6559a7be60bd/auth-qa/source-desktop-1440x1024.png`               |
| final implementation    | 1440 x 1024 at DPR 1 | `/Users/anipotts/.codex/visualizations/2026/07/31/019fb8bc-86e9-70a2-9e70-6559a7be60bd/auth-qa/implementation-desktop-1440x1024-final.png` |
| focused comparison      | 2880 x 1000          | `/Users/anipotts/.codex/visualizations/2026/07/31/019fb8bc-86e9-70a2-9e70-6559a7be60bd/auth-qa/comparison-desktop-focused-final.png`       |
| focused form comparison | 1440 x 480           | `/Users/anipotts/.codex/visualizations/2026/07/31/019fb8bc-86e9-70a2-9e70-6559a7be60bd/auth-qa/comparison-form-focused-final.png`          |

The in-app browser injects a 24px comment toolbar at the bottom of raw captures.
The full comparison applies the same 1440 x 1000 top crop to source and
implementation so browser chrome cannot affect the fidelity judgment.

## verified fidelity

- the desktop rail is exactly 288px at 1440px, matching the 20% reference rail.
- the content group renders at x 518.4, y 354.9, and 530px wide. The primary
  action is 530 x 88px.
- the visible AP identity is the approved source asset, not a text, CSS, or
  handcrafted approximation. Its desktop slot is 39 x 27.8px and its visible
  reference footprint is 38 x 26px.
- Instrument Sans Variable is loaded and used for the entry surface. The final
  comparison preserves the reference hierarchy, spacing, focus ring, palette,
  and quiet secondary actions.
- the final 390 x 844 implementation has no horizontal overflow. The primary
  action is 342 x 58.4px and both secondary actions keep 44px targets.
- dark mode resolves to surface `rgb(17, 17, 27)`, ink `rgb(245, 245, 247)`,
  and an inverse primary action. Reduced motion resolves animation and
  transition durations to `0s`.

## final state proof

| state                     | desktop or mobile proof                                                                                 | result |
| ------------------------- | ------------------------------------------------------------------------------------------------------- | ------ |
| direct passkey            | `auth-qa/implementation-desktop-1440x1024-final.png`, `auth-qa/implementation-mobile-390x844-final.png` | pass   |
| phone approval            | `auth-qa/state-phone-desktop-1440x1024-final.png`, `auth-qa/state-phone-mobile-390x844-final.png`       | pass   |
| invitation enrollment     | `auth-qa/state-invite-desktop-1440x1024-final.png`, `auth-qa/state-invite-mobile-390x844-final.png`     | pass   |
| pending owner approval    | `auth-qa/state-pending-desktop-1440x1024-final.png`                                                     | pass   |
| Google owner recovery     | `auth-qa/state-recover-desktop-1440x1024-final.png`                                                     | pass   |
| error and expired request | `auth-qa/state-error-desktop-1440x1024-final.png`, `auth-qa/state-expired-desktop-1440x1024-final.png`  | pass   |
| dark and focused          | `auth-qa/implementation-dark-1440x1024-final.png`                                                       | pass   |

All listed `auth-qa/` artifacts share this directory:
`/Users/anipotts/.codex/visualizations/2026/07/31/019fb8bc-86e9-70a2-9e70-6559a7be60bd/`.

## interaction and accessibility checks

- the direct state exposes one `h1`, one native passkey button, one native phone
  button, and one recovery link in the intended reading order.
- the main region is labelled by `auth-title`. The decorative AP image has an
  empty alt value and `aria-hidden="true"`.
- primary, phone, and recovery controls each show a 2px blue focus outline with
  a 3px offset. Quiet controls keep a 44px target on desktop and mobile.
- the phone state renders a real base64 PNG QR. Its alt text is
  `phone approval QR code`. Invitation enrollment exposes a labelled
  `display_name` input.
- phone wait and error status use polite live regions. The final browser console
  has no warnings or errors in direct, phone, invitation, and desktop state
  checks.

## fixes made during QA

- pass 1 found a P2 composition mismatch: the form was about 15px right, 33px
  high, and 18px too wide. The frame now uses the measured x, y, and width.
- pass 2 found a P2 asset violation: the rail used typed `ap` text. It now uses
  the approved source SVG with a source-preserving cropped viewBox.
- the first source-asset capture measured the mark 6px narrower than the visual
  reference. The final slot now matches the measured 38 x 26px footprint while
  retaining the smaller mobile treatment.
- open P0 issues: none. Open P1 issues: none. Open P2 issues: none.

## limits

This is local implementation and in-app browser proof. The mobile layout was
tested at the requested iPhone-sized viewport, but there was no separate mobile
source image for pixel comparison. Physical iPhone Safari, native passkey OS
ceremonies, signed-in session persistence, Google provider recovery, live D1,
and post-Access route proof remain rollout gates. Cloudflare Access remains in
place.

final result: passed
