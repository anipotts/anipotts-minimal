# newsletter system

goal: `news.anipotts.com` is ani-owned newsletter infrastructure. buttondown is
not canonical. there are no existing buttondown subscribers to migrate, so the
buttondown import path is intentionally skipped until ani says otherwise.

## source checks

- cloudflare queues support producer bindings, consumer handlers, batch delivery,
  explicit `ack()`, `retry()`, delayed retries, and dead-letter queues.
- d1 schema changes are versioned as sql migration files and applied with
  wrangler against local or remote databases.
- resend requires a verified sending domain for professional delivery, supports
  custom headers, batch sends, idempotency keys, webhooks signed with svix
  headers, and events for delivered, bounced, complained, failed, delayed,
  opened, clicked, and suppressed email.
- one-click unsubscribe uses `List-Unsubscribe` plus
  `List-Unsubscribe-Post: List-Unsubscribe=One-Click`; the POST target should
  stop mail within 48 hours and return a blank success response.

## shape

`apps/www` owns the user-facing surface:

- `https://news.anipotts.com/` serves the newsletter landing page.
- `/archive` serves a first-party archive shell backed by d1 issues.
- `/api/newsletter/subscribe` validates, rate-limits, creates a pending
  subscriber, creates a double opt-in token, and queues a confirmation email.
- `/api/newsletter/confirm` verifies the token and moves the subscriber to
  `confirmed`.
- `/api/newsletter/unsubscribe` handles GET for the human page and POST for
  one-click unsubscribe.
- `/api/newsletter/webhooks/resend` records signed resend events and updates
  suppressions for bounces, complaints, and resend suppressions.

`workers/newsletter` owns async sending:

- consumes the `newsletter-send` queue.
- sends confirmation emails and issue deliveries through resend.
- records sends, failures, resend ids, and delivery attempts in d1.
- retries transient failures through queues and lets cloudflare move exhausted
  messages to `newsletter-send-dlq`.

## data model

tables added by `drizzle/migrations/0005_newsletter_system.sql`:

- `newsletter_subscribers`: one row per email. status is `pending`,
  `confirmed`, `unsubscribed`, or `suppressed`.
- `newsletter_preferences`: per-subscriber topic and format choices.
- `newsletter_issues`: draft, scheduled, published, or archived issues.
- `newsletter_deliveries`: one delivery attempt per subscriber and issue or
  transactional message.
- `newsletter_events`: append-only audit trail for subscribe, confirm,
  unsubscribe, send, webhook, and migration events.
- `newsletter_tokens`: hashed double opt-in and unsubscribe tokens.
- `newsletter_suppressions`: local suppression list from user action, bounce,
  complaint, resend suppression, or manual admin action.

## resend

required secrets and vars:

- `RESEND_API_KEY`: worker secret on `apps/www` and `workers/newsletter`.
- `RESEND_WEBHOOK_SECRET`: worker secret on `apps/www`.
- `NEWSLETTER_FROM`: non-secret var, default `Ani Potts <news@anipotts.com>`.
- `NEWSLETTER_REPLY_TO`: non-secret var, default `contact@anipotts.com`.
- `NEWSLETTER_BASE_URL`: non-secret var, `https://news.anipotts.com`.
- `NEWSLETTER_MAILING_ADDRESS`: protected worker secret or admin setting. use
  ani's business smllc address for production sends, but never hardcode it in
  repo source.

resend setup gate:

- add and verify the sending domain or subdomain in resend.
- add generated dkim and spf records in cloudflare dns.
- keep dmarc at `p=none` until test sends pass, then tighten deliberately.
- create a resend webhook for `https://news.anipotts.com/api/newsletter/webhooks/resend`
  with delivery, bounce, complaint, failure, delay, click, open, sent, and
  suppressed events.

## compliance

- double opt-in is mandatory before `confirmed`.
- every broadcast delivery gets `List-Unsubscribe` and
  `List-Unsubscribe-Post` headers.
- broadcast sends are blocked unless the mailing address config is present.
  confirmation emails can still be mocked or sent as transactional mail.
- user unsubscribe, bounce, complaint, and resend suppression all create a local
  suppression row and stop future sends.
- webhooks are rejected unless `RESEND_WEBHOOK_SECRET` is configured and svix
  verification passes.
- subscribe uses origin checks, d1 sliding-window rate limiting, zod email
  validation, and a hidden honeypot field.
- tokens are stored as sha-256 hashes, not raw tokens.

## admin handoff

the admin editor thread should expose these actions against d1 and the queue:

- issue create/update from a thought or raw markdown.
- preview rendered html and plain text.
- send test to ani.
- publish now or schedule.
- enqueue deliveries for confirmed, non-suppressed subscribers.
- issue analytics: queued, sent, delivered, bounced, complained, opened,
  clicked, unsubscribed.
- subscriber list with status, source, created date, confirmed date, and
  suppression reason.
- optional historical archive import if ani later wants buttondown content moved
  into d1.

do not keep writing new buttondown drafts as the canonical flow. existing
buttondown fields can stay for migration and historical lookup until the admin
thread removes them intentionally.

## migration from buttondown

there are no current buttondown subscribers to migrate. skip subscriber import
for phase 1. do not delete buttondown data or settings; leave it available as a
historical export source only.

if ani later identifies buttondown archive content worth preserving, import it
as `newsletter_issues` with `source='buttondown'` metadata after a csv/export
review.

## inbound email

phase 1 keeps replies human-owned by sending with `reply_to:
contact@anipotts.com`. subscription state is handled through confirmation,
manage, and unsubscribe links, not email commands.

phase 2 can add inbound automation for `news@anipotts.com` or a safer
subdomain inbox. before any implementation, audit current mx records, cloudflare
email routing, resend inbound routing, and existing aliases for `anipotts.com`.
root-domain mail already exists, so do not add resend inbound or cloudflare
email workers in a way that changes current root mail delivery.

the inbound worker design is:

- receive a signed resend `email.received` webhook or a cloudflare email worker
  event after routing is proven safe.
- normalize the sender and look up `newsletter_subscribers`.
- reply with already subscribed plus manage/unsubscribe link, confirmation
  pending plus confirm link, or not subscribed plus subscribe link.
- record inbound events in `newsletter_events`; never treat inbound commands as
  the primary unsubscribe path.

## rollout gates

- local d1 migration applies.
- `pnpm --filter @anipotts/www build` and typecheck pass.
- `pnpm --filter @anipotts/newsletter-worker typecheck` passes.
- local subscribe creates pending subscriber and token without a resend secret.
- local confirm moves a subscriber to `confirmed`.
- local unsubscribe POST returns 200 and suppresses the subscriber.
- remote d1 migration is applied only after ani approves.
- queue, dlq, and worker bindings exist before any production subscribe page is
  promoted.
- resend domain and webhook are verified before any non-test broadcast.
- `NEWSLETTER_MAILING_ADDRESS` is configured before any broadcast send.
- inbound mail changes wait for a root-domain mail route audit.
