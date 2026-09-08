# Site release review: engineer with taste

Updated: 2026-09-07. Owner: Ani, with Codex implementing the public-site lane.

## Release state

This is an internal editorial and release ledger, not published page copy. The release is **in review**, not deployed. The working branch is `codex/site-work-release-2026-09-07`, based on `2451782dfe1599c642b1f75d39623e4ec9e592ce`.

The direction is thoughtful systems and products, engineering depth demonstrated by the work, and Ani's own taste across technical and creative interests. Systems protect attention and preserve context. Personal integrations are not a launch prerequisite.

Engineering checkpoint: the final `pnpm check:changed` run passed for `33a8f5a`, including full workspace validation after the unavailable-source correction. `3711bfa` only normalizes Obsidian SVG line endings; its diff is empty when end-of-line whitespace is ignored, and the full branch passes `git diff --check`. The branch was pushed and its remote SHA verified. There is no PR, merge, or deployment yet. The public preview is running; the manager reports an unrelated stale admin process, which was left unchanged.

Substantive replacement copy needs section-by-section approval. Existing selections, publication dates, project IDs, hidden records, and draft state remain unchanged. No invented contributions, metrics, client permissions, or first-person anecdotes.

### Implemented commit groups

| Commit    | Scope                                                                                  | State                                                             |
| --------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `1da3954` | Mobile footer and page spacing                                                         | Preserved prior local edits; locally checked                      |
| `ce7f0d7` | Provider artwork, 14-source marquee, mobile steps and return caption                   | Preserved approved systems presentation; locally checked          |
| `2def063` | `/work` index/details, permanent redirects, navigation, metadata, shared compatibility | Implemented; legacy records and review IDs retained               |
| `b9f563f` | Canonical content build-cache inputs and RSS freshness                                 | Implemented; local feed and Turbo input inventory checked         |
| `e12239b` | Work section metadata and older shared-consumer tests                                  | Regression repair from full validation                            |
| `62b5e79` | Coding Agent Tips title, alt text, canonical repository link                           | Factual identity correction; existing slug and record ID retained |

The broad classifier selects `www`, `admin`, and `state` because shared types/configuration changed. Do not bypass that classification or describe the eventual release as www-only without an exact-tree deployment-plan review. There are no production database rewrites in this change. Generated seed files are projections, not evidence of a remote migration.

## First editorial batch: systems

Approval state: **proposed, not applied**. Keep the approved hero and return caption.

### Rationale before the map

Current:

> the map below shows my general process for keeping track of what i'm working towards

Proposed replacement, two short paragraphs:

> i want more time for work i care about, things i want to explore, and people i love, with less of it spent piecing everything back together
>
> the map below is how i organize that, with context that persists and agents that carry work forward while i stay involved in the decisions that need me

These are proposals based on Ani's stated rationale, not a new personal history or a measured time-saving claim. Question for review: does this express the reason for the system in Ani's own rhythm?

### Retrieve context

Current:

> i share the files, examples, and constraints that make the task specific

Proposed:

> my agents retrieve relevant context, and i add the details and permissions the task needs

This distinguishes retrieval from Ani's contribution. Tailscale is connectivity, 1Password is credentials, and Obsidian is knowledge; their presence does not grant blanket authority.

### Return caption and related work

Preserve exactly:

> we persist what we learn, and my agents carry that context into the next task

After the rationale is reviewed, add ordinary text links below the map: `coding agent tips` and `awareness is alpha`. Use the canonical existing `public_tools`/`featured_writing` content instead of another hardcoded card grid. The essay itself still needs its content review below. No links have been added as a substitute for that review.

## Editorial method

The supplied portfolio-walkthrough video informs the work-page review: decide what a visitor should learn about Ani, establish role/scope, show the finished artifact early, select important decisions and alternatives, then show evidence and genuine reflection. Avoid a chronological process dump or forcing every small project into seven headings.

For writing, apply clarity of argument, concrete examples, evidence, and purposeful structure. Keep the author's historical perspective and original date. Product-case-study structure does not belong in every essay.

The tables below separate existing publication state from new editorial approval. “Retain pending review” means leave existing copy intact, not that its claims have been verified.

## Route and content ledger

Visual code `M/D`: automated 390px and 1440px checks in light/dark themes returned 200, one h1, no document overflow, no broken completed images, and no page errors. This is technical coverage, not Ani's visual or editorial approval. Systems and work also received the seven-width check. Selected screenshots were inspected; every page still needs final human reading.

