# repository simplification map

status: implementation baseline, 2026-08-22

## ranked debt

| area | user impact | developer impact | risk | deletion opportunity |
| --- | --- | --- | --- | --- |
| public content | high | high | medium | remove manually synchronized project, writing, page, admin, and seed copies |
| brand system | high | high | low | replace app-local colors, font packets, marks, and motion rules with one package |
| release and migration truth | high | high | high | remove duplicated target and gate decisions after receipt parity is proven |
| runtime fixtures | medium | high | medium | move specimens out of production paths and expose honest provenance states |
| admin-solid rollback app | low | medium | high | remove one application and its validation path after the retirement gate passes |
| broad package boundaries | low | medium | medium | absorb exports that have no independent owner or consumer boundary |

## canonical sources

| concern | canonical source | generated or runtime projections |
| --- | --- | --- |
| public content | `content/public/**/*.md` | TypeScript defaults, validation inventory, Admin projection, additive D1 seed input |
| brand | `packages/brand` | bundled app assets and semantic CSS variables |
| release decision | typed output from `scripts/ci/release-policy.mjs` using `config/release-train.json` | CI checks, deploy targets, migration gate, deployment receipt |
| migration ownership | `apps/admin/wrangler.toml` plus immutable `drizzle/migrations/manifest.json` | Wrangler ledger and production receipt |
| local development | `pnpm dev:local:ensure|status|stop` | named loopback URLs; `localhost:4311` remains the Admin fallback |
| runtime provenance | source-backed state with `live`, `stale`, `disconnected`, `unknown`, or `fixture_only` | Admin labels and inspectors |

Published D1 `page_content` remains a versioned runtime override. It is not a
second source-controlled copy. New source defaults and additive seed payloads
must be generated from canonical public content.

## package decisions

- replace `packages/styles` with versioned `packages/brand`.
- keep `packages/content` as the public content contract and Admin projection boundary.
- keep `packages/types` while it has consumers across applications and workers.
- keep `packages/control-plane-runner` because it has an independent execution boundary.
- reduce `packages/lib` by consumer evidence. Split only when a directory has a distinct owner, runtime, or security boundary.
- remove `packages/config` only after its Tailwind, PostCSS, and TypeScript exports have zero active consumers.

## admin-solid retirement gate

`apps/admin-solid` may leave active development only when one receipt proves:

- every retained route is covered by the Astro Admin inventory.
- native registration, login, logout, session persistence, and blocked paths pass in production.
- desktop and mobile proof passes behind Access, then after the separately approved Access change.
- the previous Admin Worker and Access policy can be restored and re-smoked.
- a recovery ref preserves the last verified admin-solid source and deployment metadata.

Until then it remains manual rollback only. It must not auto-deploy or supply
normal runtime data.

## implementation order

1. repair and verify the production migration-ledger bootstrap without applying it.
2. centralize brand source and semantic tokens.
3. move public content to the canonical root and generate every source projection.
4. relocate runtime fixtures and expose provenance states.
5. build the restrained public UI layer, then redesign public routes.
6. consolidate release receipts after classifier parity tests pass.
7. execute production migration, deploy, auth, Access, and cleanup effects only through their exact gates.
