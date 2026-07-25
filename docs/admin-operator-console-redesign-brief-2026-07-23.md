# admin operator console redesign brief

status: visual direction review

date: 2026-07-23

owner: `chief/site`

lane: `site/admin`

source branch: `codex/pro/admin-home-lifecycle-2026-07-22`

source checkpoint: `ab210add5df58c9219cd96173a7b5c31eb17d8cf`

review branch: `codex/pro/admin-operator-console-design-2026-07-23`

local preview inspected: `http://127.0.0.1:4311/`

## outcome

Turn `admin.anipotts.com` into Ani's compact agent-native operating console.
The first screen should answer within seconds:

- what needs Ani
- what is actively being handled
- what is waiting externally or blocked
- what is idle, stale, or unknown
- what just completed
- where the exact source and proof live

Inbox remains the only attention queue. Work, Content, Life, Fleet, Knowledge,
and System retain their own truth and domain-native interaction. Activity is
evidence linked to an entity, never a second queue.

The current lifecycle contract remains intact:

- `/` and `/inbox` return the same authenticated Inbox projection
- one entity has at most one unresolved attention item for the same required
  human action
- resolving attention updates the underlying entity projection
- projects and domain systems retain truth
- Codex, Claude, ChatGPT, GitHub, and handoffs are sources or execution surfaces
- archive remains searchable and restorable
- runtime, lifecycle, attention, and freshness remain separate state dimensions

## canonical Infra knowledge contract

The fixture prototype consumes the sanitized Admin projection from canonical
Infra main. It does not import raw source records or create a competing schema.

Contract source:

- Infra PR: `#10`
- merged commit: `8696dfd7ea70479679aa6dad643aaaec1714ab09`
- source registry: `memory/schema/knowledge-sources.yml`
- card schema: `memory/schema/knowledge-card.schema.json`
- fixture cards: `memory/schema/fixtures/knowledge-cards.yml`
- sanitizer: `memory/interfaces/cli/knowledge_cards.py project-admin`

Pinned source hashes:

| source                                       | sha-256                                                            |
| -------------------------------------------- | ------------------------------------------------------------------ |
| `memory/schema/knowledge-sources.yml`        | `c10a0d804b577ca8132744250f4c941c44d0c8ef64f389b18be284c3ddb175e0` |
| `memory/schema/knowledge-card.schema.json`   | `22f612421d92086f74d0b20067751206673119037fd7eed228b583b547741ee1` |
| `memory/schema/fixtures/knowledge-cards.yml` | `f2a525b4582d75bf530a1ccc062c655ea5a659e81ab4c0857ffe48f72a73de2b` |
| `memory/interfaces/cli/knowledge_cards.py`   | `3fc060819771ff210798381f91331bbeff2b82c891fdb6f746448f2642675128` |

The `project-admin` output is the UI boundary. Every projected card always
includes stable identity and routing:

- `card_id`
- `knowledge_ref`
- `entity_ref`
- `domain`
- `area`
- `kind`
- `source_id`
- `mode`

Allowed display fields are added only when both the source policy and projection
mode permit them. These may include title, freshness, bounded current summary,
current assertion reference, retrieval instructions, source locator, proof
references, or lineage references.

The UI must not reconstruct omitted fields from the raw fixture. In particular:

- `closed` cards do not enter Admin
- `intimate` cards are metadata-only at most
- metadata-only cards never expose `current_summary`
- source locators, proof refs, and lineage refs appear only when the sanitized
  projection emits them
- a missing observation remains unknown, never healthy
- conflicting sources stay conflicting until stronger proof resolves them

### fixture mapping

| domain  | projected fixture                                   | native presentation rule                                                                  |
| ------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Work    | `Admin redesign in progress` from Codex             | show bounded activity, current freshness, source identity, and a route to the Work entity |
| Content | `Social message needs review` from social platforms | show metadata-only inbound review without sender, body, attachment, or inferred urgency   |
| Life    | `Life context updated` from Brain                   | show current status and assertion reference without exposing the private value            |
| Fleet   | `ap-mini durable runtime` from Infra memory         | show bounded host summary, exact freshness, and allowed proof or locator fields           |
| System  | `Source contradiction requires review` from Admin   | show conflicting state and a comparison action without silently choosing a source         |

Knowledge search may retrieve these cards across domains. Their primary
representation still belongs to the native domain view.

### forbidden Admin payload

Never copy these into Admin fixtures, browser state, D1, screenshots, or design
examples:

- private values or closed records
- social message bodies, sender details, or attachments
- raw prompts or transcripts
- health measurements or care values
- finance balances, transactions, or exact receipts
- credentials, tokens, secrets, private keys, or provider payloads

