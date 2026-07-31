import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import type {
  ControlCommandSubmission,
  ControlPlaneSnapshot,
} from "@anipotts/types";
import { provisionDeviceIdentity } from "../../../packages/control-plane-runner/src/device-identity";
import { LocalJournal } from "../../../packages/control-plane-runner/src/journal";
import { ControlPlaneRunner } from "../../../packages/control-plane-runner/src/runner";

const root = mkdtempSync(join(tmpdir(), "control-plane-integration-"));
const stateRoot = join(root, "mini-state");
const port = 18_799;
const baseUrl = `http://127.0.0.1:${port}`;
const worker = Bun.spawn(
  [
    "pnpm",
    "exec",
    "wrangler",
    "dev",
    "-c",
    "wrangler.test.toml",
    "--port",
    String(port),
    "--persist-to",
    join(root, "wrangler"),
  ],
  {
    cwd: resolve(import.meta.dir, ".."),
    stdout: "pipe",
    stderr: "pipe",
  },
);

try {
  await waitForWorker(`${baseUrl}/snapshot`);
  const now = new Date();
  const command: ControlCommandSubmission = {
    contract_version: 1,
    command_id: crypto.randomUUID(),
    idempotency_key: crypto.randomUUID(),
    kind: "system.prove_round_trip",
    target: {
      device_id: "ap-mini",
      capability: "control.prove_round_trip",
    },
    authority: {
      actor_id: "ani",
      lane: "default_safe_lane",
      authenticated_by: "passkey-session",
    },
    reason: "integration-test the durable round trip",
    payload: { message: "prove one local execution" },
    valid_time: now.toISOString(),
    recorded_time: now.toISOString(),
    expires_at: new Date(now.getTime() + 300_000).toISOString(),
  };
  const accepted = await fetch(`${baseUrl}/commands`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(command),
  });
  if (!accepted.ok)
    throw new Error(`command submit failed: ${accepted.status}`);

  const privateKeyPath = join(stateRoot, "device-private.jwk");
  const journalPath = join(stateRoot, "journal.sqlite");
  await provisionDeviceIdentity(privateKeyPath);
  const runner = new ControlPlaneRunner({
    relayUrl: `ws://127.0.0.1:${port}/connect`,
    journalPath,
    privateKeyPath,
    once: true,
  });
  try {
    await runner.run();
  } finally {
    runner.close();
  }

  const snapshotResponse = await fetch(`${baseUrl}/snapshot`);
  const snapshot = (await snapshotResponse.json()) as ControlPlaneSnapshot;
  const completed = snapshot.commands.find(
    (entry) => entry.command_id === command.command_id,
  );
  if (completed?.state !== "succeeded" || !completed.proof) {
    throw new Error("relay did not retain the completed proof");
  }

  const journal = new LocalJournal(journalPath);
  const verification = journal.verifyChain();
  journal.close();
  if (!verification.valid || verification.events !== 3) {
    throw new Error("local journal chain verification failed");
  }
  console.log(
    JSON.stringify({
      command_id: command.command_id,
      relay_state: completed.state,
      proof_ref: completed.proof.evidence_ref,
      journal_events: verification.events,
      journal_head_hash: verification.head,
    }),
  );
} finally {
  worker.kill();
  await worker.exited;
  rmSync(root, { recursive: true, force: true });
}

async function waitForWorker(url: string): Promise<void> {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Wrangler is still starting.
    }
    await Bun.sleep(200);
  }
  throw new Error("test relay did not start");
}
