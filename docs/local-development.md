# local development

The repo uses the pinned Portless `0.15.5` package for named local URLs. The
default setup is deliberately rootless and loopback-only:

- public site: `http://anipotts.localhost:1355/`
- Admin: `http://admin.anipotts.localhost:1355/`
- Admin fallback: `http://localhost:4311/`

Start or reuse both named previews:

```bash
pnpm dev:local:ensure
```

Inspect ownership and health without changing anything:

```bash
pnpm dev:local:status
pnpm admin:preview:status
```

Stop only the two Portless app processes owned by the current worktree:

```bash
pnpm dev:local:stop
```

The stop command leaves the shared rootless proxy and the managed Admin
fallback alone. Use `pnpm admin:preview:stop` only when Ani explicitly ends the
Admin feedback loop.

## safety model

The repo manager always sets the following values itself:

- HTTP on port `1355`
- TLS off
- LAN mode off
- host-file synchronization off
- one shared ignored state directory resolved through Git's common directory

It does not install a service, request `sudo`, trust a CA, edit `/etc/hosts`, or
bind ports `80` and `443`. Clean no-port HTTPS URLs are a separate machine-level
promotion that needs exact approval.

Admin's named preview allowance accepts only `GET` and `HEAD` for `/`, `/inbox`,
and `/work`. It requires Astro development mode and either the legacy loopback
origin or the exact `admin.anipotts.localhost` hostname shape on the approved
Portless port. Production middleware, protected APIs, write routes, password
auth, passkeys, and Cloudflare Access are unchanged.

## worktrees and HMR

Portless provides each linked worktree its own route and random application
port while sharing one proxy. A branch such as `codex/feature-auth` receives
URLs shaped like:

- `http://feature-auth.anipotts.localhost:1355/`
- `http://feature-auth.admin.anipotts.localhost:1355/`

Each worktree stores only its own process metadata and logs under ignored
`.local/portless-preview/`. Portless forwards WebSockets, so Astro HMR works
through the named URLs.