The prototype may display safe titles, freshness, projection mode, source
identity, bounded summaries, proof state, and retrieval actions exactly as
emitted by `project-admin`.

## audit scope

The combined UX and screenshot accessibility audit covered the current local
fixture preview at an `834 x 939` viewport. It included Inbox, Work, Knowledge,
Life, Fleet, and Content. The source was inspected alongside the rendered
surfaces.

Fresh captures:

1. [Inbox viewport](design/admin-operator-console/audit/01-inbox-viewport-834x939.png)
   and [full page](design/admin-operator-console/audit/01-inbox-834x939.png)
2. [Work viewport](design/admin-operator-console/audit/02-work-viewport-834x939.png)
   and [full page](design/admin-operator-console/audit/02-work-834x939.png)
3. [Knowledge viewport](design/admin-operator-console/audit/03-knowledge-viewport-834x939.png)
   and [full page](design/admin-operator-console/audit/03-knowledge-834x939.png)
4. [Life viewport](design/admin-operator-console/audit/04-life-viewport-834x939.png)
   and [full page](design/admin-operator-console/audit/04-life-834x939.png)
5. [Fleet viewport](design/admin-operator-console/audit/05-fleet-viewport-834x939.png)
   and [full page](design/admin-operator-console/audit/05-fleet-834x939.png)
6. [Content viewport](design/admin-operator-console/audit/06-content-viewport-834x939.png)
   and [full page](design/admin-operator-console/audit/06-content-834x939.jpg)

Observed document heights:

| surface   | document height | audit health                                   |
| --------- | --------------: | ---------------------------------------------- |
| Inbox     |        7,207 px | poor for rapid triage                          |
| Work      |        1,275 px | structurally useful, weak for current activity |
| Knowledge |        4,472 px | retrieval works, policy dominates              |
| Life      |        1,265 px | calm but not operational                       |
| Fleet     |          993 px | readable placeholder, insufficient state       |
| Content   |       17,529 px | unusable as an editorial inventory             |

No audited route had horizontal document overflow at this viewport. This only
proves `scrollWidth === clientWidth` for the captured state.

## what already works

- The fixture lifecycle model preserves one entity with several source records.
- Runtime state is already shown separately from durable lifecycle state in
  Work.
- Loose conversations are preserved and collapsed.
- `/` is the current canonical Inbox route, with `/inbox` compatibility in the
  shell logic.
- Instrument Sans, the current brand blue, light/dark theme tokens, and an
  existing desktop side-navigation foundation are present.
- Existing Content editor, preview, drafts, carousel, newsletter, operation,
  Proof, Deploy, Repo, Handoff, Mutation, and destructive-gate routes provide
  real destination structure to preserve.
- Empty, partial, stale, unknown, unavailable, and conflict vocabulary already
  exists in data contracts.

## structural teardown

### repeated explanation displaces decisions

The current pages explain their architecture every time Ani visits. Primary
content includes phrases such as:

- `One current attention projection`
- `source → entity → outcome → attention → history`
- `adapter writes and native archive actions are disconnected`
- `sanitized metadata, lineage, proofs, freshness, and receipts`
- `card → bounded proof → canonical source`
- `read only / 1200 token default`
- `bounded pointers only`

These are useful implementation facts. They belong in help, tooltips, or the
entity inspector unless they change the current operator decision.

### page identity is repeated

The shell, `admin.anipotts.com` eyebrow, route title, deck, meta strip, section
eyebrow, and section heading often repeat the same information. Keep one clear
route identity, one compact material-status strip when needed, then begin the
work.

### pills are carrying too much meaning

Navigation, filters, counts, data modes, fixture state, freshness, and theme
switching all appear as rounded text pills. Reserve badges for exceptional
state. Use conventional navigation, segmented filters, status dots, rows,
dividers, icons, and aligned labels for normal information.

### one generic container vocabulary flattens every domain

The current implementation leans on `table-card`, `record-row`, meta strips,
field grids, and bordered nested panels. Reusing those containers across all
surfaces makes Knowledge, Life, Work, and Content feel like the same database
browser. Shared shell and shared semantics should not force one representation.

### long locators and prose expand the interface

Source locators, errors, summaries, retrieval instructions, full frontmatter,
body previews, and next actions expand cards vertically. Primary rows should
truncate safely. Full identifiers and history belong in the inspector.

### shell behavior is inconsistent at the audited width

Desktop already has a side navigation, but the `900px` breakpoint changes an
`834px` viewport into a horizontally scrolling row of seven peer links plus a
text theme control. The redesign needs a stable desktop shell and a real compact
mobile pattern instead of turning navigation into filter pills.

## route audit

### 1. Inbox

health: poor