| Route                                                    | Publication state             | Factual questions / proposed direction                                                                                                                                                           | Approval                                                | Visual                                | Release disposition                                   |
| -------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------- |
| `/systems`                                               | Public                        | Rationale and retrieval proposals above; keep conceptual loop                                                                                                                                    | Presentation approved; new copy pending                 | Seven widths, M/D, 319px at 200% text | Ship presentation after release gates; hold new copy  |
| `/`                                                      | Public                        | Keep contribution distinct from company product claims; verify employment dates, Atlantic relationship, press attribution; draft a lighter introduction after systems review                     | Existing selection preserved; rewrite pending           | M/D                                   | Rename links now; hold positioning changes            |
| `/work`                                                  | New canonical index           | Experience, selected projects, archive; preserve ordering and visibility                                                                                                                         | Structure requested; minimal index metadata implemented | Seven widths, M/D                     | Include route migration                               |
| `/work/structured-ai`                                    | Featured experience           | Which difficult interaction/engineering decision was Ani's? Confirm 2025 dates, team scope and permission for screenshot. Current company site supports drawing review/citations, not authorship | Retain pending review                                   | M/D                                   | No new contribution claims                            |
| `/work/pgi-research-platform`                            | Featured experience           | Confirm role/dates, specific portal ownership, client screenshot permission, decision rationale and result                                                                                       | Retain pending review                                   | M/D                                   | Keep existing artifact and order                      |
| `/work/habittracker-obh`                                 | Featured experience           | Separate Ani's work from venture capabilities; verify Atlantic affiliation and approved screenshots                                                                                              | Retain pending review                                   | M/D                                   | Hold substantive revision                             |
| `/work/range-media-partners`                             | Featured experience           | Clarify current dating, client relationship, useful deliverable, and what can be public                                                                                                          | Retain pending review                                   | M/D                                   | Hold substantive revision                             |
| `/work/quantercise`                                      | Featured project              | Which version is shown? Verify 400+ problems, grading/runtime, availability and payments; do not silently replace historical features with current beta plans                                    | Retain pending review                                   | M/D                                   | Hold feature/status rewrite                           |
| `/work/claude-code-tips`                                 | Featured project              | Canonical repository now Coding Agent Tips; verify hundreds-of-sessions claim and current guide scope before changing description                                                                | Identity correction verified; story pending             | M/D                                   | Name/link correction included; slug retained          |
| `/work/imessage-mcp`                                     | Featured project              | Confirm current package capabilities, read-only boundaries, meaningful implementation choice; use synthetic/redacted examples                                                                    | Retain pending review                                   | M/D                                   | No personal messages or new private examples          |
| `/work/nyu-purity-test`                                  | Featured project              | Source 3,000+ completions, 1,000+ in 17 hours, and 200k+ visits; distinguish visits, people, completions                                                                                         | Retain pending review                                   | M/D                                   | Metrics require receipts or approved narrower wording |
| `/work/chainedchat`                                      | Listed project                | Verify sunset status, original contribution and repository; keep concise                                                                                                                         | Retain pending review                                   | M/D                                   | Compact archive entry                                 |
| `/work/quantercise-extension`                            | Listed project                | Verify extension availability/repository; distinguish it from main Quantercise                                                                                                                   | Retain pending review                                   | M/D                                   | Compact archive entry                                 |
| `/work/options-pricing-sensitivity`                      | Listed project                | Confirm repository ownership and scope of pricing/volatility work; avoid claims about financial results                                                                                          | Retain pending review                                   | M/D                                   | Compact archive entry                                 |
| Hidden project record                                    | Hidden                        | Review privately, including identity and media rights; no new public URL or selected card                                                                                                        | Not approved for publication                            | Hidden URL tested 404                 | Preserve hidden                                       |
| `/writing`                                               | Public                        | Existing introduction and all five published essays retained; selection/description review after work                                                                                            | Retain pending review                                   | M/D                                   | Canonical links only                                  |
| `/writing/awareness-is-alpha`                            | Published, 2026-07-14         | Ground central argument in one actual example; reduce abstractions and repetition                                                                                                                | Retain pending review                                   | M/D                                   | Preserve date; draft next editorial batch             |
| `/writing/saturdays-are-for-claude-code`                 | Published, 2026-04-13         | Verify 1,000 hours, 600+ sessions, 3.3 tool rate, 8.8x ratio, “100% human idle” causality and press link                                                                                         | Retain pending review                                   | M/D                                   | Preserve historical context; no current-state rewrite |
| `/writing/i-built-a-monitor-for-my-claude-code-sessions` | Published, 2026-04-07         | Resolve coming-soon promises, actual current/historical status and observability claims                                                                                                          | Retain pending review                                   | M/D                                   | Evidence needed before revised promises               |
| `/writing/stop-ending-your-day-with-fix-the-bug`         | Published, 2026-04-07         | Keep concrete task example; verify 30+ calls, 2/10+ minute comparison and billing assumptions                                                                                                    | Retain pending review                                   | M/D                                   | Scope observations; preserve original date            |
| `/writing/search-will-be-dead-by-2030`                   | Published, 2026-01-31         | Make prediction an argued position with counterexamples and reasoning                                                                                                                            | Retain pending review                                   | M/D                                   | Do not backdate newly learned facts                   |
| JPEGMAFIA essay                                          | Draft, original date retained | Recover Ani's actual music argument; no generic product analogy imposed                                                                                                                          | Not approved for publication                            | Absent from feed/sitemap              | Preserve draft                                        |
| `/links`, newsletter surfaces, 404, feeds                | Public supporting routes      | Final link/form/metadata regression checks; no real outbound form submission                                                                                                                     | No substantive copy change                              | See verification                      | Keep in release smoke inventory                       |

