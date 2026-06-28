# public-site content editor brief

this is the content shape that should feed the next admin editor pass. it stays scoped to public-site content and does not prescribe the admin thread's implementation architecture.

Admin v2 architecture lives in `docs/admin-v2-architecture.md`. This file is
the public-site content inventory that the admin route should read first.

The next implementation slice is a read-only `/content` admin route. It should
show what can become editable without adding save behavior, outbound publishing,
or any live write path.

## current inventory

| surface               | source                                                                                                                                                                                                                                                      | current shape                                                                                                    | notes                                                                                                                                                              |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| homepage hero         | D1 `page_content:home`, seeded by `drizzle/migrations/0010_seed_home_page_content.sql`, `0013_seed_homepage_proof_cards.sql`, and `0014_seed_homepage_making_slugs.sql`, fallback `apps/www/src/data/site.ts`, rendered in `apps/www/src/pages/index.astro` | heading, summary, proof cards, ordered making slugs, press mention, inline links                                 | D1 controls safe heading, section metadata, proof cards, and homepage project ordering; rich linked summary stays source-backed until inline mention schema exists |
| project cards         | `apps/www/src/content/projects/*.md`                                                                                                                                                                                                                        | title, subtitle, description, year, category, role, duration, status, featured, visible, sort order, links, tags | source is already markdown-backed and editor-ready                                                                                                                 |
| project detail pages  | same project markdown body plus optional `technical` and `roadmap` arrays                                                                                                                                                                                   | overview, technical blocks, next steps                                                                           | only quantercise has meaningful body sections today                                                                                                                |
| writing previews      | `apps/www/src/content/writing/*.md`                                                                                                                                                                                                                         | title, slug, summary, tags, status, published date, body                                                         | five published posts, mostly claude code and ai workflow                                                                                                           |
| newsletter block      | D1 `page_content:newsletter`, seeded by `drizzle/migrations/0009_seed_newsletter_page_content.sql`, fallback `@anipotts/lib/cms` defaults and `NewsletterSubscribe` props                                                                                   | headline, deck, CTA label, success text, error text, footer, email form                                          | reader path exists; D1 seed matches current source defaults                                                                                                        |
| archived making notes | `docs/archive/labs/content/**`                                                                                                                                                                                                                              | old weekly digests and experiments                                                                               | reference only, not an active public-site content source                                                                                                           |

Admin `/content` now renders the D1 `page_content` rows and bundled read-only
metadata from the project and writing markdown collections. It still does not
add a save endpoint, publish endpoint, provider sync, or source file mutation.
The D1 review queue includes inert homepage, newsletter, project, and writing
operations seeded by `drizzle/migrations/0008_seed_content_draft_operations.sql`
and `drizzle/migrations/0011_seed_source_content_review_operations.sql`.

## highest-leverage cleanup batch

| priority | cleanup                                                 | why it matters                                                                           | owner fit                     |
| -------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------- |
| p0       | keep homepage proof cards D1-visible in admin           | above-fold credibility now depends on four concrete engineering receipts                 | admin editor                  |
| p0       | keep homepage making selection D1-visible in admin      | homepage project ordering should be content state, not page code                         | admin editor                  |
| p0       | expose project card fields in admin                     | shipping cards still carry the browsable proof trail                                     | admin editor                  |
| p0       | add `body` editing for project detail pages             | several projects have no narrative beyond a card                                         | admin editor                  |
| p1       | add writing preview controls                            | titles and summaries are the actual newsletter backfill queue                            | admin editor                  |
| p1       | add newsletter headline, deck, cta, and status messages | these fields now have a D1 page-content source and need audited operations before writes | admin editor                  |
| p2       | decide canonical project source                         | markdown and `packages/lib/src/data/projects.ts` duplicate similar facts                 | admin editor plus site thread |
| p2       | classify old posts before publishing to the newsletter  | current writing can seed the newsletter, but should not be auto-sent                     | newsletter thread             |

## first read-only admin slice

The first admin implementation should not edit content. It should render a
content inventory table that helps Ani and agents decide what can safely become
editable later.

Rows should include:

| field                | source                       | purpose                                      |
| -------------------- | ---------------------------- | -------------------------------------------- |
| `surface`            | route or component           | homepage, projects, writing, newsletter      |
| `source_ref`         | file path or record id       | points to current source truth               |
| `current_value`      | rendered text or field value | what the public site currently uses          |
| `editability`        | enum                         | `ready`, `needs_schema`, `needs_owner`       |
| `risk_level`         | enum                         | public-site copy risk, not admin write risk  |
| `next_safe_action`   | text                         | branch/PR cleanup or keep read-only          |
| `required_authority` | array                        | empty for read-only, populated before writes |
| `proof_ids`          | array                        | route, screenshot, content file, or record   |

The route should group content by homepage, projects, writing, and newsletter.
It should not include credentials, outbound publishing controls, social APIs, or
hidden admin write endpoints.

## recommended admin schema

### projects

| field         |         type | required | editorial note                                                           |
| ------------- | -----------: | -------: | ------------------------------------------------------------------------ |
| `title`       |       string |      yes | display title, lowercase unless the proper noun needs casing             |
| `status`      |         enum |      yes | `live`, `wip`, `archived`                                                |
| `year`        |       string |      yes | supports ranges like `2024-`                                             |
| `tags`        | string array |      yes | editor should allow ordering because cards show the leading visible tags |
| `summary`     |       string |      yes | short card line, maps cleanly to existing `subtitle`                     |
| `body`        |     markdown |       no | project detail narrative                                                 |
| `link_labels` |       object |       no | explicit labels for live, repo, npm, demo, case study                    |
| `role`        |       string |       no | useful for work vs personal projects                                     |
| `featured`    |      boolean |       no | controls homepage cards                                                  |
| `sort_order`  |       number |       no | keep for deterministic ordering                                          |