The first viewport shows the route explanation, six meta pills, another
explanation card, filters, and global history search. Ranked attention is below
the fold. The twelve items Ani needs to triage are therefore not the main thing
on the page.

The full document repeats sticky navigation during the full-page capture and
extends to 7,207 px. Global history results precede the attention queue.
Archive review also lives below the daily queue even though it is Work or System
governance.

Redesign requirement:

- lead with the top four ranked attention actions
- show domain icon, title, why Ani is needed, owner, due or wait time, current
  activity, and one primary action
- make the row open the native domain view and the same entity inspector
- keep domain as an icon or filter, never a separate queue
- move history search into the persistent global search or command trigger
- move archive proposals into Work or System

### 2. Work

health: mixed

The entity and attached-source model is correct. One migrated task visibly
connects Codex, ChatGPT export, and GitHub sources, and loose chats remain
collapsed. The page mostly proves lineage, however. It does not tell Ani what
agents are doing now, what is waiting, or what needs review.

Redesign requirement:

- organize current entities by `working`, `review`, `waiting external`,
  `blocked`, `idle/stale`, `recently completed`, and `unknown`
- show provider, runtime, host, project, current or next action, and exact last
  observation in dense grouped rows or a compact board
- open proof, native ids, cwd or repo, lineage, attached sources, outcomes, and
  history in the entity inspector
- never infer `working` from transcript recency

### 3. Knowledge

health: poor

Search is present and the underlying cards contain useful source, freshness,
access, and proof data. A large retrieval-contract panel and extensive
instructions appear before results. Each result mixes current facts with
context budgets, reveal policy, retrieval instructions, locators, proof, and
lineage.

Redesign requirement:

- make search the first control
- return a compact list with title, kind, source mark, freshness, effective
  date, supersession state, and one-line current fact
- open detailed retrieval instructions and raw locators in inspect/help
- use Knowledge as global retrieval, not a top-level essay

### 4. Life

health: poor

The page is calm and keeps Health status-only and Aesthetics small. Its primary
content is a list of Brain, Rudy, finance, health, and Notes architecture
pointers. It does not show today's schedule, active personal loops, recent
verified changes, people, commitments, or linked attention.

Redesign requirement:

- organize around time and current areas
- show today's schedule, current loops, people or commitments, recent verified
  changes, linked attention, and source freshness
- keep Health status-only and Aesthetics as a small private reference area
- keep private details local and reveal only status at this layer
- move Brain and Rudy architecture into Knowledge or inspect

### 5. Fleet

health: poor

The page is a two-row table with owner, status, and evidence prose. It does not
show reachability, disk pressure, repository drift, service health, running
agents, last reconciliation, protected exceptions, or material contradictions.

Redesign requirement:

- use machine cards only for `ap-pro` and `ap-mini`
- add service, repo, and runtime health matrices
- show live, stale, unknown, or protected state with exact observation time
- surface pressure trends, drift, and contradictions
- keep full topology and protected exceptions in inspect

### 6. Content

health: poor

The route renders a 17,529 px source dump. Workflow destinations are stacked as
large bordered rows. Frontmatter, body previews, source refs, field grids, and
operation metadata expand every record. Visual media has no thumbnail-led
representation.

Redesign requirement:

- use a dense writing inventory for text content
- use thumbnails and a visual grid or filmstrip for images, video, and
  carousels
- show piece type, channel, stage, review state, publish state, due date, and
  focused view, edit, review, or preview actions
- open frontmatter, sources, operation history, and proof in a detail view
- keep the existing editor, review, preview, drafts, carousel, newsletter, and
  operation routes reachable

## domain-native interface contract

Each domain needs a representation native to its work.

| domain    | primary representation                                                |
| --------- | --------------------------------------------------------------------- |
| Inbox     | one ranked action feed or table optimized for rapid triage            |
| Work      | grouped activity rows or a compact operator board                     |
| Content   | writing inventory plus visual grid or filmstrip for media             |
| Life      | time and area overview with schedule, loops, changes, and commitments |
| Fleet     | two host cards plus health matrices, pressure, drift, and topology    |
| System    | logs, tables, and timelines for diagnostics and governance            |
| Knowledge | search-first current-fact result list                                 |

The domains share only interactions that are genuinely shared:

- source mark
- status dot
- attention badge
- relative and absolute time
- proof link
- entity inspector
- search field
- segmented filter
- icon button
- empty, loading, stale, disconnected, partial, conflict, and error states

Component reuse must not flatten the information architecture.

## first screen composition

### shell

- stable left navigation on desktop
- compact bottom bar or menu on mobile
- Inbox selected by default
- persistent global search or command trigger
- icon plus label for destinations
- icon-only theme and utility actions with tooltips
- one selected state

### status strip

Show only material signals:

