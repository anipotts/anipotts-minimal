# trustworthy releases

The repository has one release classifier and five GitHub workflows. CI proves
the current pull request head. Merging remains an explicit native Codex action
bound to that same head.

## required checks

- `Build, lint, typecheck, test`
- `Security Review`
- `Migration Preflight`

`main` must be current before merge and unresolved review conversations must be
closed. GitHub enforces all three checks for administrators too. The release
classifier still identifies protected and unknown changes, but it does not ask
for a duplicate comment, label, review, or receipt.

The retained merge-readiness workflow is read-only. It never merges, edits a
pull request, or creates an approval label. After the required checks pass, an
agent uses one exact-head native merge command. This keeps normal work moving
from chat while the consequential shared-history effect remains visible in the
Codex approval surface. Deployable files use a PR. Manual deployment is limited
to Ani, the exact supplied main SHA, and the main branch.

## release classes

Automatic changes include ordinary app code inside existing routes, static
content, presentation, and future migrations whose SQL and manifest prove an
additive operation.

Protected changes include auth, Worker configuration, workflow permissions,
new or removed routes, cron, queues, Durable Objects, outbound workers, secrets
contracts, destructive SQL, data rewrites, and the release policy or migration
manifest themselves. An unclassified path fails closed.

The classifier emits affected targets, D1 impact, migration consumers, risk,
approval need, release ID, and exact source SHA. CI and deployment use the same
module.

## D1 boundary

`apps/admin` is the only migration owner. Its D1 binding points at the governed
repository migration directory, while remote application remains disabled
because production has no verified Wrangler ledger. Replaying historical files
would be unsafe.

The manifest records immutable hashes for the 40 historical files and a
read-only production schema fingerprint. The August 5 query observed 55 tables,
74 indexes, 6 triggers, and zero rows written. Wrangler schema export was not
available because the database contains FTS5 virtual tables, so the fingerprint
uses normalized `sqlite_master` metadata.

Remote migration promotion remains disabled until one approved bootstrap:

1. verify the live schema fingerprint and every historical postcondition
2. repair any mismatch without replaying history
3. capture a Time Travel bookmark
4. create Wrangler's ledger with the pinned Wrangler schema
5. record historical files only after their postconditions pass
6. verify the Admin binding still owns the exact migration directory
7. store the receipt before enabling additive migration promotion

Every future migration needs a checksum, risk, consumers, preconditions,
postconditions, and rollback strategy. Recorded migration edits fail CI. The
local proof applies an additive migration twice and requires the second run to
be a no-op.

## production sequence

Production releases queue in one concurrency group. They revalidate the exact
`main` SHA, classify targets, block schema drift, capture a D1 bookmark when
needed, apply eligible migrations, deploy affected consumers, and run the
shared smoke implementation. Health responses must report the expected commit
and schema version.

Application rollback is limited to releases without a migration. A failed
migration release stops and keeps D1 unchanged after the failed file rollback.
The workflow never invokes Time Travel restore automatically.

Admin deployment is also held until the Production environment contains a
least-privileged Access identity and app-native read-only capability. The smoke
identity must read protected routes and must receive a rejection from write
routes. Secret values stay outside the repository and logs.

## current rollout state

Ordinary application promotion and application-only rollback are enabled.
Deployments still revalidate the exact `main` SHA, use serialized production
jobs, deploy only classified targets, and smoke the resulting release.

Database and authenticated Admin gates remain independent:

- remote D1 migration promotion stays held until the one-time ledger bootstrap
  is approved and verified
- authenticated Admin smoke stays held until its least-privileged production
  identity is installed and proven unable to write
- Cloudflare Access stays in front of Admin until native auth production proof
  passes

No separate application canary ceremony is required. A normal scoped release
with exact-SHA validation and smoke proof is the release proof.

`admin-solid` remains a manual rollback target until native auth production
proof is complete.
