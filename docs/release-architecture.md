# trustworthy releases

The repository has one release classifier and five GitHub workflows. Safe code
can move automatically after the checks pass. Protected changes need exact Ani
approval for the current commit.

## required checks

- `Build, lint, typecheck, test`
- `Security Review`
- `Migration Preflight`
- `Promotion Policy`

`main` must be current before merge and unresolved review conversations must be
closed. The one-person approval rule is replaced by release policy. Protected
changes accept an owner review attached to the current commit or the exact PR
comment `/approve-release <full-head-sha>`.

Agent branches from this repository use GitHub native auto-merge with a merge
commit. GitHub waits for branch protection instead of a polling loop. Docs-only
changes may still use the administrator bypass. Deployable files use a PR.
Manual deployment is limited to Ani, the exact supplied main SHA, and the main
branch.

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

`apps/admin` is the only intended migration owner. The historical SQL directory
is not configured in Wrangler yet because production has no Wrangler ledger.
Replaying those files would be unsafe.

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
6. configure `migrations_dir` in the Admin binding
7. store the receipt and enable automatic additive migration promotion

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

All production gates in `config/release-train.json` are held. Merging this
foundation cannot deploy an app or apply a migration. Enable each gate only
after its canary receipt exists:

1. merge this foundation and install required branch checks
2. prove native auto-merge with a harmless deployable PR
3. install and verify the read-only Admin identity
4. approve and execute the one-time D1 ledger bootstrap
5. run one additive migration canary
6. run one app canary and deliberately exercise Worker rollback
7. enable safe automatic production promotion

`admin-solid` remains a manual rollback target until native auth production
proof is complete.