- host reachability
- reconciliation freshness
- critical contradictions

### ranked attention

The first viewport must show the top four actions without scrolling. A row
contains:

- domain icon
- title
- why Ani is needed
- owner
- due time or external wait
- current activity
- one primary action

The domain summary deep-links into the native domain view and opens the same
entity inspector. Resolving there resolves the one underlying attention item.

### being handled

Show current agent activity only when it maps to an existing Inbox or Work
entity. It is a projection of the same entities, not another queue.

### secondary states

Use collapsed `waiting`, `idle/stale`, and `recently completed` groups with
counts and exact last-observed time.

### inspector

Use a drawer for:

- source identities and provider marks
- proof refs
- raw locators
- lifecycle and attention history
- receipts and restoration links
- native ids, host, project, cwd, and repo
- advanced policy and archive confidence

## state semantics

Operator state:

- `working`
- `waiting external`
- `blocked`
- `review`
- `idle/stale`
- `completed`
- `unknown`

Lifecycle remains only `open`, `completed`, or `archived`.

Freshness and reconciliation remain separate. Exact last-observed time is
always available. Stale thresholds come from policy, never a UI guess.

Provider identity answers where an observation came from. A state glyph answers
what is happening. Short text identifies the entity. Provider color must not
encode runtime or attention state.

## icon and source-mark system

Create one local source-mark component and one icon registry.

Provider identity may use approved, localized OpenAI or Codex, Anthropic or
Claude, GitHub, Cloudflare, Gmail, Calendar, Drive, browser, terminal, repo,
handoff, message, and human-owner marks where the icon prevents repeated words.

Use Lucide for generic navigation, state, and actions. Every icon-only control
needs a tooltip, accessible label, visible keyboard focus, and a minimum target
of `36px` on desktop or `44px` on mobile.

Do not hotlink, hand-draw provider logos, use emoji, or invent provider marks.

## visual system

- Instrument Sans for interface text
- existing `#61abea` brand blue as a restrained accent
- current near-black, white, and muted surface tokens
- spacing based on 4px and 8px increments
- controls between 36px and 40px on desktop
- cards at 8px radius or less
- stable columns and predictable row density
- hierarchy through type, alignment, spacing, and dividers
- no marketing-scale headings, gradients, decorative graphics, or blue wash
- one clear primary action per context
- destructive controls isolated inside System governance

## accessibility requirements

The visual audit cannot prove keyboard behavior, semantics, zoom, contrast,
motion preferences, or screen-reader output. Prototype verification must cover:

- semantic tables, lists, navigation, dialogs, and status announcements
- logical keyboard order and a visible focus indicator
- `44px` mobile targets
- tooltip and screen-reader names for icon-only controls
- reduced-motion behavior
- contrast in both themes
- `200%` zoom and reflow
- no clipped labels, long errors, source locators, or titles
- loading, empty, stale, disconnected, partial, conflict, and error states

## routes that remain reachable

The redesign must preserve:

- `/` and `/inbox`
- `/work`
- `/knowledge`
- `/content`
- `/content/review`
- `/content/drafts`
- `/content/edit/[pageKey]`
- `/content/preview`
- `/content/carousels`
- `/content/operations`
- `/newsletter`
- `/newsletter/[slug]`
- `/life`
- `/life/health`
- `/life/aesthetics`
- `/fleet`
- `/proof`
- `/deploys`
- `/repos`
- `/handoffs`
- `/mutations`
- `/ops/destructive`
- `/auth/passkey`

System owns auth, deploys, repos, handoffs, proofs, mutations, receipts, and
destructive gates. It does not become another Inbox domain or duplicate Fleet.

## fixture prototype boundary

The selected visual direction will be implemented against fixtures only.

Closed gates:

- no merge
- no production migration
- no deployment
- no Access or auth change
- no provider or outbound action
- no publish write
- no native task or chat archive
- no source deletion
- no live adapter
- no enabled write control

Infrastructure contract changes remain owned by `chief/infra`. UI needs must be
returned as bounded typed-seam requests rather than invented backend truth.

## prototype acceptance

After Ani selects one visual direction:

- implement Inbox, Work activity, Knowledge search, Life, Fleet, Content, and
  the shared entity inspector against fixtures
- provide desktop and `390 x 844` mobile captures
- keep the top four Inbox actions visible without scrolling on desktop
- render one active Codex task, one Claude source, one GitHub source, one
  handoff, and one loose chat with correct identity
- prove activity does not create a duplicate Inbox item
- keep all existing product routes reachable
- verify focused tests, admin typecheck, admin build, route parity, privacy,
  keyboard order, target sizes, and responsive overflow
- report the exact source branch, commit, screenshots, accessibility limits,
  and every mutation gate left closed