### homepage proof cards

| field    |   type | required | editorial note                                                                    |
| -------- | -----: | -------: | --------------------------------------------------------------------------------- |
| `label`  | string |      yes | short surface name, for example `structured ai` or `quantercise`                  |
| `href`   |    url |      yes | can be internal or external                                                       |
| `title`  | string |      yes | one concrete engineering outcome                                                  |
| `detail` | string |      yes | mention stack, constraint, proof, and link target without turning it into ad copy |

### writing

| field          |         type |           required | editorial note                                         |
| -------------- | -----------: | -----------------: | ------------------------------------------------------ |
| `title`        |       string |                yes | preserve ani's original phrasing, clean only the tells |
| `date`         |         date | yes when published | maps to `published_at`                                 |
| `tags`         | string array |                yes | visible on rows and detail pages                       |
| `preview`      |       string |                yes | maps to `summary`, should be one line                  |
| `body`         |     markdown |                yes | canonical article body                                 |
| `source_links` |        array |                 no | repo, post, press, screenshot, demo, or gist evidence  |
| `status`       |         enum |                yes | `draft`, `scheduled`, `published`                      |
| `project`      |       string |                 no | connects posts to project records                      |

### newsletter

| field             |   type | required | editorial note                                                              |
| ----------------- | -----: | -------: | --------------------------------------------------------------------------- |
| `headline`        | string |      yes | default label can stay `newsletter`                                         |
| `deck`            | string |      yes | current promise: notes on agent workflows, product builds, and broken parts |
| `cta_label`       | string |      yes | current label: `subscribe`                                                  |
| `success_message` | string |      yes | current message: `subscribed. check your inbox.`                            |
| `error_message`   | string |      yes | current message: `could not subscribe. try again in a minute.`              |
| `buttondown_url`  |    url |       no | legacy field name; current value points to `news.anipotts.com`              |

The canonical editable source is D1 `page_content` with `page_key =
newsletter`, normalized by `@anipotts/lib/cms`. `NewsletterSubscribe.astro`
remains a rendering component and fallback prop surface, not the long-term
editable source.

Current production D1 has published `home` and `newsletter` page rows. The next
safe step is to keep migrating high-value public copy into reviewed content
records without adding an untracked save path.

## newsletter backfill options

do not invent fake archives. these are candidates from existing work and should be published only after ani or the newsletter thread confirms source artifacts.

| candidate                             | classification             | source basis                                                   | next editorial move                                                          |
| ------------------------------------- | -------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| the claude code session monitor       | publish now                | existing post: `i-built-a-monitor-for-my-claude-code-sessions` | tighten title and add a current screenshot or repo link if available         |
| saturdays are for claude code         | rewrite from existing post | existing business insider response post                        | shorten the press setup and make it a newsletter note                        |
| stop ending your day with fix the bug | publish now                | existing post with concrete workflow advice                    | canonical `/writing` links are now in source content                         |
| imessage mcp local analytics          | draft from scratch         | project card plus repo/npm links                               | write from implementation notes, privacy model, and local sqlite constraints |
| quantercise migration notes           | draft from scratch         | project card plus roadmap                                      | focus on aurora to neon, lambda sandboxing, and grading edge cases           |
| pgi research portal rebuild           | draft from scratch         | project card                                                   | needs source detail before claiming analyst workflow outcomes                |
| business insider limits follow-up     | rewrite from existing post | existing press post plus live claude stats                     | update numbers only from current generated stats                             |
| site rebuild notes                    | draft from scratch         | astro cutover commits and public repo diff                     | use the rebuild as a concrete note on moving from old production to astro    |

## article ideas

| idea                                                           | angle                                                                          | proof artifact to attach                                  |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------- |
| how i hand off work between codex and claude code              | filesystem handoffs, git commits, and repo rules as shared memory              | `AGENTS.md`, handoff doc example, commit diff             |
| the imessage mcp privacy model                                 | local-only reads, sqlite constraints, and why write access is excluded         | repo readme, npm package, schema notes                    |
| what quantercise taught me about grading code                  | answer specs, tolerance windows, python sandboxing, and math rendering         | code snippets, problem examples, lambda logs if safe      |
| rebuilding anipotts.com without making it a portfolio shrine   | astro content collections, terse copy, and page sections that map to real work | cutover commit, old archive path, before/after screenshot |
| business insider got the limits right, but missed the workflow | limits as a forcing function for smaller sessions and better prompts           | article link, claude stats page                           |
| pgi research portal as a mobile-first analyst surface          | RSS aggregation and event monitoring for macro research                        | project screenshot, data model, safe demo                 |
| running agents needs observability before autonomy             | session logs, tool-call patterns, stuck-session detection                      | claudemon notes, stats page, chart screenshot             |
| why project cards need receipts                                | replacing vague product copy with stack, status, role, and links               | this content cleanup diff                                 |

## open questions

| question                                                                                                      | why it matters                                                                    |
| ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| should project `subtitle` be renamed to `summary` in the editor while staying mapped to markdown frontmatter  | editor copy should match how ani thinks about cards                               |
| should writing stay file-backed or move into D1 first                                                         | admin currently edits D1 thoughts, while www uses astro content collections       |
| should the first newsletter copy write route require Ani approval every time or only when risk is medium/high | the source is D1 `page_content`; the remaining decision is write authority policy |
