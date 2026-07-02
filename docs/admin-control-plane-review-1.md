# admin control plane review 1

date: 2026-07-02

## review surface

- event contract: `@anipotts/lib/admin-control`
- projection api: `/api/admin/projections`
- read-only mcp: `/api/mcp`
- inbox shell: `/`
- d1 migration: `drizzle/migrations/0037_admin_event_core.sql`

## contract

`admin_events` stores versioned envelopes in D1. projection tables store the
current admin views. `payload_ref` points at R2 payload blobs from day one.
aged D1 envelopes can archive to R2 later without changing the api, mcp, or ui
projection shapes.

v1 sync is refresh-on-open plus light polling. adapter and projection contracts
must remain push-swappable. target realtime architecture is durable objects plus
websocket hibernation.

## read-only mcp

`/api/mcp` exposes the same projections the Astro ui uses.

resources:

- `admin://projections/inbox_items`
- `admin://projections/piece_states`
- `admin://projections/fleet_status`
- `admin://projections/deploy_states`
- `admin://projections/capability_states`
- `admin://projections/service_registry_view`
- `admin://contracts/event`

tools:

- `admin.get_projection`
- `admin.get_inbox`
- `admin.get_capabilities`

no mcp write tools exist in this batch.

## exact connect topology diff for ani signature

apply only after Ani signs this exact policy change. personal/business
value-serving remains off.

```diff
diff --git a/Users/anipotts/.claude/rules/topology.md b/Users/anipotts/.claude/rules/topology.md
@@
+## admin mcp and agent runtime credential scope
+
+admin.anipotts.com exposes one read-only mcp surface for fleet agents.
+agents may read admin projections through `/api/mcp` using Cloudflare Access
+service tokens scoped per machine.
+
+1Password Connect may serve:
+- all-vault metadata needed to resolve item existence, ownership, and freshness.
+- curated Agent Runtime vault secret values needed by approved automation.
+
+1Password Connect must not serve:
+- Personal vault secret values.
+- Business vault secret values.
+- private personal-info registry payloads.
+- broad value export from any vault.
+
+mcp write tools, secret value-serving outside Agent Runtime, and sts token
+issuance stay disabled until a separate signed authority names the exact tool,
+machine, vault scope, and rollback path.
```

## local smoke

- `GET /api/mcp` returns read-only manifest with resources and tools.
- `POST /api/mcp` with `admin.get_inbox` returns four fixture inbox items.
- `/` and `/api/admin/projections` redirect to passkey when no local session is
  present.
