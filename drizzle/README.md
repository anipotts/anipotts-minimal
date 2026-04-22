# drizzle/

Drizzle-kit output for `anipotts-db` (Cloudflare D1, SQLite dialect).

Schema source: `packages/lib/src/db/schema.ts`. Config: root `drizzle.config.ts`.

## Migration baseline

Tables 1-20 are baseline — they were created via `wrangler d1 execute anipotts-db --file=supabase/d1-schema.sql` before drizzle-kit was adopted. The `supabase/` folder is a historical migration relic; Supabase itself is not used.

Migration `0001_service_registry.sql` is the first Drizzle-tracked migration, authored by hand (not `drizzle-kit generate`) to avoid regenerating the 20 baseline `CREATE TABLE` statements.

## Apply

```bash
# Preview on local D1 first:
wrangler d1 execute anipotts-db --local --file=drizzle/migrations/0001_service_registry.sql

# Apply to production D1:
wrangler d1 execute anipotts-db --remote --file=drizzle/migrations/0001_service_registry.sql
```

Session 2b reviews and applies.
