# admin operator console design review

status: awaiting Ani's visual selection

date: 2026-07-23

source checkpoint: `ab210add5df58c9219cd96173a7b5c31eb17d8cf`

review branch: `codex/pro/admin-operator-console-design-2026-07-23`

## audit evidence

The `audit/` folder contains fresh local Browser captures from
`http://127.0.0.1:4311/` at an `834 x 939` viewport.

Each route has:

- a viewport capture used for visual review and ideation grounding
- a full-page capture used to measure density and repeated sticky content

The six audited routes are Inbox, Work, Knowledge, Life, Fleet, and Content.
The findings and redesign contract live in
[`../../admin-operator-console-redesign-brief-2026-07-23.md`](../../admin-operator-console-redesign-brief-2026-07-23.md).

## visual directions

The `directions/` folder contains three independent first-screen directions.
They are review images, not implementation proof.

| order | file                     |        size | sha-256                                                            |
| ----- | ------------------------ | ----------: | ------------------------------------------------------------------ |
| 1     | `01-priority-ledger.jpg` | 1440 x 1024 | `76b944f7c4d8ddf06cca31ff3fb41ee29494379684161caa561292a8fe716a90` |
| 2     | `02-operator-desk.jpg`   | 1440 x 1024 | `872dd77fdf0b4ac813e9541948b8b5dabc5c5838450e35e769504bf7594cab4b` |
| 3     | `03-focus-stack.jpg`     | 1440 x 1024 | `55fa9b806e033a5a50e53cabe54d2b04f1b9d09ce66a172cdc10e23b9c3c23a8` |

The untouched image-generation outputs remain under the Codex generated-image
store. The tracked files were scaled to the requested `1440 x 1024` review
frame and exported as JPEG to keep the design packet reviewable in git.

No direction has been selected. Do not begin the fixture prototype until Ani
chooses one or requests a combined revision.

## closed gates

This packet does not merge, migrate, deploy, change Access or auth, add a live
adapter, enable writes, execute provider actions, publish content, mutate native
tasks, or delete source records.
