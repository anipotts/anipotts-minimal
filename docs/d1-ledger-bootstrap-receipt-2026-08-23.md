# D1 ledger bootstrap receipt

The production `anipotts-db` Wrangler ledger was established on August 23,
2026 Eastern time without replaying historical migrations.

- owner: `apps/admin/wrangler.toml`, binding `DB`
- baseline: `0043_admin_auth_v2.sql`
- schema before ledger: `sha256:8ffd0dacff04904a34b40b2be4436c0121ac56a8f8f68c660c16237fac5a43f4`
- bootstrap SQL: `sha256:6b2720c95dc1392d103373d6645d41c6a4a18e09be92aa986d03bea05b2e05d7`
- historical evidence: 29 data-bearing migrations passed, zero preflight rows written
- ledger result: 40 distinct historical names, ids 1 through 40
- bootstrap result: 41 statements, 123 reported rows written
- pre-bootstrap bookmark: `00000453-00000d4a-000050d1-4c6573e3382401a3f0d56eb9ccf8427c`
- pre-0043 bookmark: `00000454-00000008-000050d1-e169b96dc06d2e56ee2a6f2e7fe1e0f3`
- `0043` result: applied once by Wrangler, ledger row 41
- trusted active passkeys: 2 before and 2 after
- final schema: 64 tables, 87 indexes, 6 triggers
- final fingerprint: `sha256:dccfe386fcab350e62bf3da2d5fb961dab0ec5f6b6e9227cab1cfc13f3625df3`

Cloudflare Access stayed active. No Admin application deployment, owner seed,
provider change, credential mutation, or Time Travel restore occurred.

Rollback for the additive auth schema is a forward fix. Restore D1 from the
captured bookmark only through a separate exact recovery approval.
