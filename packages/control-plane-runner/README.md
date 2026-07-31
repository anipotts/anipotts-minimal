# ap-mini control-plane runner

This package owns the first bounded local execution path from
`admin.anipotts.com` to ap-mini. It accepts only
`system.prove_round_trip` for `control.prove_round_trip`; it does not expose a
shell, arbitrary tool calls, or model-selected capabilities.

## durable boundaries

- ap-mini opens the outbound authenticated WebSocket.
- the private P-256 device key stays in the local state directory with mode
  `0600`; only its public JWK is enrolled remotely.
- SQLite records command receipt, execution start, outcome, and a hash-chained
  proof event before acknowledgement.
- a durable outbox resends completion proof until the relay acknowledges the
  exact device event.
- duplicate admin submissions resolve to the original command through the
  idempotency key.

The default state directory is
`~/Library/Application Support/anipotts-control-plane`. The local journal is
canonical for this slice. The Durable Object stores only command delivery and
redacted proof acknowledgement state.

## local verification

From the repository root:

```bash
pnpm --filter @anipotts/state test:control
pnpm --filter @anipotts/control-plane-runner test
pnpm --filter @anipotts/control-plane-runner typecheck
pnpm --filter @anipotts/state typecheck
```

The integration test provisions an isolated temporary device identity, crosses
the signed Worker handshake and replay-safe nonce boundary, executes one
command, verifies the local journal chain, and removes the temporary state.

## live enrollment gate

Live operation still requires one exact infrastructure approval covering the
real ap-mini identity, the state Worker public-key binding, state and admin
deployments, and a persistent supervised runner. Prepare rollback before that
approval. Do not print the private JWK, add it to Git, or place it in model
context.
