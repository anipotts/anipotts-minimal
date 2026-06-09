# drizzle/

Migrations for `anipotts-db` (Cloudflare D1, SQLite dialect).

**`packages/lib/src/db/schema.ts` is the one canonical schema source** for all 23 regular tables, including `rate_limits`. The previous authorities are gone: `supabase/` (historical relic, deleted 2026-06-09) and `baseline.sql` (stale snapshot missing the migration-003 distribution columns, deleted 2026-06-09).

Out-of-ORM objects Drizzle cannot express — the `thoughts_fts` FTS5 virtual table and its 3 triggers — live in the hand-authored companion migration `migrations/0003_reconcile.sql`. They are part of the same versioned migration set; drizzle-kit never touches them.

## Migration baseline

The baseline tables were created via raw SQL before drizzle-kit was adopted. Migration `0001_service_registry.sql` is the first Drizzle-tracked migration, authored by hand (not `drizzle-kit generate`) to avoid regenerating the baseline `CREATE TABLE` statements.

`0003_reconcile.sql` (additive FTS5 canon + gated projects_fts drop) and `0004_drop_dead_tables.sql` (fully gated, phase-3 supervised) are authored but NOT applied. Snapshot before any apply.

## Apply

```bash
# Preview on local D1 first:
wrangler d1 execute anipotts-db --local --file=drizzle/migrations/0001_service_registry.sql

# Apply to production D1:
wrangler d1 execute anipotts-db --remote --file=drizzle/migrations/0001_service_registry.sql
```

Session 2b reviews and applies.
