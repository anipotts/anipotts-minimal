# legacy Next admin archive

The old `apps/admin` Next.js implementation was removed from the working tree
on 2026-06-27 as part of the Astro-first admin migration.

Reason:

- `apps/admin-solid` owns the live canonical `admin.anipotts.com` route during
  migration.
- `apps/admin` is now the new Astro admin target.
- the old Next tree had many stale write/control surfaces and broad dependencies
  that conflicted with the minimal platform target.

Recovery:

- use git history before commit `e49cda4e9311b26973f85bb123c3fc1d9e8ed1a7` or
  the branch that introduced this archive note.
- do not restore the old app as a production target unless a specific route or
  model is intentionally ported.