### Source receipts

- External project-link HEAD checks: eight destinations returned 200; the npm website returned 403 (access restriction, not proof the package is missing); the old options-pricing repository returned 404. A read-only visibility check found its current repository private. The source button was removed in `2bb23b7`; no repository visibility was changed.

- GitHub read on 2026-09-07: requesting `anipotts/claude-code-tips` resolves to [anipotts/coding-agent-tips](https://github.com/anipotts/coding-agent-tips), not archived, homepage `https://agents.anipotts.com`. This supports the name/link correction only.
- [Structured AI's current product site](https://getstructured.ai/) describes drawing review, drawing-set chat and cited findings. It does not prove Ani's personal contribution, historic release scope, employment dates, or screenshot permission.
- The Quantercise website returned no extractable copy in the research read. Treat its detailed feature/payment claims as unresolved, not verified.
- No new analytics totals, client permissions, employment facts, or first-person decisions were inferred from logos or screenshots.

## Workspace preservation

No worktree, branch, or user-authored experiment was deleted. The managed preview remains running.

Ignored local recovery files in `.local/release-preservation/`:

- `pre-work-release.patch` and `pre-work-release-untracked.tar.gz`: original main-checkout work before the focused commits.
- `systems-experiments.tar.gz`: 20 tracked-dirty/untracked files from the older systems worktree, including variants and screenshots.
- `hero-card-drafts.tar.gz`: five files from the older hero/card worktree.
- `canonical-record-qa.tar.gz`: the remaining QA document from the canonical-record worktree.

Archives were created without moving originals; entry counts were checked against the source file lists. Git retains committed bases and deleted tracked-file history. These archives are local, not cloud backups.

| Worktree / branch                          | Evidence                                                                               | Disposition and next action                                                                         |
| ------------------------------------------ | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Main project checkout, release branch      | Current work committed by scope                                                        | Keep preview and checkout; return to updated main only after integration                            |
| `26f0`, systems discovery                  | One unique docs commit `7eabfd8`                                                       | Retain attention/context rationale; old two-loop topology is superseded by current four-step design |
| `911c`, systems-simple-workflow            | Branch commits are ancestors of main; 20 dirty/untracked files archived                | Experiments preserved, not production candidates; retire only after review loop closes              |
| `public-site-review-batch-2026-08-28`      | Base integrated; CodingAgentTipsCard draft is byte-identical to current component      | Its SectionHero proposal is superseded by current shared PageHero; five files recoverably preserved |
| `public-work-canonical-records-2026-08-26` | Two record/style patches equivalent to main; only unique patch is old Portless removal | Do not merge whole branch; preserve QA document; current managed preview stays                      |

### Remaining local branches

Compared against `main` using ancestry and `git cherry`, not names/upstream presence.

- Integrated by ancestry: `codex/preserve/home-polish-before-consolidation-2026-09-07`, `codex/preserve/homepage-content-editing-2026-08-26`, `codex/preserve/state-deploy-dependency-fix-2026-08-26`, `codex/preserve/systems-before-consolidation-2026-09-07`, `codex/pro/preserve-64c19ce-20260715`, `codex/public-card-geometry-fix-2026-08-29`, `codex/systems-simple-workflow`. Eligible for later retirement after associated dirty work is resolved.
- Entirely patch-equivalent: `codex/admin-activation-graph-2026-07-31` (1), `codex/preserve/d1-ledger-bootstrap-batch-2026-08-22` (1), `codex/pro/brand-palette-admin-2026-07-17` (1), `codex/pro/brand-palette-www-2026-07-17` (1), `codex/public-site-review-main-preserve-2026-08-28` (2), `codex/public-site-review-pre-attribution-repair-2026-08-28` (3), `preserve/pro-admin-polish-20260702` (2). Retain until release closeout; no integration needed.
- `codex/preserve/ap-structural-width-fix-2026-08-23`: two equivalent patches, two unique historical Node-policy patches. Preserve; current Node 24.19.0 policy supersedes old environment proposals. Do not merge wholesale.
- `codex/pro/archive-homepage-f98e-2026-07-17`: one unique orphaned homepage experiment. Preserve as design history; compare only if Ani requests that direction.
- `codex/pro/site-annotations-2026-07-17`: five unique older homepage/typography/logo commits. Preserve; current approved layout is authoritative. Any future recovery must be selective.
- `codex/remove-portless-2026-08-28`: one unique Portless-removal patch. Superseded by current managed-preview policy; preserve without merging.
- Discovery and canonical-record branches: dispositions in the worktree table above.

## Open issue dispositions

All 21 issues remain open. These are proposed dispositions, not posted comments or closures. “Successor check” means the old implementation was removed but the corresponding current behavior has not been fully audited.

| Issue                         | Classification                            | Evidence / next action                                                                                                                                                                      |
| ----------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #43 React Review Audit        | Admin-only                                | Old React/Next audit; review relevant current Astro/React islands separately                                                                                                                |
| #27 Resend response details   | Superseded, successor check               | Old `/api/send` absent; review current newsletter response sanitization in its outbound lane                                                                                                |
| #25 Turbo cache inputs        | Maintenance, locally fixed public portion | Added root canonical Markdown glob; Turbo reports all 26 canonical files in public build inputs; audit remaining config packages separately                                                 |
| #24 Package metadata          | Already fixed                             | Root package has license, author, repository, homepage and description                                                                                                                      |
| #23 Slug collision            | Admin-only                                | Old publishing route; inspect current stable-ID/draft-operation flow before closing                                                                                                         |
| #22 RSS lastBuildDate         | Maintenance, locally fixed                | Feed now reports newest published date, not request time; five items, no draft                                                                                                              |
| #20 Icon cache                | Maintenance                               | Current route is a 307 to approved static assets; assess redirect caching separately                                                                                                        |
| #19 Turnstile/CSRF            | Superseded, successor check               | Old `/api/send` absent; do not infer current newsletter forms are covered                                                                                                                   |
| #16 ThemeContext memoization  | Superseded                                | Public site no longer uses old Next ThemeContext; any retained admin equivalent belongs to admin lane                                                                                       |
| #15 logger.info               | Already fixed                             | `packages/lib/src/logger.ts` uses `console.info`                                                                                                                                            |
| #14 Admin error boundary      | Admin-only                                | Review current Astro failure routes; old Next boundary prescription is stale                                                                                                                |
| #13 Unused exports            | Maintenance                               | Scope by current consumers; no blanket export deletion                                                                                                                                      |
| #12 TipCard nested controls   | Superseded, successor check               | Old card implementation absent; keyboard-check current linked cards before closing                                                                                                          |
| #11 Form labels               | Maintenance; public form checked          | Newsletter email has an accessible name and required email validation; mocked 503 produced the retry message without an outbound send. Remaining admin/search surfaces need their own check |
| #10 Atom count full scan      | Admin-only                                | Old Supabase pipeline; inspect current D1 query behavior                                                                                                                                    |
| #9 SERIES_COLORS              | Admin-only                                | Verify current chart consumers before extracting or removing anything                                                                                                                       |
| #7 CI ignored failures        | Already fixed in current workflows        | No `                                                                                                                                                                                        |     | true`found in`.github/workflows`; exact required checks still matter |
| #6 window.location.reload     | Admin-only                                | Old Next refresh advice; do not change authentication/navigation behavior in this release                                                                                                   |
| #5 Environment validation     | Maintenance                               | Audit per-target binding requirements without reading secret values                                                                                                                         |
| #4 ThroughputChart empty data | Admin-only                                | Check successor chart/empty states in dedicated admin review                                                                                                                                |
| #3 Login rate limiting        | Admin-only, security priority             | Current passkey/auth path needs a separate exact-scope audit; do not revive old login code                                                                                                  |

### Dependency PRs

Additional release gate discovered during push: GitHub reports 102 open dependency alerts on default main, including one critical. Read-only inspection identifies [alert #143](https://github.com/anipotts/anipotts.com/security/dependabot/143): `tar`, decompression/parse denial of service, patched in 7.5.19. The current lockfile contains 7.5.15; `pnpm why tar -r --depth 3` shows `www → astro-icon → @iconify/tools → tar`. That confirms the dependency chain, not public-request reachability. Before production, assess actual exposure and apply/reverify the narrow patch in the dependency lane. Do not equate green application tests with a cleared dependency-security gate.

Read-only snapshot 2026-09-07: #302 CLEAN; #306 BEHIND; #292–#295 draft/BLOCKED. No dependency branch was changed or merged.

- #302: refresh exact head, diff and checks against latest main after public integration; separate maintenance release.
- #306: update from latest main and rerun action compatibility checks in a dedicated CI lane.
- #292–#295: keep out of public launch. Diagnose Hono, TypeScript 7, SolidStart 2 and Astro Cloudflare 14 failures independently. Do not upgrade rollback-only Solid merely to empty the list.

## Verification and release gate

Completed local checks:

- Content generation/check and content-platform tests, including legacy path/placement normalization, stable admin identity, hidden record filtering and route inventory.
- Public and admin Astro typechecks: zero errors/warnings.
- All CI-invariant checks, brand/public-copy/boundary/routes, full workspace builds/lint/typechecks passed in the first full run. That run then found two shared unit-test regressions; both were repaired, and the 141 lib tests subsequently passed. The full `pnpm check:changed` rerun (which invokes `pnpm validate`) passed at `62b5e79`, including 141 lib and 132 admin unit tests. A final check follows the source-link correction.
- Public route smoke inventory: 23 routes. Sitemap: 20 index/detail URLs, including 11 work details and five published essays. No old `/making` or `/projects` canonical URLs, hidden project or draft in sitemap/feed.
- Eighty automated page checks: every sitemap URL at 390/1440px, both themes; no document overflow, broken completed images, missing h1, HTTP failure or page error.
- Systems and work at 319/390/768/879/880/907/1440px in both themes. The 880px switch is retained. Mobile title/icons/description stacking and 36px tiles measured. Return caption fits the diagram at 319px and 200% root text size.
- Marquee hover continues; keyboard Enter toggles pause/resume; reduced-motion and JavaScript-disabled views retain four steps and all 14 sources. Repeated full visits do not accumulate visible tracks. The current Shell uses full document navigation, not Astro ClientRouter; the actual navigation path was exercised. Disposal hooks remain for future Astro navigation support.
- Old index aliases and detail redirects preserve query strings with 301 responses. Valid work detail 200; hidden/unknown detail 404. The first test found an Astro rewrite 500, repaired by shared detail/404 components.
- Turbo dry-run input inventory includes 26 canonical content files. RSS `lastBuildDate` is `Tue, 14 Jul 2026 00:00:00 GMT`, matching the newest published essay.

Outstanding gates:

1. Review and approve the systems proposal, then proceed homepage → work index/details → writing index/essays. No batch approval is assumed.
2. Resolve factual claims, media permissions and remaining source questions. The broken options-pricing source button is now omitted because the replacement repository is private; project visibility is unchanged.
3. Finish human visual review beyond the automated dimensions. Keyboard-visible pause focus is a 2px outline; mobile pause and footer targets are at least 44px. Development toolbar overlays are not production UI. Browser QA finished at 1440px in a regular viewport; the in-app device toolbar was not changed.
4. Rerun `pnpm check:changed`/full validation for the final committed tree. Push the branch and open a same-repository PR after checking publication readiness of its content.
5. Re-read exact-head required checks and live provider protections. Review actual target classification and route-change gates. No merge/deploy bypass.
6. Record PR, merged SHA, release run, executed/skipped targets, production routes and rollback SHA. Current known-good baseline: `2451782dfe1599c642b1f75d39623e4ec9e592ce`, deployment run `34153601249`.
7. Return the canonical checkout to updated main after integration. Retire only verified integrated or recoverably preserved agent worktrees. Leave remaining maintenance with priority and next action.

There has been no production deployment, remote migration, issue comment/closure, dependency merge, or destructive workspace cleanup in this implementation batch. The review branch is backed up remotely; main and production remain on the previous release.
