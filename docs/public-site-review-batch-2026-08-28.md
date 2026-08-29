# Public site review batch: 2026-08-28

## Scope

- Branch: `codex/public-site-review-batch-2026-08-28`
- Base: `7d621175f4a9d7532af8d3b495691cb22bb62c72`
- Targets: public site, Astro Admin, and state worker through shared public-content contracts
- Excluded: Portless removal, legacy Admin, migrations, D1 writes, authentication, Cloudflare Access, credentials, endpoints, and provider configuration

## Local verification

- `git diff --check`
- `pnpm content:check`
- `pnpm test:brand`
- `pnpm test:content-platform`
- `pnpm test:public-routes`
- `pnpm test:public-copy`
- `pnpm check:changed`
- `pnpm validate`
- public, Admin, and state focused typechecks and builds
- static security review and public-copy privacy scan

The release classifier selected `www=true`, `admin=true`, and `state=true`. It selected `admin_solid=false`, `d1_changed=false`, `migration_preflight_required=false`, and migration risk `none`.

## Browser verification

The following routes were reviewed through hard reload and client navigation:

- `/`
- `/making`
- `/writing`
- `/systems`
- `/projects/pgi-research-platform`
- `/projects/structured-ai`
- `/projects/claude-code-tips`

Each route passed at 1440 by 1024 and 390 by 844 in light and dark themes. The review covered semantic controls, image alternatives, missing assets, document overflow, card containment, footer placement, console warnings and errors, keyboard focus, and theme transitions. `/making` intentionally retains its contained horizontal card carousel at the mobile breakpoint; the document itself does not overflow.

Reduced-motion emulation produced no active animations. Making, writing, and experience-card arrows share the same semantic contract: muted at rest and the paper accent on hover or keyboard focus. Light mode resolves to the restrained blue accent and dark mode resolves to the light-blue accent.

## Production boundary

This receipt proves the local branch only. Merge, deployment, live release SHA, target-specific smoke evidence, and rollback versions are recorded after the exact checked head is promoted.
